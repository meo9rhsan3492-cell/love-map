/**
 * ═══════════════════════════════════════════════════════════════════
 *  SeasonScheduler — 季节调度器核心控制类
 *  将连续的日期映射为 [0, 1) 季节进度，驱动着色器、粒子和动画
 * ═══════════════════════════════════════════════════════════════════
 */

// ────────────────── 1. 类型定义 ──────────────────

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonState {
    /** 全年连续进度 0.0 ~ 1.0 (0=立春, 0.25=立夏, 0.5=立秋, 0.75=立冬) */
    progress: number;
    /** 当前主季节 */
    current: Season;
    /** 下一个季节 */
    next: Season;
    /** 当前季节内的局部过渡进度 0.0~1.0 */
    localProgress: number;
    /** 昼夜进度 0.0~1.0 (0=午夜, 0.25=日出, 0.5=正午, 0.75=日落) */
    dayProgress: number;
    /** 色调偏移 (Oklab hue offset) */
    hueShift: number;
    /** 积雪覆盖度 0.0~1.0 */
    snowCoverage: number;
    /** 粒子发射参数 */
    particles: ParticleEmitParams;
    /** 插画关键帧混合 */
    illustrationBlend: IllustrationBlend;
}

export interface ParticleEmitParams {
    springBloom: { rate: number; alpha: number };
    autumnLeaf: { rate: number; alpha: number };
    winterSnow: { rate: number; alpha: number };
    summerFirefly: { rate: number; alpha: number };
}

export interface IllustrationBlend {
    fromFrame: number;      // 关键帧索引 0-4
    toFrame: number;        // 关键帧索引 0-4
    dissolveProgress: number; // 溶解进度 0.0~1.0
}

// ────────────────── 2. 季节进度映射 ──────────────────

const SEASON_ORDER: Season[] = ['spring', 'summer', 'autumn', 'winter'];

/**
 * 从日期字符串计算全年连续进度
 * 立春(2/4) ≈ day 35 → progress 0.0
 * 使用正弦曲线拟合的天文季节偏移
 */
export function dateToSeasonProgress(dateStr: string): number {
    const d = new Date(dateStr);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);

    // 立春偏移：第35天 ≈ 2月4日
    const LICHUN_OFFSET = 35;
    const shifted = (dayOfYear - LICHUN_OFFSET + 365) % 365;
    return shifted / 365;
}

/**
 * 从日期字符串计算昼夜进度
 * 0.0=午夜, 0.25=06:00, 0.5=正午, 0.75=18:00
 */
export function dateToDayProgress(dateStr: string): number {
    const d = new Date(dateStr);
    const h = d.getHours();
    const m = d.getMinutes();
    // 无时间信息时根据季节推断
    if (h === 0 && m === 0 && !dateStr.includes('T')) {
        const progress = dateToSeasonProgress(dateStr);
        if (progress < 0.25 || progress >= 0.75) return 0.42; // 春/冬 → 下午
        return 0.35; // 夏/秋 → 上午
    }
    return (h + m / 60) / 24;
}

// ────────────────── 3. 高斯曲线工具 ──────────────────

/**
 * 标准化高斯函数: G(x, μ, σ)
 * 用于粒子发射率的平滑淡入淡出
 */
function gaussian(x: number, mu: number, sigma: number): number {
    const d = x - mu;
    return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * 循环高斯 (考虑0/1边界连续性)
 * 用于季节交替时的数学连续性
 */
function cyclicGaussian(x: number, mu: number, sigma: number): number {
    // 取环形距离最小值
    const d1 = Math.abs(x - mu);
    const d2 = Math.abs(x - mu + 1);
    const d3 = Math.abs(x - mu - 1);
    const d = Math.min(d1, d2, d3);
    return Math.exp(-(d * d) / (2 * sigma * sigma));
}

// ────────────────── 4. Smoothstep 插值 ──────────────────

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

function smootherstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// ────────────────── 5. 核心计算引擎 ──────────────────

/**
 * 季节调度器：从进度值计算完整的渲染状态
 */
export function computeSeasonState(seasonProgress: number, dayProgress: number): SeasonState {
    const p = ((seasonProgress % 1) + 1) % 1; // clamp to [0,1)

    // ────── 5.1 季节判定 ──────
    const seasonIndex = Math.floor(p * 4);
    const localProgress = (p * 4) % 1;
    const current = SEASON_ORDER[seasonIndex];
    const next = SEASON_ORDER[(seasonIndex + 1) % 4];

    // ────── 5.2 色调偏移 (Oklab H通道) ──────
    // 春(120° 嫩绿) → 夏(90° 深绿) → 秋(30° 橙黄) → 冬(200° 枯灰蓝)
    const HUE_KEYFRAMES = [120, 90, 30, 200]; // 对应 spring, summer, autumn, winter
    const h0 = HUE_KEYFRAMES[seasonIndex];
    const h1 = HUE_KEYFRAMES[(seasonIndex + 1) % 4];
    // 用 smootherstep 做非线性插值避免突变
    const t = smootherstep(0, 1, localProgress);
    // 处理色相环绕 (200→120 需要经过 360→0)
    let hueShift: number;
    if (Math.abs(h1 - h0) > 180) {
        const h0n = h0 > 180 ? h0 - 360 : h0;
        const h1n = h1 > 180 ? h1 - 360 : h1;
        hueShift = ((h0n + (h1n - h0n) * t) + 360) % 360;
    } else {
        hueShift = h0 + (h1 - h0) * t;
    }

    // ────── 5.3 物理积雪 ──────
    // 冬季区间 [0.75, 1.0] + [0.0, 0.05] 积雪覆盖
    // 使用 smoothstep 平滑叠加
    let snowCoverage = 0;
    if (p >= 0.70) {
        // 入冬渐积 (10月下旬 ~ 冬至)
        snowCoverage = smoothstep(0.70, 0.85, p);
    } else if (p < 0.10) {
        // 冬末融化 (立春前后)
        snowCoverage = 1.0 - smoothstep(0.02, 0.10, p);
    }

    // ────── 5.4 粒子高斯调度 ──────
    // 每种粒子以高斯分布围绕其季节中心
    const SIGMA = 0.08; // 控制扩散宽度
    const particles: ParticleEmitParams = {
        springBloom: {
            rate: cyclicGaussian(p, 0.125, SIGMA),     // 春中心 = 0.125
            alpha: cyclicGaussian(p, 0.125, SIGMA * 1.2),
        },
        summerFirefly: {
            rate: cyclicGaussian(p, 0.375, SIGMA),     // 夏中心 = 0.375
            alpha: cyclicGaussian(p, 0.375, SIGMA * 1.2),
        },
        autumnLeaf: {
            rate: cyclicGaussian(p, 0.625, SIGMA),     // 秋中心 = 0.625
            alpha: cyclicGaussian(p, 0.625, SIGMA * 1.2),
        },
        winterSnow: {
            rate: cyclicGaussian(p, 0.875, SIGMA),     // 冬中心 = 0.875
            alpha: cyclicGaussian(p, 0.875, SIGMA * 1.2),
        },
    };

    // ────── 5.5 插画关键帧混合 ──────
    // 关键帧: 0=冬枝, 1=春花, 2=夏叶, 3=秋叶, 4=冬枝(回环)
    const FRAME_POSITIONS = [0, 0.25, 0.5, 0.75, 1.0];
    let fromFrame = 0, toFrame = 1;
    for (let i = 0; i < FRAME_POSITIONS.length - 1; i++) {
        if (p >= FRAME_POSITIONS[i] && p < FRAME_POSITIONS[i + 1]) {
            fromFrame = i;
            toFrame = i + 1;
            break;
        }
    }
    const frameStart = FRAME_POSITIONS[fromFrame];
    const frameEnd = FRAME_POSITIONS[toFrame];
    const dissolveProgress = smootherstep(0, 1, (p - frameStart) / (frameEnd - frameStart));

    return {
        progress: p,
        current,
        next,
        localProgress,
        dayProgress,
        hueShift,
        snowCoverage,
        particles,
        illustrationBlend: { fromFrame, toFrame: toFrame % 5, dissolveProgress },
    };
}

// ────────────────── 6. React Hook ──────────────────

import { useMemo } from 'react';

export function useSeasonState(memoryDate?: string) {
    return useMemo(() => {
        if (!memoryDate) return null;
        const sp = dateToSeasonProgress(memoryDate);
        const dp = dateToDayProgress(memoryDate);
        return computeSeasonState(sp, dp);
    }, [memoryDate]);
}
