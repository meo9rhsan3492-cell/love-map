/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  JourneyOrchestrator — 旅程双层解耦控制器
 *
 *  职责: 将时间轴变化拆分为两条独立的状态流:
 *    → BackgroundLayer: season_progress (仅季节)
 *    → PhotoCardLayer:  photo + location + date (仅展示)
 *
 *  二者通过本 Hook 联动，但渲染完全隔离。
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Memory } from '@/app/types/memory';
import { dateToSeasonProgress, dateToDayProgress, computeSeasonState } from '@/app/engine/SeasonScheduler';
import type { SeasonState } from '@/app/engine/SeasonScheduler';

// ────────────────── 类型定义 ──────────────────

export type JourneyPhase = 'idle' | 'entering' | 'playing' | 'transitioning' | 'exiting';

/** 底层背景状态 (Z=0) — 仅包含季节信息，零照片数据 */
export interface BackgroundState {
    seasonProgress: number;
    dayProgress: number;
    seasonState: SeasonState;
    /** 前一个季节进度 (用于过渡插值) */
    prevSeasonProgress: number;
    /** 过渡进度 0~1 (背景自身的平滑插值) */
    transitionProgress: number;
    /** 是否正在过渡中 */
    isTransitioning: boolean;
}

/** 顶层照片卡片状态 (Z=1) — 仅包含展示数据，零背景渲染 */
export interface PhotoCardState {
    memory: Memory | null;
    /** 卡片独立转场方向 */
    enterDirection: 'left' | 'right' | 'up' | 'down';
    /** 是否显示 */
    visible: boolean;
    /** 当前索引 */
    index: number;
    total: number;
}

// ────────────────── 核心 Hook ──────────────────

export function useJourneyOrchestrator(memories: Memory[]) {
    const [phase, setPhase] = useState<JourneyPhase>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);

    // ── 双层独立状态 ──
    const [bgState, setBgState] = useState<BackgroundState>({
        seasonProgress: 0,
        dayProgress: 0.5,
        seasonState: computeSeasonState(0, 0.5),
        prevSeasonProgress: 0,
        transitionProgress: 1,
        isTransitioning: false,
    });

    const [photoState, setPhotoState] = useState<PhotoCardState>({
        memory: null,
        enterDirection: 'right',
        visible: false,
        index: 0,
        total: 0,
    });

    // 过渡动画 RAF
    const transitionRaf = useRef(0);
    const transitionStart = useRef(0);

    // ────── 背景过渡引擎 ──────

    /**
     * 当时间轴变化时，驱动背景层平滑过渡
     * 背景层完全独立执行自身的颜色/动画插值
     */
    const transitionBackground = useCallback((
        fromProgress: number,
        toProgress: number,
        toDayProgress: number,
        durationMs: number = 1500
    ) => {
        cancelAnimationFrame(transitionRaf.current);
        transitionStart.current = performance.now();

        const toState = computeSeasonState(toProgress, toDayProgress);

        setBgState(prev => ({
            ...prev,
            prevSeasonProgress: fromProgress,
            isTransitioning: true,
            transitionProgress: 0,
        }));

        const animate = (now: number) => {
            const elapsed = now - transitionStart.current;
            const t = Math.min(elapsed / durationMs, 1);
            // Smootherstep for ultra-smooth interpolation
            const smooth = t * t * t * (t * (t * 6 - 15) + 10);

            // 插值季节进度
            const currentProgress = fromProgress + (toProgress - fromProgress) * smooth;
            const currentDay = toDayProgress; // Day doesn't interpolate
            const interpolatedState = computeSeasonState(currentProgress, currentDay);

            setBgState({
                seasonProgress: currentProgress,
                dayProgress: currentDay,
                seasonState: interpolatedState,
                prevSeasonProgress: fromProgress,
                transitionProgress: smooth,
                isTransitioning: t < 1,
            });

            if (t < 1) {
                transitionRaf.current = requestAnimationFrame(animate);
            }
        };

        transitionRaf.current = requestAnimationFrame(animate);
    }, []);

    // ────── 照片卡片转场 ──────

    const showPhoto = useCallback((memory: Memory, index: number, direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
        setPhotoState({
            memory,
            enterDirection: direction,
            visible: true,
            index,
            total: memories.length,
        });
    }, [memories.length]);

    const hidePhoto = useCallback(() => {
        setPhotoState(prev => ({ ...prev, visible: false }));
    }, []);

    // ────── 主播放循环 ──────

    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const playStep = useCallback((index: number) => {
        if (index >= memories.length) {
            setPhase('exiting');
            hidePhoto();
            return;
        }

        const memory = memories[index];
        const prevMemory = index > 0 ? memories[index - 1] : null;

        // ── 1. 计算目标季节 ──
        const targetSp = dateToSeasonProgress(memory.date);
        const targetDp = dateToDayProgress(memory.date);

        // ── 2. 驱动背景层独立过渡 ──
        const prevSp = prevMemory ? dateToSeasonProgress(prevMemory.date) : targetSp;
        const seasonChanged = Math.abs(targetSp - prevSp) > 0.05;
        const bgDuration = seasonChanged ? 2000 : 800; // 跨季慢过渡
        transitionBackground(prevSp, targetSp, targetDp, bgDuration);

        // ── 3. 照片卡片独立转场 (延迟到飞行结束) ──
        const flightDuration = 1500;
        const direction = index % 2 === 0 ? 'right' : 'left' as const;

        // 先隐藏旧照片
        hidePhoto();

        // 飞行结束后显示新照片
        timerRef.current = setTimeout(() => {
            showPhoto(memory, index, direction);
        }, flightDuration);

        // ── 4. 计算观看时长, 然后进入下一步 ──
        const textTime = (memory.description?.length || 0) * 150;
        const mediaTime = (memory.media?.length || 1) * 3000;
        const viewDuration = Math.min(Math.max(5000, textTime + mediaTime), 20000);
        const totalStepTime = flightDuration + viewDuration;

        setTimeout(() => {
            setCurrentIndex(index + 1);
        }, totalStepTime);
    }, [memories, transitionBackground, showPhoto, hidePhoto]);

    // 监听 index 变化驱动下一步
    useEffect(() => {
        if (phase === 'playing' && currentIndex < memories.length) {
            playStep(currentIndex);
        } else if (phase === 'playing' && currentIndex >= memories.length) {
            setPhase('exiting');
            hidePhoto();
            // 3秒后完全退出
            setTimeout(() => setPhase('idle'), 3000);
        }
    }, [phase, currentIndex, memories.length, playStep, hidePhoto]);

    // ────── 外部控制 API ──────

    const start = useCallback(() => {
        if (memories.length === 0) return;
        setPhase('entering');
        setCurrentIndex(0);
        // 入场动画后开始播放
        setTimeout(() => setPhase('playing'), 1500);
    }, [memories.length]);

    const stop = useCallback(() => {
        clearTimeout(timerRef.current);
        cancelAnimationFrame(transitionRaf.current);
        setPhase('idle');
        setCurrentIndex(0);
        hidePhoto();
    }, [hidePhoto]);

    // 清理
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            cancelAnimationFrame(transitionRaf.current);
        };
    }, []);

    return {
        phase,
        currentIndex,
        bgState,       // → 传给 BackgroundLayer
        photoState,    // → 传给 PhotoCardLayer
        start,
        stop,
    };
}
