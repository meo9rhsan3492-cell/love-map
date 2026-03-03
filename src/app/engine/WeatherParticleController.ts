/**
 * ═══════════════════════════════════════════════════════════════════
 *  WeatherParticleController — 天气粒子系统平滑调度
 *  基于高斯曲线控制粒子生成的淡入淡出
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ParticleEmitParams } from './SeasonScheduler';

// ────────────────── 粒子定义 ──────────────────

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;     // 0.0~1.0
    maxLife: number;
    size: number;
    rotation: number;
    rotSpeed: number;
    alpha: number;
    type: 'bloom' | 'leaf' | 'snow' | 'firefly';
}

// ────────────────── 粒子类型配置 ──────────────────

const PARTICLE_CONFIG = {
    bloom: {
        emoji: '🌸',
        baseSize: [10, 18],
        baseVx: [-0.3, 0.3],    // 微风飘
        baseVy: [0.3, 0.8],     // 缓落
        baseLife: [6, 12],
        rotSpeed: [-1, 1],
    },
    leaf: {
        emoji: '🍂',
        baseSize: [12, 20],
        baseVx: [-0.8, 0.8],    // 风吹摇摆
        baseVy: [0.5, 1.2],     // 较快落
        baseLife: [5, 10],
        rotSpeed: [-3, 3],       // 翻转感
    },
    snow: {
        emoji: '❄️',
        baseSize: [6, 14],
        baseVx: [-0.2, 0.2],    // 微弱漂移
        baseVy: [0.2, 0.5],     // 缓慢飘落
        baseLife: [8, 15],
        rotSpeed: [-0.5, 0.5],
    },
    firefly: {
        emoji: '✨',
        baseSize: [4, 8],
        baseVx: [-0.5, 0.5],
        baseVy: [-0.3, 0.3],    // 上下漂浮
        baseLife: [3, 6],
        rotSpeed: [0, 0],
    },
} as const;

// ────────────────── 控制器 ──────────────────

export class WeatherParticleController {
    private particles: Particle[] = [];
    private readonly MAX_PARTICLES = 60;
    private accumulator = { bloom: 0, leaf: 0, snow: 0, firefly: 0 };
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    resize(w: number, h: number) {
        this.width = w;
        this.height = h;
    }

    /**
     * 每帧调用: 根据高斯调度参数更新粒子
     * @param params 来自 SeasonScheduler 的粒子发射参数
     * @param dt 帧间隔 (秒)
     */
    update(params: ParticleEmitParams, dt: number) {
        // ── 1. 发射新粒子 (高斯控制发射率) ──
        this.trySpawn('bloom', params.springBloom.rate, params.springBloom.alpha, dt);
        this.trySpawn('leaf', params.autumnLeaf.rate, params.autumnLeaf.alpha, dt);
        this.trySpawn('snow', params.winterSnow.rate, params.winterSnow.alpha, dt);
        this.trySpawn('firefly', params.summerFirefly.rate, params.summerFirefly.alpha, dt);

        // ── 2. 更新现有粒子 ──
        let writeIdx = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // 风力场: sin 波模拟自然风
            const windX = Math.sin(p.y * 0.01 + Date.now() * 0.001) * 0.15;

            p.x += (p.vx + windX) * dt * 60;
            p.y += p.vy * dt * 60;
            p.rotation += p.rotSpeed * dt * 60;
            p.life -= dt / p.maxLife;

            // 萤火虫特殊: 闪烁 + 上下浮动
            if (p.type === 'firefly') {
                p.vy += Math.sin(Date.now() * 0.005 + p.x) * 0.01;
                p.alpha = p.life * (0.4 + 0.6 * Math.abs(Math.sin(Date.now() * 0.008 + p.rotation)));
            }

            // 存活检查
            if (p.life > 0 && p.x > -50 && p.x < this.width + 50 && p.y < this.height + 50) {
                this.particles[writeIdx++] = p;
            }
        }
        this.particles.length = writeIdx;
    }

    /**
     * 高斯控制的粒子发射
     * rate ∈ [0, 1]: 高斯分布值，直接控制每秒发射概率
     */
    private trySpawn(
        type: Particle['type'],
        rate: number,
        maxAlpha: number,
        dt: number
    ) {
        if (this.particles.length >= this.MAX_PARTICLES) return;
        if (rate < 0.01) return; // 阈值剪裁，避免无谓计算

        // 发射率 = 基础率 × 高斯权重
        const BASE_RATE = 3; // 峰值每秒发射数
        this.accumulator[type] += rate * BASE_RATE * dt;

        while (this.accumulator[type] >= 1 && this.particles.length < this.MAX_PARTICLES) {
            this.accumulator[type] -= 1;
            this.spawn(type, maxAlpha);
        }
    }

    private spawn(type: Particle['type'], maxAlpha: number) {
        const cfg = PARTICLE_CONFIG[type];
        const rand = (min: number, max: number) => min + Math.random() * (max - min);

        this.particles.push({
            x: rand(-20, this.width + 20),
            y: type === 'firefly' ? rand(this.height * 0.3, this.height * 0.8) : rand(-30, -5),
            vx: rand(cfg.baseVx[0], cfg.baseVx[1]),
            vy: rand(cfg.baseVy[0], cfg.baseVy[1]),
            life: 1.0,
            maxLife: rand(cfg.baseLife[0], cfg.baseLife[1]),
            size: rand(cfg.baseSize[0], cfg.baseSize[1]),
            rotation: rand(0, 360),
            rotSpeed: rand(cfg.rotSpeed[0], cfg.rotSpeed[1]),
            alpha: maxAlpha,
            type,
        });
    }

    /**
     * 渲染到 Canvas
     */
    render(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            const fadeAlpha = p.type === 'firefly'
                ? p.alpha
                : p.alpha * Math.min(1, p.life * 3) * Math.min(1, (1 - p.life) * 5 + 0.5);

            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation * Math.PI / 180);
            ctx.font = `${p.size}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(PARTICLE_CONFIG[p.type].emoji, 0, 0);
            ctx.restore();
        }
    }

    /** 获取当前粒子数量（调试） */
    get count() { return this.particles.length; }
}
