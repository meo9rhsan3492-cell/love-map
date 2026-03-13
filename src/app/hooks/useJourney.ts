import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useSound } from '@/app/hooks/useSound';
import type { Memory } from '@/app/types/memory';

interface UseJourneyProps {
    memories: Memory[];
    onMemorySelect: (memory: Memory | null) => void;
}

export type JourneyState = 'idle' | 'intro' | 'playing' | 'outro';

/**
 * Optimized Journey Hook — 3-phase timer instead of 10 setTimeout
 *
 * Phase 1: FLIGHT   (fly to location, show trivia)
 * Phase 2: ARRIVE   (landing burst, stamp, show card)
 * Phase 3: DEPART   (close card, advance index)
 */
export function useJourney({ memories, onMemorySelect }: UseJourneyProps) {
    const [journeyState, setJourneyState] = useState<JourneyState>('idle');
    const [journeyIndex, setJourneyIndex] = useState(0);
    const [activeMilestone, setActiveMilestone] = useState<{ title: string, subtitle: string, type: any } | null>(null);
    const [currentDuration, setCurrentDuration] = useState(0);
    const [showStamp, setShowStamp] = useState(false);
    const [showTrivia, setShowTrivia] = useState(false);
    const [showShutter, setShowShutter] = useState(false);
    const [showBurst, setShowBurst] = useState(false);
    const [isFlying, setIsFlying] = useState(false);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const { playSuccess, playPop } = useSound();
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Cleanup helper
    const clearAllTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }, []);

    const addTimer = useCallback((fn: () => void, ms: number) => {
        timersRef.current.push(setTimeout(fn, ms));
    }, []);

    const handleStartJourney = useCallback(() => {
        toast.info('开启自动巡航模式 🚀', { duration: 2000 });
        playSuccess();
        setJourneyState('intro');
        setJourneyIndex(0);
        onMemorySelect(null);
    }, [playSuccess, onMemorySelect]);

    const handleStopJourney = useCallback(() => {
        clearAllTimers();
        setJourneyState('idle');
        setJourneyIndex(0);
        setIsFlying(false);
        setShowTrivia(false);
        setShowShutter(false);
        setShowBurst(false);
        setShowStamp(false);
        onMemorySelect(null);
        toast.info('巡航结束 ✨');
    }, [clearAllTimers, onMemorySelect]);

    const handleIntroComplete = useCallback(() => {
        playSuccess();
        setJourneyState('playing');
        setJourneyIndex(0);
        setIsFlying(true);
    }, [playSuccess]);

    const handleOutroComplete = useCallback(() => {
        setJourneyState('idle');
        setJourneyIndex(0);
        setIsFlying(false);
        onMemorySelect(null);
    }, [onMemorySelect]);

    // Milestone Checker
    useEffect(() => {
        if (journeyState !== 'playing') {
            setActiveMilestone(null);
            return;
        }

        let milestoneData = null;
        const count = journeyIndex + 1;

        if (count === 1) {
            milestoneData = { title: "第一步", subtitle: "开启这段旅程", type: "city" };
        } else if (count === 5) {
            milestoneData = { title: "探索家", subtitle: "探索了5个地点", type: "streak" };
        } else if (count === 10) {
            milestoneData = { title: "回忆收集者", subtitle: "收集了10个美好瞬间", type: "count" };
        } else if (count === 20) {
            milestoneData = { title: "时光旅人", subtitle: "穿越了时空的旅人", type: "anniversary" };
        }

        if (milestoneData) {
            const t1 = setTimeout(() => {
                setActiveMilestone(milestoneData);
                playSuccess();
            }, 800);
            const t2 = setTimeout(() => setActiveMilestone(null), 4000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [journeyIndex, journeyState, playSuccess]);

    // ═══════════════════════════════════════════
    //  Main Journey Loop — 3 PHASES (was 10 setTimeout)
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (journeyState !== 'playing') return;

        if (journeyIndex >= memories.length) {
            setJourneyState('outro');
            setIsFlying(false);
            return;
        }

        const currentMemory = memories[journeyIndex];
        if (!currentMemory) return;

        clearAllTimers();

        const flightDuration = isMobile ? 1500 : 2000;
        const textTime = (currentMemory.description?.length || 0) * 150;
        const mediaTime = (currentMemory.media?.length || 1) * 3000;
        const viewDuration = Math.min(Math.max(4000, textTime + mediaTime), 15000);
        setCurrentDuration(flightDuration + viewDuration);

        // ── PHASE 1: FLIGHT (batched state update) ──
        setIsFlying(true);
        setShowBurst(false);
        setShowStamp(false);
        if (!isMobile) setShowTrivia(true);

        // Pre-fetch the image for the current memory to prevent
        // main-thread blocking (PPT stuttering) when the card renders
        if (currentMemory.imageUrl || (currentMemory.media && currentMemory.media[0]?.url)) {
            const url = currentMemory.imageUrl || currentMemory.media?.[0]?.url;
            if (url) {
                const img = new Image();
                img.src = url;
            }
        }

        // Shutter closes near end of flight
        addTimer(() => {
            setShowTrivia(false);
            setShowShutter(true);
        }, flightDuration - 300);

        // ── PHASE 2: ARRIVE (single batched update) ──
        addTimer(() => {
            // Batch all arrival state changes in one tick
            setShowShutter(false);
            setShowBurst(true);
            setIsFlying(false);
            onMemorySelect(currentMemory);
            playPop();
        }, flightDuration);

        // Stamp + hide burst together
        addTimer(() => {
            setShowBurst(false);
            setShowStamp(true);
        }, flightDuration + 600);

        // Hide stamp
        addTimer(() => {
            setShowStamp(false);
        }, flightDuration + 3000);

        // ── PHASE 3: DEPART ──
        addTimer(() => {
            onMemorySelect(null);
        }, flightDuration + viewDuration - 800);

        addTimer(() => {
            setJourneyIndex(prev => prev + 1);
        }, flightDuration + viewDuration);

        return clearAllTimers;
    }, [journeyState, journeyIndex, memories, onMemorySelect, playPop, clearAllTimers, addTimer, isMobile]);

    // Cleanup on unmount
    useEffect(() => clearAllTimers, [clearAllTimers]);

    return {
        journeyState,
        journeyIndex,
        activeMilestone,
        currentDuration,
        showStamp,
        showTrivia,
        showShutter,
        showBurst,
        isFlying,
        handleStartJourney,
        handleStopJourney,
        handleIntroComplete,
        handleOutroComplete
    };
}
