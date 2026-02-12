import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Meteors } from '@/app/components/ui/meteors';

export function AtmosphericBackground() {
    const [timeOfDay, setTimeOfDay] = useState<'day' | 'evening' | 'night'>('day');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 17) setTimeOfDay('day');
        else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
        else setTimeOfDay('night');
    }, []);

    // Gradient definitions
    const gradients = {
        day: 'linear-gradient(135deg, rgba(255,241,235,0.4) 0%, rgba(255,255,255,0) 100%)', // Warm sunny
        evening: 'linear-gradient(135deg, rgba(235,215,255,0.3) 0%, rgba(255,200,180,0.2) 100%)', // Purple/Pink sunset
        night: 'linear-gradient(135deg, rgba(20,20,40,0.4) 0%, rgba(40,20,60,0.2) 100%)', // Deep blue/purple
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
            {/* 1. Base Gradient Overlay - Blends with Map */}
            <motion.div
                className="absolute inset-0 mix-blend-overlay"
                animate={{ background: gradients[timeOfDay] }}
                transition={{ duration: 5 }}
            />

            {/* Aceternity Meteors Effect - Responsive count */}
            <Meteors number={window.innerWidth < 768 ? 5 : 10} className="absolute inset-0 pointer-events-none z-0 opacity-50" />

            {/* 2. Moving Orbs / Fog (Subtle Animation) */}
            <motion.div
                className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pink-300/20 blur-[100px] mix-blend-screen"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
            <motion.div
                className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-300/20 blur-[120px] mix-blend-screen"
                animate={{
                    x: [0, -40, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />
            <motion.div
                className="absolute -bottom-[20%] left-[20%] w-[70%] h-[50%] rounded-full bg-amber-200/10 blur-[100px] mix-blend-screen"
                animate={{
                    x: [0, 30, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
            />

            {/* 3. Global Texture (Noise) - Keeping it very subtle */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    );
}
