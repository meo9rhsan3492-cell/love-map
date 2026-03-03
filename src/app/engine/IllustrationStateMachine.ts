/**
 * ═══════════════════════════════════════════════════════════════════
 *  IllustrationStateMachine — 离散插画过渡与动画绑定
 *  噪声溶解着色器 + Rive/Lottie Playhead 绑定
 * ═══════════════════════════════════════════════════════════════════
 */

import type { IllustrationBlend } from './SeasonScheduler';

// ────────────────── 1. 关键帧定义 ──────────────────

export interface IllustrationFrame {
    id: number;
    label: string;
    /** 静态插画资源 URL 或 Base64 */
    imageUrl?: string;
    /** Rive/Lottie 动画中对应的状态名 */
    animationState?: string;
    /** Lottie 帧范围 [start, end] */
    lottieFrames?: [number, number];
}

export const SEASON_FRAMES: IllustrationFrame[] = [
    { id: 0, label: '冬枝', animationState: 'winter_bare', lottieFrames: [0, 30] },
    { id: 1, label: '春花', animationState: 'spring_bloom', lottieFrames: [30, 60] },
    { id: 2, label: '夏叶', animationState: 'summer_full', lottieFrames: [60, 90] },
    { id: 3, label: '秋叶', animationState: 'autumn_fall', lottieFrames: [90, 120] },
    { id: 4, label: '冬枝(回环)', animationState: 'winter_bare', lottieFrames: [120, 150] },
];

// ────────────────── 2. 噪声溶解着色器 (GLSL) ──────────────────

export const DISSOLVE_FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform sampler2D u_fromTexture;    // 上一关键帧纹理
uniform sampler2D u_toTexture;      // 下一关键帧纹理
uniform sampler2D u_noiseTexture;   // Perlin/Simplex 噪声纹理
uniform float u_dissolveProgress;   // 0.0~1.0 溶解进度
uniform float u_edgeWidth;          // 溶解边缘宽度 (建议 0.05~0.15)
uniform vec3 u_edgeColor;           // 溶解边缘颜色 (如生长色: 嫩绿)

varying vec2 v_uv;

void main() {
    vec4 fromColor = texture2D(u_fromTexture, v_uv);
    vec4 toColor = texture2D(u_toTexture, v_uv);
    float noise = texture2D(u_noiseTexture, v_uv).r;

    // 溶解阈值: 噪声值低于阈值的区域先被替换
    // 这创造出"花朵从枝干上生长出来"的有机感
    float threshold = u_dissolveProgress;

    // 边缘发光带
    float edgeLow = threshold - u_edgeWidth;
    float edgeHigh = threshold;

    if (noise < edgeLow) {
        // 完全过渡到新帧
        gl_FragColor = toColor;
    } else if (noise < edgeHigh) {
        // 边缘带: 混合发光色
        float edgeMix = (noise - edgeLow) / u_edgeWidth;
        vec4 edgeGlow = vec4(u_edgeColor, 1.0);
        vec4 blended = mix(toColor, edgeGlow, edgeMix * 0.6);
        gl_FragColor = blended;
    } else {
        // 尚未溶解
        gl_FragColor = fromColor;
    }
}
`;

// ────────────────── 3. Canvas 2D 噪声溶解回退 ──────────────────

/**
 * Simplex Noise 2D (简化)
 * 用于 Canvas 回退时生成溶解噪声
 */
function simpleNoise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

/**
 * Canvas 2D 溶解过渡
 * @param ctx 目标画布
 * @param fromImg 上一帧图像
 * @param toImg 下一帧图像
 * @param progress 溶解进度 0.0~1.0
 * @param edgeColor 边缘颜色 [r,g,b] 0~255
 */
export function canvasDissolveTransition(
    ctx: CanvasRenderingContext2D,
    fromImg: HTMLImageElement | HTMLCanvasElement,
    toImg: HTMLImageElement | HTMLCanvasElement,
    progress: number,
    edgeColor: [number, number, number] = [144, 238, 144] // 嫩绿
) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 绘制 fromImage
    ctx.drawImage(fromImg, 0, 0, w, h);
    const fromData = ctx.getImageData(0, 0, w, h);

    // 绘制 toImage
    ctx.drawImage(toImg, 0, 0, w, h);
    const toData = ctx.getImageData(0, 0, w, h);

    const out = ctx.createImageData(w, h);
    const EDGE_WIDTH = 0.08;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const noise = simpleNoise2D(x * 0.02, y * 0.02);

            if (noise < progress - EDGE_WIDTH) {
                // 新帧
                out.data[i] = toData.data[i];
                out.data[i + 1] = toData.data[i + 1];
                out.data[i + 2] = toData.data[i + 2];
                out.data[i + 3] = toData.data[i + 3];
            } else if (noise < progress) {
                // 边缘发光
                const edgeMix = (noise - (progress - EDGE_WIDTH)) / EDGE_WIDTH;
                const glow = 1 - edgeMix;
                out.data[i] = Math.round(toData.data[i] * (1 - glow * 0.5) + edgeColor[0] * glow * 0.5);
                out.data[i + 1] = Math.round(toData.data[i + 1] * (1 - glow * 0.5) + edgeColor[1] * glow * 0.5);
                out.data[i + 2] = Math.round(toData.data[i + 2] * (1 - glow * 0.5) + edgeColor[2] * glow * 0.5);
                out.data[i + 3] = 255;
            } else {
                // 旧帧
                out.data[i] = fromData.data[i];
                out.data[i + 1] = fromData.data[i + 1];
                out.data[i + 2] = fromData.data[i + 2];
                out.data[i + 3] = fromData.data[i + 3];
            }
        }
    }
    ctx.putImageData(out, 0, 0);
}

// ────────────────── 4. Rive/Lottie Playhead 绑定 ──────────────────

/**
 * 将季节局部进度绑定到 Lottie 动画 Playhead
 * @param animation Lottie AnimationItem 实例
 * @param blend 来自 SeasonScheduler 的插画混合状态
 * @param totalFrames Lottie 总帧数
 */
export function bindLottiePlayhead(
    animation: any, // lottie AnimationItem
    blend: IllustrationBlend,
    totalFrames: number = 150
) {
    const fromFrame = SEASON_FRAMES[blend.fromFrame];
    const toFrame = SEASON_FRAMES[blend.toFrame];

    if (!fromFrame.lottieFrames || !toFrame.lottieFrames) return;

    const [startA] = fromFrame.lottieFrames;
    const [startB, endB] = toFrame.lottieFrames;

    // 在两个关键帧区间之间插值 playhead
    const frameA = startA;
    const frameB = startB + (endB - startB) * blend.dissolveProgress;

    // 混合: 低 dissolve 时播放 A, 高时播放 B
    const targetFrame = blend.dissolveProgress < 0.5
        ? frameA + (frameB - frameA) * (blend.dissolveProgress * 2)
        : frameB;

    animation.goToAndStop(Math.round(targetFrame), true);
}

/**
 * 将季节局部进度绑定到 Rive 状态机
 * @param rive Rive 实例
 * @param blend 来自 SeasonScheduler 的插画混合状态
 */
export function bindRiveStateMachine(
    rive: any, // Rive instance
    blend: IllustrationBlend
) {
    const fromState = SEASON_FRAMES[blend.fromFrame]?.animationState;
    const toState = SEASON_FRAMES[blend.toFrame]?.animationState;

    if (!rive || !fromState || !toState) return;

    // Rive 状态机使用 Number Input 控制混合
    const inputs = rive.stateMachineInputs?.('SeasonMachine');
    if (inputs) {
        const progressInput = inputs.find((i: any) => i.name === 'seasonProgress');
        if (progressInput) {
            progressInput.value = blend.dissolveProgress;
        }
    }
}
