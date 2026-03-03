/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BackgroundLayer (Z-index: 0) — 全屏季节背景渲染层
 *
 *  严格规则:
 *    ✅ 仅接收 season_progress 和 day_progress
 *    ✅ 独立执行颜色插值和季节动画
 *    ❌ 绝对不包含任何照片/用户数据
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BackgroundState } from '@/app/engine/JourneyOrchestrator';

interface BackgroundLayerProps {
    state: BackgroundState;
    active: boolean;
}

// ────── 季节调色板 ──────

interface SeasonPalette {
    sky: [string, string];      // 天空渐变 [top, bottom]
    ambient: string;            // 环境光色
    ground: string;             // 地面色
    particles: string[];        // 飘落物 emoji
    label: string;
}

const PALETTES: Record<string, SeasonPalette> = {
    spring: {
        sky: ['#e0f2fe', '#fce7f3'],
        ambient: 'rgba(144,238,144,0.12)',
        ground: '#d1fae5',
        particles: ['🌸', '🌷', '🦋', '🌿'],
        label: '春',
    },
    summer: {
        sky: ['#fef3c7', '#dbeafe'],
        ambient: 'rgba(255,200,50,0.1)',
        ground: '#fef9c3',
        particles: ['☀️', '🌻', '✨', '🌊'],
        label: '夏',
    },
    autumn: {
        sky: ['#ffedd5', '#fed7aa'],
        ambient: 'rgba(200,120,50,0.12)',
        ground: '#fde68a',
        particles: ['🍂', '🍁', '🌾', '🍄'],
        label: '秋',
    },
    winter: {
        sky: ['#e0e7ff', '#c7d2fe'],
        ambient: 'rgba(150,180,220,0.15)',
        ground: '#f1f5f9',
        particles: ['❄️', '🌨️', '⛄', '💎'],
        label: '冬',
    },
};

function getSeasonKey(progress: number): string {
    const idx = Math.floor(((progress % 1 + 1) % 1) * 4);
    return ['spring', 'summer', 'autumn', 'winter'][idx];
}

// ────── Canvas 天空渲染器 ──────

function renderSky(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    palette: SeasonPalette,
    dayProgress: number
) {
    // 天空渐变
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, palette.sky[0]);
    grad.addColorStop(1, palette.sky[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 昼夜叠加
    if (dayProgress < 0.2 || dayProgress > 0.85) {
        // 夜晚暗化
        const nightAlpha = dayProgress > 0.85
            ? (dayProgress - 0.85) / 0.15 * 0.5
            : (0.2 - dayProgress) / 0.2 * 0.5;
        ctx.fillStyle = `rgba(10, 10, 35, ${nightAlpha})`;
        ctx.fillRect(0, 0, w, h);
    } else if (dayProgress > 0.7 && dayProgress <= 0.85) {
        // 黄昏暖色
        const sunsetAlpha = (dayProgress - 0.7) / 0.15 * 0.15;
        ctx.fillStyle = `rgba(255, 120, 50, ${sunsetAlpha})`;
        ctx.fillRect(0, 0, w, h);
    }
}

// ────── 组件 ──────

export const BackgroundLayer = memo(function BackgroundLayer({ state, active }: BackgroundLayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafId = useRef(0);

    const seasonKey = getSeasonKey(state.seasonProgress);
    const palette = PALETTES[seasonKey];

    // ── Canvas 天空渲染 ──
    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const render = () => {
            renderSky(ctx, w, h, palette, state.dayProgress);
            rafId.current = requestAnimationFrame(render);
        };
        rafId.current = requestAnimationFrame(render);

        return () => cancelAnimationFrame(rafId.current);
    }, [active, palette, state.dayProgress]);

    if (!active) return null;

    return (
        <div
            className="fixed inset-0 overflow-hidden"
            style={{ zIndex: 0 }} // 严格 Z=0
        >
            {/* L0: Canvas 天空盒 */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
            />

            {/* L0.1: 季节色调叠加 (CSS 过渡) */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={seasonKey}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-0"
                    style={{
                        background: palette.ambient,
                        willChange: 'opacity',
                    }}
                />
            </AnimatePresence>

            {/* L0.2: 底部地面色带 */}
            <motion.div
                className="absolute bottom-0 inset-x-0 h-1/4"
                animate={{
                    background: `linear-gradient(to top, ${palette.ground}, transparent)`,
                }}
                transition={{ duration: 2 }}
            />

            {/* L0.3: 飘落粒子 (纯CSS, 零照片数据) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {palette.particles.map((emoji, i) => (
                    <motion.div
                        key={`${seasonKey}-particle-${i}`}
                        className="absolute text-xl"
                        style={{
                            left: `${10 + i * 22}%`,
                            top: '-5%',
                            willChange: 'transform',
                        }}
                        animate={{
                            y: ['0vh', '110vh'],
                            x: [0, (i % 2 === 0 ? 1 : -1) * 30],
                            rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                        }}
                        transition={{
                            duration: 10 + i * 4,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: i * 1.5,
                        }}
                    >
                        {emoji}
                    </motion.div>
                ))}
            </div>

            {/* L0.4: 夜间星空 */}
            {(state.dayProgress < 0.2 || state.dayProgress > 0.85) && (
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={`star-${i}`}
                            className="absolute w-1 h-1 rounded-full bg-white"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 60}%`,
                            }}
                            animate={{ opacity: [0.2, 0.8, 0.2] }}
                            transition={{
                                duration: 1.5 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 3,
                            }}
                        />
                    ))}
                    {/* 月亮 */}
                    <div className="absolute top-[8%] right-[15%] w-12 h-12 rounded-full bg-yellow-100/80 shadow-[0_0_40px_rgba(255,255,200,0.4)]" />
                </div>
            )}

            {/* L0.5: 环境标签 */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-xl border border-white/10 z-10"
            >
                <span className="text-white/80 text-xs font-bold tracking-widest">
                    {palette.label} · {state.dayProgress < 0.25 ? '夜' : state.dayProgress < 0.4 ? '晨' : state.dayProgress < 0.7 ? '昼' : state.dayProgress < 0.85 ? '暮' : '夜'}
                </span>
            </motion.div>
        </div>
    );
});
