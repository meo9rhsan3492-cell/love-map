import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSound } from '@/app/hooks/useSound';
import type { Memory } from '@/app/types/memory';

interface UseJourneyProps {
    memories: Memory[];
    onMemorySelect: (memory: Memory | null) => void;
}

export type JourneyState = 'idle' | 'intro' | 'playing' | 'outro';

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

    const handleStartJourney = () => {
        toast.info('开启自动巡航模式 🚀', { duration: 2000 });
        playSuccess();
        setJourneyState('intro');
        setJourneyIndex(0);
        onMemorySelect(null);
    };

    const handleStopJourney = () => {
        setJourneyState('idle');
        setJourneyIndex(0);
        setIsFlying(false);
        onMemorySelect(null);
        toast.info('巡航结束 ✨');
    };

    const handleIntroComplete = () => {
        playSuccess();
        setJourneyState('playing');
        setJourneyIndex(0);
        setIsFlying(true);
    };

    const handleOutroComplete = () => {
        setJourneyState('idle');
        setJourneyIndex(0);
        setIsFlying(false);
        onMemorySelect(null);
    };

    // Milestone Checker
    useEffect(() => {
        if (journeyState !== 'playing') {
            setActiveMilestone(null);
            return;
        }

        let milestoneData = null;
        const count = journeyIndex + 1;

        if (count === 1) {
            milestoneData = { title: "First Step", subtitle: "开启这段旅程", type: "city" };
        } else if (count === 5) {
            milestoneData = { title: "Explorer", subtitle: "探索了5个地点", type: "streak" };
        } else if (count === 10) {
            milestoneData = { title: "Memory Collector", subtitle: "收集了10个美好瞬间", type: "count" };
        } else if (count === 20) {
            milestoneData = { title: "Time Traveler", subtitle: "穿越了时空的旅人", type: "anniversary" };
        }

        if (milestoneData) {
            const timer = setTimeout(() => {
                setActiveMilestone(milestoneData);
                playSuccess();
            }, 1000);

            const hideTimer = setTimeout(() => {
                setActiveMilestone(null);
            }, 5000);
            return () => { clearTimeout(timer); clearTimeout(hideTimer); };
        }
    }, [journeyIndex, journeyState, playSuccess]);

    // Main Journey Loop
    useEffect(() => {
        if (journeyState !== 'playing') return;

        if (journeyIndex >= memories.length) {
            setJourneyState('outro');
            setIsFlying(false);
            return;
        }

        const currentMemory = memories[journeyIndex];
        if (!currentMemory) return;

        // Start flying phase
        setIsFlying(true);
        setShowBurst(false);

        // Flight time: 6s desktop, 3s mobile
        const flightDuration = isMobile ? 3000 : 6000;

        // Trivia: Show during flight (skip on mobile to reduce overlays)
        if (!isMobile) setShowTrivia(true);
        const hideTriviaTimeout = setTimeout(() => {
            setShowTrivia(false);
        }, flightDuration - 1000);

        // Shutter: Close before landing
        const shutterStart = setTimeout(() => {
            setShowShutter(true);
        }, flightDuration - 400);

        const shutterEnd = setTimeout(() => {
            setShowShutter(false);
        }, flightDuration + 100);

        // Arrival burst when landed
        const burstTimeout = setTimeout(() => {
            setShowBurst(true);
            setIsFlying(false);
        }, flightDuration);

        const hideBurstTimeout = setTimeout(() => {
            setShowBurst(false);
        }, flightDuration + 800);

        // Show stamp when landed
        const stampTimeout = setTimeout(() => {
            setShowStamp(true);
            playPop();
        }, flightDuration + 300);

        const hideStampTimeout = setTimeout(() => {
            setShowStamp(false);
        }, flightDuration + 4000);

        // Calculate reading time
        const textTime = (currentMemory.description?.length || 0) * 200;
        const mediaTime = (currentMemory.media?.length || 1) * 4000;
        const viewDuration = Math.min(Math.max(6000, textTime + mediaTime), 25000);

        setCurrentDuration(flightDuration + viewDuration);

        // Open detail exactly when landed
        const openTimeout = setTimeout(() => {
            onMemorySelect(currentMemory);
        }, flightDuration);

        // Close card before flying
        const closeCardTimeout = setTimeout(() => {
            onMemorySelect(null);
        }, flightDuration + viewDuration - 1500);

        // Next step
        const nextStepTimeout = setTimeout(() => {
            setJourneyIndex(prev => prev + 1);
        }, flightDuration + viewDuration);

        return () => {
            clearTimeout(openTimeout);
            clearTimeout(nextStepTimeout);
            clearTimeout(closeCardTimeout);
            clearTimeout(stampTimeout);
            clearTimeout(hideStampTimeout);
            clearTimeout(hideTriviaTimeout);
            clearTimeout(shutterStart);
            clearTimeout(shutterEnd);
            clearTimeout(burstTimeout);
            clearTimeout(hideBurstTimeout);
        };
    }, [journeyState, journeyIndex, memories, onMemorySelect, playPop]);

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
