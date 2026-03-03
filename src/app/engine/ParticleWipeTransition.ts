/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ParticleWipeTransition — 物理遮挡转场
 *
 *  利用 WeatherParticleLayer 实现无缝遮挡转场:
 *    1. 粒子瞬时爆发 → 覆盖 100% 屏幕
 *    2. 在完全遮蔽瞬间触发场景替换回调
 *    3. 风场翻转 → 粒子飞散 → 露出新场景
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ────────────────── 类型 ──────────────────

export type WipePhase = 'idle' | 'burst' | 'covered' | 'scatter' | 'complete';

export interface WipeParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    life: number;
}

export interface WindField {
    direction: number;   // 弧度
    strength: number;    // px/frame
    turbulence: number;  // 0~1
}

export interface WipeConfig {
    /** 爆发阶段粒子数量 */
    burstCount: number;
    /** 爆发阶段时长 (秒) */
    burstDuration: number;
    /** 散场阶段时长 (秒) */
    scatterDuration: number;
    /** 遮蔽阈值 (0~1, 屏幕被粒子覆盖的比例) */
    coverageThreshold: number;
    /** 粒子基础大小 (px) */
    particleSize: number;
    /** 粒子基础大小放大倍率 (爆发时) */
    burstSizeMultiplier: number;
    /** 爆发风场 */
    burstWind: WindField;
    /** 散场风场 */
    scatterWind: WindField;
    /** 粒子颜色/emoji 由季节决定 */
    particleEmoji: string;
}

// ────────────────── 默认配置 ──────────────────

const SEASON_WIPE_CONFIGS: Record<string, Partial<WipeConfig>> = {
    spring: {
        particleEmoji: '🌸',
        burstWind: { direction: Math.PI * 0.75, strength: 25, turbulence: 0.6 },
        scatterWind: { direction: Math.PI * 1.75, strength: 35, turbulence: 0.3 },
    },
    summer: {
        particleEmoji: '🍃',
        burstWind: { direction: Math.PI * 0.5, strength: 30, turbulence: 0.7 },
        scatterWind: { direction: Math.PI * 1.5, strength: 40, turbulence: 0.4 },
    },
    autumn: {
        particleEmoji: '🍂',
        burstWind: { direction: Math.PI * 0.6, strength: 20, turbulence: 0.8 },
        scatterWind: { direction: Math.PI * 1.4, strength: 30, turbulence: 0.5 },
    },
    winter: {
        particleEmoji: '❄️',
        burstWind: { direction: Math.PI * 0.5, strength: 15, turbulence: 0.9 },
        scatterWind: { direction: Math.PI * 0.5, strength: 50, turbulence: 0.2 }, // 重力加速下落
    },
};

function defaultConfig(season: string): WipeConfig {
    const override = SEASON_WIPE_CONFIGS[season] || {};
    return {
        burstCount: 400,
        burstDuration: 0.3,
        scatterDuration: 0.6,
        coverageThreshold: 0.92,
        particleSize: 14,
        burstSizeMultiplier: 6,
        burstWind: { direction: Math.PI * 0.5, strength: 20, turbulence: 0.5 },
        scatterWind: { direction: Math.PI * 1.5, strength: 30, turbulence: 0.3 },
        particleEmoji: '🌸',
        ...override,
    };
}

// ────────────────── 核心控制器 ──────────────────

export class ParticleWipeTransition {
    private phase: WipePhase = 'idle';
    private particles: WipeParticle[] = [];
    private config: WipeConfig;
    private elapsed = 0;
    private width: number;
    private height: number;
    private coverage = 0;

    /** 当屏幕被完全遮蔽时触发 (瞬间替换底层场景) */
    onScreenCovered?: () => void;
    /** 整个转场完成 */
    onComplete?: () => void;

    constructor(width: number, height: number, season: string = 'spring') {
        this.width = width;
        this.height = height;
        this.config = defaultConfig(season);
    }

    // ────── 状态机 ──────

    /**
     * 触发遮挡转场
     * @param season 当前季节 (决定粒子类型和风场)
     * @param onCovered 屏幕完全遮蔽时的回调
     * @param onDone 转场结束回调
     */
    trigger(
        season: string,
        onCovered?: () => void,
        onDone?: () => void
    ) {
        this.config = defaultConfig(season);
        this.onScreenCovered = onCovered;
        this.onComplete = onDone;
        this.phase = 'burst';
        this.elapsed = 0;
        this.coverage = 0;
        this.particles = [];

        // ── 瞬时爆发: 发射 burstCount 个粒子 ──
        this.spawnBurst();
    }

    /**
     * 瞬时爆发发射
     * 从屏幕四周 + 风向侧密集喷射
     */
    private spawnBurst() {
        const { burstCount, particleSize, burstSizeMultiplier, burstWind } = this.config;
        const windDx = Math.cos(burstWind.direction);
        const windDy = Math.sin(burstWind.direction);

        for (let i = 0; i < burstCount; i++) {
            // 从风的反方向侧生成 (粒子飞入屏幕)
            const edgeSide = Math.random();
            let x: number, y: number;

            if (edgeSide < 0.3) {
                // 从左边
                x = -particleSize * burstSizeMultiplier;
                y = Math.random() * this.height;
            } else if (edgeSide < 0.6) {
                // 从上面
                x = Math.random() * this.width;
                y = -particleSize * burstSizeMultiplier;
            } else if (edgeSide < 0.8) {
                // 从右边
                x = this.width + particleSize * burstSizeMultiplier;
                y = Math.random() * this.height;
            } else {
                // 随机位置
                x = Math.random() * this.width;
                y = Math.random() * this.height;
            }

            // 速度: 强风场 + 扰动
            const turbX = (Math.random() - 0.5) * burstWind.turbulence * burstWind.strength;
            const turbY = (Math.random() - 0.5) * burstWind.turbulence * burstWind.strength;

            this.particles.push({
                x,
                y,
                vx: windDx * burstWind.strength + turbX,
                vy: windDy * burstWind.strength + turbY,
                size: particleSize * burstSizeMultiplier * (0.5 + Math.random() * 0.8),
                alpha: 0.9 + Math.random() * 0.1,
                life: 1.0,
            });
        }
    }

    /**
     * 每帧更新 (在引擎的 onFrameComplete 中调用)
     */
    update(dt: number) {
        if (this.phase === 'idle' || this.phase === 'complete') return;

        this.elapsed += dt;

        // ── Phase: BURST (粒子涌入, 覆盖屏幕) ──
        if (this.phase === 'burst') {
            this.updateParticles(dt, this.config.burstWind);
            this.computeCoverage();

            if (this.coverage >= this.config.coverageThreshold || this.elapsed >= this.config.burstDuration) {
                // 🎯 屏幕完全遮蔽 → 触发场景替换回调
                this.phase = 'covered';
                this.onScreenCovered?.();

                // 立即切换到散场
                setTimeout(() => {
                    this.phase = 'scatter';
                    this.elapsed = 0;
                    this.reverseWind();
                }, 50); // 50ms 微延迟确保替换完成
            }
        }

        // ── Phase: SCATTER (粒子飞散, 露出新场景) ──
        else if (this.phase === 'scatter') {
            this.updateParticles(dt, this.config.scatterWind);

            if (this.elapsed >= this.config.scatterDuration || this.particles.length === 0) {
                this.phase = 'complete';
                this.particles = [];
                this.onComplete?.();
            }
        }
    }

    /**
     * 更新粒子位置
     */
    private updateParticles(dt: number, wind: WindField) {
        const windDx = Math.cos(wind.direction) * wind.strength;
        const windDy = Math.sin(wind.direction) * wind.strength;
        let writeIdx = 0;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 风力加速
            p.vx += (windDx - p.vx) * 0.1; // 趋向风速
            p.vy += (windDy - p.vy) * 0.1;

            // 扰动
            p.vx += (Math.random() - 0.5) * wind.turbulence * 5;
            p.vy += (Math.random() - 0.5) * wind.turbulence * 5;

            // 位移
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;

            // 散场时衰减
            if (this.phase === 'scatter') {
                p.alpha -= dt * 1.5;
                p.life -= dt * 0.8;
            }

            // 存活判断
            const margin = p.size * 2;
            const inBounds = p.x > -margin && p.x < this.width + margin &&
                p.y > -margin && p.y < this.height + margin;

            if (inBounds && p.alpha > 0 && p.life > 0) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
    }

    /**
     * 计算屏幕遮蔽度
     * 使用网格采样法: 将屏幕划分为 N×N 格子，检测每格是否有粒子覆盖
     */
    private computeCoverage() {
        const GRID = 20; // 20×20 = 400 个采样格
        const cellW = this.width / GRID;
        const cellH = this.height / GRID;
        const covered = new Uint8Array(GRID * GRID);

        for (const p of this.particles) {
            const gx = Math.floor(p.x / cellW);
            const gy = Math.floor(p.y / cellH);
            // 粒子大小覆盖多个格子
            const radius = Math.ceil(p.size / Math.min(cellW, cellH));
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const cx = gx + dx, cy = gy + dy;
                    if (cx >= 0 && cx < GRID && cy >= 0 && cy < GRID) {
                        covered[cy * GRID + cx] = 1;
                    }
                }
            }
        }

        let count = 0;
        for (let i = 0; i < covered.length; i++) {
            count += covered[i];
        }
        this.coverage = count / covered.length;
    }

    /**
     * 翻转风场 (进入散场阶段)
     */
    private reverseWind() {
        // 风方向翻转 180° + 增加重力
        const { scatterWind } = this.config;
        for (const p of this.particles) {
            // 瞬间施加反向冲击
            p.vx += Math.cos(scatterWind.direction) * scatterWind.strength * 0.5;
            p.vy += Math.sin(scatterWind.direction) * scatterWind.strength * 0.5;
        }
    }

    /**
     * 渲染到 Canvas
     */
    render(ctx: CanvasRenderingContext2D) {
        if (this.phase === 'idle' || this.phase === 'complete') return;

        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            ctx.font = `${p.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.config.particleEmoji, 0, 0);
            ctx.restore();
        }
    }

    // ────── 状态查询 ──────

    get currentPhase(): WipePhase { return this.phase; }
    get currentCoverage(): number { return this.coverage; }
    get isActive(): boolean { return this.phase !== 'idle' && this.phase !== 'complete'; }
    get particleCount(): number { return this.particles.length; }
}
