/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ParallaxJourneyEngine — 全屏电影级 Z 轴视差渲染引擎
 *
 *  4 层 Z 轴深度架构:
 *    Layer 0 — SkyboxLayer       (z=0, parallax=0.2)  Shader 天空盒
 *    Layer 1 — EnvironmentLayer  (z=1, parallax=0.6)  季节插画
 *    Layer 2 — AnchorLayer       (z=2, parallax=1.0)  用户照片+信息
 *    Layer 3 — WeatherParticleLayer (z=3, parallax=1.5) 天气粒子
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ────────────────── 类型定义 ──────────────────

export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }

export interface ParallaxLayerConfig {
    id: string;
    zIndex: number;
    /** 视差系数: 0=完全静止, 1=1:1跟随, >1=近景超越 */
    parallaxFactor: number;
    /** 渲染回调 */
    render: (ctx: CanvasRenderingContext2D, offset: Vec2, scale: number, dt: number) => void;
    /** 是否响应陀螺仪 */
    gyroEnabled: boolean;
}

export interface GyroState {
    /** 设备倾斜角 (弧度) */
    tiltX: number;  // beta  → pitch
    tiltY: number;  // gamma → roll
    /** 平滑后的值 */
    smoothX: number;
    smoothY: number;
}

export interface CameraState {
    /** 摄像机世界坐标偏移 (由旅程飞行驱动) */
    position: Vec2;
    /** 目标位置 (lerp 目标) */
    target: Vec2;
    /** 缩放 */
    zoom: number;
    targetZoom: number;
}

// ────────────────── 数学工具 ──────────────────

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function smoothDamp(current: number, target: number, velocity: { v: number }, smoothTime: number, dt: number): number {
    const omega = 2 / smoothTime;
    const x = omega * dt;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    const change = current - target;
    const temp = (velocity.v + omega * change) * dt;
    velocity.v = (velocity.v - omega * temp) * exp;
    return target + (change + temp) * exp;
}

// ────────────────── 视差滚动计算公式 ──────────────────

/**
 * 核心视差公式:
 *   layerOffset = cameraPosition × parallaxFactor + gyroOffset × (1 - parallaxFactor)
 *
 * 其中:
 *   - parallaxFactor=0.2 → 远景层只移动摄像机位移的 20%，产生远处感
 *   - parallaxFactor=1.0 → 锚点层完全同步，绝对稳定
 *   - parallaxFactor=1.5 → 近景层超越移动，产生前景冲击感
 *
 * Z 轴缩放:
 *   layerScale = 1 + (parallaxFactor - 1) × depthScaleFactor
 *   近景层微放大，远景层微缩小，模拟透视
 */
function computeLayerTransform(
    camera: CameraState,
    gyro: GyroState,
    layer: ParallaxLayerConfig
): { offset: Vec2; scale: number } {
    const pf = layer.parallaxFactor;

    // 视差位移
    const parallaxX = camera.position.x * pf;
    const parallaxY = camera.position.y * pf;

    // 陀螺仪偏移 (反向补偿，远景少动，近景多动)
    const GYRO_INTENSITY = 15; // 最大像素偏移
    const gyroX = layer.gyroEnabled ? gyro.smoothX * GYRO_INTENSITY * pf : 0;
    const gyroY = layer.gyroEnabled ? gyro.smoothY * GYRO_INTENSITY * pf : 0;

    // Z 轴透视缩放
    const DEPTH_SCALE_FACTOR = 0.05;
    const scale = camera.zoom * (1 + (pf - 1) * DEPTH_SCALE_FACTOR);

    return {
        offset: { x: parallaxX + gyroX, y: parallaxY + gyroY },
        scale: clamp(scale, 0.5, 3.0),
    };
}

// ────────────────── ParallaxJourneyEngine 核心类 ──────────────────

export class ParallaxJourneyEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private layers: ParallaxLayerConfig[] = [];
    private camera: CameraState;
    private gyro: GyroState;
    private rafId = 0;
    private lastTime = 0;
    private velocityX = { v: 0 };
    private velocityY = { v: 0 };
    private velocityZoom = { v: 0 };

    /** 外部回调: 每帧渲染完成 */
    onFrameComplete?: (dt: number) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;

        this.camera = {
            position: { x: 0, y: 0 },
            target: { x: 0, y: 0 },
            zoom: 1.0,
            targetZoom: 1.0,
        };

        this.gyro = {
            tiltX: 0, tiltY: 0,
            smoothX: 0, smoothY: 0,
        };

        this.setupGyroscope();
        this.resize();
        window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    // ────── 层级注册 ──────

    addLayer(config: ParallaxLayerConfig): this {
        this.layers.push(config);
        this.layers.sort((a, b) => a.zIndex - b.zIndex); // 远 → 近
        return this;
    }

    /**
     * 快速构建标准 4 层架构
     */
    buildStandardLayers(renderers: {
        skybox: ParallaxLayerConfig['render'];
        environment: ParallaxLayerConfig['render'];
        anchor: ParallaxLayerConfig['render'];
        weatherParticle: ParallaxLayerConfig['render'];
    }): this {
        this.addLayer({
            id: 'skybox',
            zIndex: 0,
            parallaxFactor: 0.2,
            render: renderers.skybox,
            gyroEnabled: true,
        });
        this.addLayer({
            id: 'environment',
            zIndex: 1,
            parallaxFactor: 0.6,
            render: renderers.environment,
            gyroEnabled: true,
        });
        this.addLayer({
            id: 'anchor',
            zIndex: 2,
            parallaxFactor: 1.0,
            render: renderers.anchor,
            gyroEnabled: true,
        });
        this.addLayer({
            id: 'weatherParticle',
            zIndex: 3,
            parallaxFactor: 1.5,
            render: renderers.weatherParticle,
            gyroEnabled: false, // 粒子有自己的物理
        });
        return this;
    }

    // ────── 摄像机控制 ──────

    /**
     * 飞往目标位置 (SmoothDamp 过渡)
     */
    flyTo(targetX: number, targetY: number, zoom?: number) {
        this.camera.target = { x: targetX, y: targetY };
        if (zoom !== undefined) this.camera.targetZoom = zoom;
    }

    /**
     * 瞬间跳转 (无过渡)
     */
    jumpTo(x: number, y: number, zoom?: number) {
        this.camera.position = { x, y };
        this.camera.target = { x, y };
        if (zoom !== undefined) {
            this.camera.zoom = zoom;
            this.camera.targetZoom = zoom;
        }
    }

    // ────── 陀螺仪 ──────

    private setupGyroscope() {
        if (typeof DeviceOrientationEvent === 'undefined') return;

        const handler = (e: DeviceOrientationEvent) => {
            const beta = e.beta ?? 0;   // -180 ~ 180 (前后倾)
            const gamma = e.gamma ?? 0; // -90 ~ 90  (左右倾)
            // 归一化到 [-1, 1]
            this.gyro.tiltX = clamp(beta / 45, -1, 1);
            this.gyro.tiltY = clamp(gamma / 45, -1, 1);
        };

        // iOS 13+ 需要权限请求
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            (DeviceOrientationEvent as any).requestPermission().then((state: string) => {
                if (state === 'granted') {
                    window.addEventListener('deviceorientation', handler, { passive: true });
                }
            });
        } else {
            window.addEventListener('deviceorientation', handler, { passive: true });
        }
    }

    // ────── 渲染循环 ──────

    start() {
        this.lastTime = performance.now();
        const loop = (now: number) => {
            const dt = Math.min((now - this.lastTime) / 1000, 0.1); // cap at 100ms
            this.lastTime = now;

            this.update(dt);
            this.render(dt);

            this.onFrameComplete?.(dt);
            this.rafId = requestAnimationFrame(loop);
        };
        this.rafId = requestAnimationFrame(loop);
    }

    stop() {
        cancelAnimationFrame(this.rafId);
    }

    private update(dt: number) {
        // ── 摄像机 SmoothDamp ──
        const SMOOTH_TIME = 0.8; // 秒, 越大越丝滑
        this.camera.position.x = smoothDamp(
            this.camera.position.x, this.camera.target.x,
            this.velocityX, SMOOTH_TIME, dt
        );
        this.camera.position.y = smoothDamp(
            this.camera.position.y, this.camera.target.y,
            this.velocityY, SMOOTH_TIME, dt
        );
        this.camera.zoom = smoothDamp(
            this.camera.zoom, this.camera.targetZoom,
            this.velocityZoom, SMOOTH_TIME * 0.5, dt
        );

        // ── 陀螺仪平滑 ──
        const GYRO_SMOOTH = 0.08;
        this.gyro.smoothX = lerp(this.gyro.smoothX, this.gyro.tiltX, GYRO_SMOOTH);
        this.gyro.smoothY = lerp(this.gyro.smoothY, this.gyro.tiltY, GYRO_SMOOTH);
    }

    private render(dt: number) {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 从远到近逐层渲染
        for (const layer of this.layers) {
            const { offset, scale } = computeLayerTransform(this.camera, this.gyro, layer);

            ctx.save();
            // 应用视差偏移和缩放
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(scale, scale);
            ctx.translate(-canvas.width / 2 - offset.x, -canvas.height / 2 - offset.y);

            layer.render(ctx, offset, scale, dt);

            ctx.restore();
        }
    }

    private resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ────── 层级访问 ──────

    getLayer(id: string): ParallaxLayerConfig | undefined {
        return this.layers.find(l => l.id === id);
    }

    get cameraState(): Readonly<CameraState> { return this.camera; }
    get gyroState(): Readonly<GyroState> { return this.gyro; }
}
