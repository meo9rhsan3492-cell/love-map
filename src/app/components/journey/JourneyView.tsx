/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  JourneyView — 双层解耦旅程视图组合器
 *
 *  将 BackgroundLayer(Z=0) 和 PhotoCardLayer(Z=1) 组装为完整视图。
 *  本组件不做任何渲染，仅负责层级组装和状态分发。
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackgroundLayer } from './BackgroundLayer';
import { PhotoCardLayer } from './PhotoCardLayer';
import type { BackgroundState, PhotoCardState, JourneyPhase } from '@/app/engine/JourneyOrchestrator';

interface JourneyViewProps {
    phase: JourneyPhase;
    bgState: BackgroundState;
    photoState: PhotoCardState;
    onStop?: () => void;
}

/**
 * 组合器: 严格保证两层的 Z 轴隔离
 *
 * DOM 结构:
 *   <JourneyView>                         ← 全屏容器
 *     <BackgroundLayer style={z:0} />     ← 底层: 仅季节
 *     <PhotoCardLayer  style={z:1} />     ← 顶层: 仅照片
 *     <ControlOverlay  style={z:2} />     ← 控制层: 停止按钮
 *   </JourneyView>
 */
export const JourneyView = memo(function JourneyView({
    phase,
    bgState,
    photoState,
    onStop,
}: JourneyViewProps) {
    const isActive = phase !== 'idle';

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    key="journey-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0"
                    style={{ zIndex: 900 }} // 在常规 UI 之上
                >
                    {/* ═══ Z=0: 季节背景层 ═══ */}
                    <BackgroundLayer
                        state={bgState}
                        active={isActive}
                    />

                    {/* ═══ Z=1: 照片卡片层 ═══ */}
                    <PhotoCardLayer
                        state={photoState}
                    />

                    {/* ═══ Z=2: 控制层 ═══ */}
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2" style={{ zIndex: 2 }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onStop}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white shadow-lg"
                        >
                            <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                            <span className="text-sm font-bold">结束旅程</span>
                        </motion.button>
                    </div>

                    {/* ═══ 入场/退场全屏遮罩 ═══ */}
                    <AnimatePresence>
                        {phase === 'entering' && (
                            <motion.div
                                key="enter-mask"
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                className="fixed inset-0 bg-black"
                                style={{ zIndex: 10 }}
                            />
                        )}
                        {phase === 'exiting' && (
                            <motion.div
                                key="exit-mask"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.5, ease: 'easeIn' }}
                                className="fixed inset-0 bg-black"
                                style={{ zIndex: 10 }}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
});
