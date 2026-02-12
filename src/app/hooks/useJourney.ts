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
        onMemorySelect(null);
        toast.info('巡航结束 ✨');
    };

    const handleIntroComplete = () => {
        playSuccess();
        setJourneyState('playing');
        setJourneyIndex(0);
    };

    const handleOutroComplete = () => {
        setJourneyState('idle');
        setJourneyIndex(0);
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
            return;
        }

        const currentMemory = memories[journeyIndex];
        if (!currentMemory) return;

        // Flight time is roughly 6s (set in MapView)
        // We arrive at t=6s.
        // Stamp appears at t=6s.
        const flightDuration = 6000;

        // Trivia: Show during flight
        setShowTrivia(true);
        const hideTriviaTimeout = setTimeout(() => {
            setShowTrivia(false);
        }, flightDuration - 1000); // Hide a bit later

        // Shutter: Close before landing to hide the "snap", open when content is ready
        // Shutter duration is 0.3s (300ms)
        const shutterStart = setTimeout(() => {
            setShowShutter(true);
        }, flightDuration - 400); // Start closing just before arrival

        const shutterEnd = setTimeout(() => {
            setShowShutter(false);
        }, flightDuration + 100); // Open immediately after content swap

        // Show stamp when landed
        const stampTimeout = setTimeout(() => {
            setShowStamp(true);
            playPop();
        }, flightDuration + 300); // Slight delay after shutter opens

        const hideStampTimeout = setTimeout(() => {
            setShowStamp(false);
        }, flightDuration + 4000);

        // Calculate reading time - slightly longer for better chill vibe
        const textTime = (currentMemory.description?.length || 0) * 200; // Slower reading speed assumption
        const mediaTime = (currentMemory.media?.length || 1) * 4000;
        const viewDuration = Math.min(Math.max(6000, textTime + mediaTime), 25000); // At least 6s

        setCurrentDuration(flightDuration + viewDuration);

        // Open detail exactly when landed
        const openTimeout = setTimeout(() => {
            onMemorySelect(currentMemory);
        }, flightDuration);

        // Disappear content a bit before flying (Linger Phase)
        // e.g., 1.5s before flying to next
        const closeCardTimeout = setTimeout(() => {
            onMemorySelect(null);
        }, flightDuration + viewDuration - 1500);

        // Next step - Fly to next location
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
        handleStartJourney,
        handleStopJourney,
        handleIntroComplete,
        handleOutroComplete
    };
}
