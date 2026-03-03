/**
 * ═══════════════════════════════════════════════════════════════════
 *  SeasonShader — 片段着色器 (WebGL GLSL + TypeScript Canvas 回退)
 *  接收 season_progress, 输出色调偏移 + 积雪覆盖
 * ═══════════════════════════════════════════════════════════════════
 */

// ────────────────── 1. GLSL 片段着色器 ──────────────────

export const SEASON_FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform float u_seasonProgress;   // 0.0~1.0 全年进度
uniform float u_dayProgress;      // 0.0~1.0 昼夜进度
uniform float u_snowCoverage;     // 0.0~1.0 积雪覆盖度
uniform float u_hueShift;         // 色相偏移 (度)
uniform sampler2D u_texture;      // 原始纹理
uniform vec2 u_resolution;

varying vec2 v_uv;

// ────── Oklab 色彩空间转换 ──────
vec3 srgb_to_linear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c));
}

vec3 linear_to_srgb(vec3 c) {
    return mix(12.92 * c, 1.055 * pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c));
}

vec3 linear_to_oklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
    l = pow(l, 1.0/3.0); m = pow(m, 1.0/3.0); s = pow(s, 1.0/3.0);
    return vec3(
        0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
        1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
        0.0259040371*l + 0.7827717662*m - 0.8086757660*s
    );
}

vec3 oklab_to_linear(vec3 lab) {
    float l = lab.x + 0.3963377774*lab.y + 0.2158037573*lab.z;
    float m = lab.x - 0.1055613458*lab.y - 0.0638541728*lab.z;
    float s = lab.x - 0.0894841775*lab.y - 1.2914855480*lab.z;
    l=l*l*l; m=m*m*m; s=s*s*s;
    return vec3(
        + 4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
        - 1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
        - 0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    );
}

// ────── 色相旋转 (Oklab ab 平面) ──────
vec3 rotateHue(vec3 oklab, float angleDeg) {
    float rad = angleDeg * 3.14159265 / 180.0;
    float c = cos(rad), s = sin(rad);
    float a2 = oklab.y * c - oklab.z * s;
    float b2 = oklab.y * s + oklab.z * c;
    return vec3(oklab.x, a2, b2);
}

// ────── Smoothstep 积雪 ──────
float snowMask(vec2 uv, float coverage) {
    // 模拟法线向上 = UV.y 越小越先积雪 (顶部)
    float normalUp = 1.0 - uv.y;
    // Smoothstep: 覆盖度越高，积雪范围越大
    float edge0 = 1.0 - coverage;
    float edge1 = edge0 + 0.15; // 过渡带宽度
    return smoothstep(edge0, edge1, normalUp);
}

// ────── 昼夜色温 ──────
vec3 dayNightTint(float dayP) {
    // 午夜冷蓝, 日出暖橙, 正午中性, 日落紫红
    vec3 midnight = vec3(0.15, 0.18, 0.35);
    vec3 dawn     = vec3(1.0, 0.75, 0.5);
    vec3 noon     = vec3(1.0, 1.0, 0.98);
    vec3 sunset   = vec3(1.0, 0.55, 0.45);

    if (dayP < 0.25) {
        return mix(midnight, dawn, smoothstep(0.15, 0.25, dayP));
    } else if (dayP < 0.5) {
        return mix(dawn, noon, smoothstep(0.25, 0.4, dayP));
    } else if (dayP < 0.75) {
        return mix(noon, sunset, smoothstep(0.6, 0.75, dayP));
    } else {
        return mix(sunset, midnight, smoothstep(0.75, 0.9, dayP));
    }
}

void main() {
    vec4 texColor = texture2D(u_texture, v_uv);
    vec3 color = texColor.rgb;

    // Step 1: sRGB → Linear → Oklab
    vec3 linear = srgb_to_linear(color);
    vec3 lab = linear_to_oklab(linear);

    // Step 2: 色相偏移 (植被变色)
    lab = rotateHue(lab, u_hueShift);

    // Step 3: Oklab → Linear → sRGB
    color = linear_to_srgb(oklab_to_linear(lab));

    // Step 4: 积雪叠加 (物理法线模拟)
    float snow = snowMask(v_uv, u_snowCoverage);
    vec3 snowColor = vec3(0.95, 0.97, 1.0); // 略带蓝的白
    float snowRoughness = mix(0.0, 0.3, snow); // 粗糙度随积雪增加
    color = mix(color, snowColor, snow * 0.85);
    // 粗糙度叠加: 降低高光 (模拟哑光积雪)
    color *= (1.0 - snowRoughness * 0.2);

    // Step 5: 昼夜色温叠加
    vec3 tint = dayNightTint(u_dayProgress);
    color *= tint;

    // Step 6: 夜晚整体降低亮度
    float nightDim = 1.0 - 0.4 * smoothstep(0.8, 0.95, u_dayProgress)
                         - 0.4 * (1.0 - smoothstep(0.05, 0.2, u_dayProgress));
    color *= nightDim;

    gl_FragColor = vec4(color, texColor.a);
}
`;

// ────────────────── 2. Canvas 2D 回退实现 ──────────────────

/**
 * 当 WebGL 不可用时, 用 Canvas 2D 滤镜实现近似效果
 */
export function applySeasonFilter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hueShift: number,
    snowCoverage: number,
    dayProgress: number
) {
    // ── 色相旋转 ──
    ctx.filter = `hue-rotate(${hueShift}deg)`;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.filter = 'none';

    // ── 积雪覆盖: 从顶部渐变白色叠加 ──
    if (snowCoverage > 0.01) {
        const snowGrad = ctx.createLinearGradient(0, 0, 0, height);
        const snowAlpha = snowCoverage * 0.6;
        snowGrad.addColorStop(0, `rgba(240, 245, 255, ${snowAlpha})`);
        snowGrad.addColorStop(snowCoverage, `rgba(240, 245, 255, ${snowAlpha * 0.3})`);
        snowGrad.addColorStop(1, 'rgba(240, 245, 255, 0)');
        ctx.fillStyle = snowGrad;
        ctx.fillRect(0, 0, width, height);
    }

    // ── 昼夜色温叠加 ──
    let tintColor: string;
    let tintAlpha: number;
    if (dayProgress < 0.2 || dayProgress > 0.85) {
        // 夜晚: 冷蓝暗色
        tintColor = '15, 18, 45';
        tintAlpha = 0.35;
    } else if (dayProgress < 0.3) {
        // 黎明: 暖橙
        tintColor = '255, 180, 100';
        tintAlpha = 0.1;
    } else if (dayProgress > 0.7) {
        // 黄昏: 紫红
        tintColor = '200, 100, 80';
        tintAlpha = 0.12;
    } else {
        // 白天: 无叠加
        tintColor = '255, 255, 255';
        tintAlpha = 0;
    }

    if (tintAlpha > 0) {
        ctx.fillStyle = `rgba(${tintColor}, ${tintAlpha})`;
        ctx.fillRect(0, 0, width, height);
    }
}
