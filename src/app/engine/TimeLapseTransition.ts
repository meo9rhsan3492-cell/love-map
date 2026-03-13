/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TimeLapseTransition — 时间压缩 & 着色器转场
 *
 *  Prompt 2 实现:
 *    1. Time-lapse 物理加速 — 真实时间差 → 动画播放倍率
 *    2. 定向侵蚀 Shader — 分形噪声 + 边缘高光溶解
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ════════════════════════════════════════════════
//  Part 1: 时间倍率计算
// ════════════════════════════════════════════════

export interface TimeLapseConfig {
    /** 骨骼动画的标准播放时长 (秒) */
    standardDuration: number;
    /** 最大允许倍速 */
    maxTimeScale: number;
    /** 最小倍速 (避免太慢) */
    minTimeScale: number;
}

const DEFAULT_CONFIG: TimeLapseConfig = {
    standardDuration: 8,   // 一个完整生命周期动画 = 8 秒
    maxTimeScale: 50,
    minTimeScale: 0.5,
};

/**
 * 从两张照片的真实时间差计算动画播放倍率
 *
 * 算法:
 *   realDeltaDays = |date2 - date1| in days
 *   naturalCycleDays = 365 (一年 = 一个完整生命周期)
 *   cycles = realDeltaDays / naturalCycleDays
 *   timeScale = cycles × standardDuration / transitionDuration
 *
 * 约束: clamp(minTimeScale, maxTimeScale)
 *
 * 例:
 *   两照片相隔 730 天 (2年), transitionDuration = 3s
 *   cycles = 730/365 = 2.0
 *   timeScale = 2.0 × 8 / 3 = 5.33x → 以 5.33 倍速播放
 *
 *   两照片相隔 3650 天 (10年), transitionDuration = 3s
 *   cycles = 10.0
 *   timeScale = 10 × 8 / 3 = 26.67x → 26.67 倍速闪过十年
 */
export function computeTimeScale(
    date1: string,
    date2: string,
    transitionDuration: number = 3,
    config: TimeLapseConfig = DEFAULT_CONFIG
): { timeScale: number; cycles: number; deltaDays: number } {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const deltaDays = Math.abs(d2 - d1) / (1000 * 60 * 60 * 24);

    const NATURAL_CYCLE_DAYS = 365;
    const cycles = deltaDays / NATURAL_CYCLE_DAYS;

    const rawScale = (cycles * config.standardDuration) / transitionDuration;
    const timeScale = Math.max(config.minTimeScale, Math.min(config.maxTimeScale, rawScale));

    return { timeScale, cycles, deltaDays };
}

/**
 * 将 timeScale 绑定到 Spine/Lottie 动画 Playhead
 *
 * @param animation Spine skeleton 或 Lottie AnimationItem
 * @param timeScale 播放倍率
 * @param onCycleComplete 每完成一个生命周期回调
 */
export function applyTimeLapse(
    animation: any,
    timeScale: number,
    onCycleComplete?: (cycleIndex: number) => void
) {
    // ── Lottie 绑定 ──
    if (animation.setSpeed) {
        animation.setSpeed(timeScale);
        if (onCycleComplete) {
            let cycleCount = 0;
            animation.addEventListener('loopComplete', () => {
                cycleCount++;
                onCycleComplete(cycleCount);
            });
        }
        return;
    }

    // ── Spine 绑定 ──
    if (animation.state?.setTimeScale) {
        animation.state.setTimeScale(timeScale);
        return;
    }

    // ── 通用 playbackRate ──
    if ('playbackRate' in animation) {
        animation.playbackRate = timeScale;
    }
}

// ════════════════════════════════════════════════
//  Part 2: 定向侵蚀 Shader (分形噪声转场)
// ════════════════════════════════════════════════

/**
 * 分形噪声侵蚀转场 — GLSL 片段着色器
 *
 * 效果描述:
 *   秋→冬: 冰结遮罩从屏幕四角以不规则碎冰形态向中心蔓延
 *   冬→春: 绿色脉冲从中心向四周扩散，像冰面开裂
 *   春→夏: 阳光光斑从顶部渗透，驱散花瓣
 *   夏→秋: 枯黄色从边缘像纸张燃烧般侵蚀
 *
 * 关键变量:
 *   u_erosionProgress: 0.0(旧场景完好) → 1.0(新场景完全显露)
 *   u_erosionDirection: 侵蚀方向 (0=四角向心, 1=中心外扩, 2=顶部下渗, 3=边缘燃烧)
 */
export const FRACTAL_EROSION_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D u_fromScene;        // 旧季节场景
uniform sampler2D u_toScene;          // 新季节场景
uniform float u_erosionProgress;      // 0.0 ~ 1.0
uniform int u_erosionDirection;       // 0=四角, 1=中心, 2=顶部, 3=边缘
uniform vec3 u_edgeGlowColor;        // 侵蚀边缘发光色
uniform float u_time;                 // 全局时间 (动态噪声)

varying vec2 v_uv;

// ────── 分形噪声 (FBM: Fractal Brownian Motion) ──────

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
        if (i >= octaves) break;
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// ────── 方向遮罩 ──────

float directionMask(vec2 uv, int direction) {
    if (direction == 0) {
        // 四角向心: 距离中心越远越先被侵蚀
        vec2 center = uv - 0.5;
        return length(center) * 1.6;
    } else if (direction == 1) {
        // 中心外扩: 距离中心越近越先被侵蚀
        vec2 center = uv - 0.5;
        return 1.0 - length(center) * 1.6;
    } else if (direction == 2) {
        // 顶部下渗
        return 1.0 - uv.y;
    } else {
        // 边缘燃烧: 从四边向内
        vec2 d = min(uv, 1.0 - uv);
        return min(d.x, d.y) * 4.0;
    }
}

void main() {
    vec4 fromColor = texture2D(u_fromScene, v_uv);
    vec4 toColor = texture2D(u_toScene, v_uv);

    // Step 1: 生成侵蚀噪声
    float fractalNoise = fbm(v_uv * 8.0 + u_time * 0.3, 5);

    // Step 2: 叠加方向遮罩
    float dirMask = directionMask(v_uv, u_erosionDirection);

    // Step 3: 合成侵蚀阈值
    // 噪声为侵蚀提供不规则碎冰/裂纹形态
    // 方向遮罩控制侵蚀的整体推进方向
    float erosionThreshold = fractalNoise * 0.6 + dirMask * 0.4;

    // Step 4: 侵蚀判定
    float EDGE_WIDTH = 0.06;
    float threshold = u_erosionProgress * 1.3; // 略超1.0确保完全覆盖

    if (erosionThreshold < threshold - EDGE_WIDTH) {
        // 完全侵蚀 → 新场景
        gl_FragColor = toColor;
    } else if (erosionThreshold < threshold) {
        // 侵蚀边缘 → 高光发光
        float edgeFactor = (erosionThreshold - (threshold - EDGE_WIDTH)) / EDGE_WIDTH;

        // 边缘高光: 发光色 + 亮度脉冲
        vec3 glow = u_edgeGlowColor * (1.0 + 0.5 * sin(u_time * 8.0));
        float glowIntensity = (1.0 - edgeFactor) * 0.8;

        vec4 edged = mix(toColor, vec4(glow, 1.0), glowIntensity);
        gl_FragColor = edged;
    } else {
        // 未被侵蚀 → 旧场景
        gl_FragColor = fromColor;
    }
}
`;

// ────── 季节对应侵蚀配置 ──────

export interface ErosionConfig {
    direction: 0 | 1 | 2 | 3;
    edgeGlowColor: [number, number, number]; // RGB normalized
    durationMs: number;
}

export const SEASON_EROSION_PRESETS: Record<string, ErosionConfig> = {
    'autumn_to_winter': {
        direction: 0,    // 四角向心 → 冰结蔓延
        edgeGlowColor: [0.7, 0.85, 1.0],  // 冰蓝色
        durationMs: 2500,
    },
    'winter_to_spring': {
        direction: 1,    // 中心外扩 → 冰面开裂
        edgeGlowColor: [0.4, 0.9, 0.3],   // 嫩绿色
        durationMs: 3000,
    },
    'spring_to_summer': {
        direction: 2,    // 顶部下渗 → 阳光渗透
        edgeGlowColor: [1.0, 0.9, 0.3],   // 金黄色
        durationMs: 2000,
    },
    'summer_to_autumn': {
        direction: 3,    // 边缘燃烧 → 枯黄蔓延
        edgeGlowColor: [1.0, 0.5, 0.1],   // 橙红色
        durationMs: 2500,
    },
};

// ────── Canvas 2D 回退: 近似分形侵蚀 ──────

function fbm2D(x: number, y: number, octaves: number = 5): number {
    let value = 0, amp = 0.5, freq = 1;
    for (let i = 0; i < octaves; i++) {
        const n = Math.sin(x * freq * 12.9898 + y * freq * 78.233) * 43758.5453;
        value += amp * (n - Math.floor(n));
        freq *= 2;
        amp *= 0.5;
    }
    return value;
}

export function canvasFractalErosion(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    progress: number,
    direction: number,
    edgeColor: [number, number, number]
) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const EDGE_WIDTH = 0.06;
    const threshold = progress * 1.3;

    // Optimization: Skip more rows/cols on slower devices (CPU bounded fallback)
    const step = w > 800 ? 4 : 2;

    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const ux = x / w, uy = y / h;
            // Lower octave count for fallback to save CPU 
            const noise = fbm2D(ux * 8, uy * 8, 3) * 0.6;

            let mask: number;
            if (direction === 0) mask = Math.sqrt((ux - 0.5) ** 2 + (uy - 0.5) ** 2) * 1.6;
            else if (direction === 1) mask = 1 - Math.sqrt((ux - 0.5) ** 2 + (uy - 0.5) ** 2) * 1.6;
            else if (direction === 2) mask = 1 - uy;
            else mask = Math.min(Math.min(ux, 1 - ux), Math.min(uy, 1 - uy)) * 4;

            const erosion = noise + mask * 0.4;

            if (erosion < threshold - EDGE_WIDTH) {
                // Already new scene (no-op if drawn underneath)
            } else if (erosion < threshold) {
                // Edge glow
                const idx = (y * w + x) * 4;
                const glow = (1 - (erosion - (threshold - EDGE_WIDTH)) / EDGE_WIDTH) * 0.7;
                // Bitwise clamp for slight speedup over Math.min
                data[idx] = (data[idx] + edgeColor[0] * 255 * glow) | 0;
                data[idx + 1] = (data[idx + 1] + edgeColor[1] * 255 * glow) | 0;
                data[idx + 2] = (data[idx + 2] + edgeColor[2] * 255 * glow) | 0;

                // Fast clamp to 255
                if (data[idx] > 255) data[idx] = 255;
                if (data[idx + 1] > 255) data[idx + 1] = 255;
                if (data[idx + 2] > 255) data[idx + 2] = 255;
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}
