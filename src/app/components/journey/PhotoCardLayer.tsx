/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PhotoCardLayer (Z-index: 1) — 顶层悬浮照片展示层
 *
 *  严格规则:
 *    ✅ 仅渲染照片相框、时间、地点文本
 *    ✅ 独立执行滑动/翻转转场动画
 *    ❌ 绝对不包含任何季节背景/渐变/粒子
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, Heart } from 'lucide-react';
import type { PhotoCardState } from '@/app/engine/JourneyOrchestrator';

interface PhotoCardLayerProps {
    state: PhotoCardState;
}

// ────── 转场动画变体 ──────

const ENTER_VARIANTS = {
    left: { x: -300, opacity: 0, rotateY: 15, scale: 0.8 },
    right: { x: 300, opacity: 0, rotateY: -15, scale: 0.8 },
    up: { y: -200, opacity: 0, scale: 0.85 },
    down: { y: 200, opacity: 0, scale: 0.85 },
};

const EXIT_VARIANTS = {
    left: { x: 300, opacity: 0, rotateY: -10, scale: 0.85, filter: 'blur(8px)' },
    right: { x: -300, opacity: 0, rotateY: 10, scale: 0.85, filter: 'blur(8px)' },
    up: { y: 200, opacity: 0, scale: 0.9, filter: 'blur(6px)' },
    down: { y: -200, opacity: 0, scale: 0.9, filter: 'blur(6px)' },
};

const VISIBLE = { x: 0, y: 0, opacity: 1, rotateY: 0, scale: 1, filter: 'blur(0px)' };

// ────── 日期格式化 ──────

function formatDate(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
        return dateStr;
    }
}

// ────── 组件 ──────

export const PhotoCardLayer = memo(function PhotoCardLayer({ state }: PhotoCardLayerProps) {
    const { memory, enterDirection, visible, index, total } = state;

    const photoUrl = useMemo(() => {
        if (!memory) return null;
        if (memory.media?.length > 0 && memory.media[0].type === 'image') {
            return memory.media[0].url;
        }
        return memory.imageUrl || null;
    }, [memory]);

    return (
        <div
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 1, perspective: '1200px' }} // 严格 Z=1, 3D透视
        >
            <AnimatePresence mode="wait">
                {visible && memory && (
                    <motion.div
                        key={memory.id}
                        initial={ENTER_VARIANTS[enterDirection]}
                        animate={VISIBLE}
                        exit={EXIT_VARIANTS[enterDirection]}
                        transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 25,
                            mass: 0.8,
                        }}
                        className="relative pointer-events-auto"
                        style={{
                            willChange: 'transform, opacity',
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        {/* ── 相框容器 ── */}
                        <div className="relative bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden max-w-[85vw] md:max-w-[420px]">

                            {/* 索引标签 */}
                            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                                <span className="text-white text-xs font-mono font-bold">
                                    {index + 1} / {total}
                                </span>
                            </div>

                            {/* ── 照片区域 ── */}
                            <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                                {photoUrl ? (
                                    <motion.img
                                        src={photoUrl}
                                        alt={memory.title}
                                        className="w-full h-full object-cover"
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
                                        <Heart className="w-12 h-12 text-pink-300" />
                                    </div>
                                )}

                                {/* 底部渐变 (照片内部, 不影响背景) */}
                                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>

                            {/* ── 信息区域 ── */}
                            <div className="p-4 space-y-2">
                                {/* 标题 */}
                                <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                                    {memory.title}
                                </h3>

                                {/* 描述 */}
                                {memory.description && (
                                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                        {memory.description}
                                    </p>
                                )}

                                {/* 元信息: 时间 + 地点 */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span className="text-xs">{formatDate(memory.date)}</span>
                                    </div>
                                    {memory.locationName && (
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span className="text-xs">{memory.locationName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── 相框装饰线 ── */}
                            <div className="absolute inset-0 rounded-2xl border-2 border-white/50 pointer-events-none" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
