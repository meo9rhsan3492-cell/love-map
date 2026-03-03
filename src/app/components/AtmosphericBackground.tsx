import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Meteors } from '@/app/components/ui/meteors';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export function AtmosphericBackground() {
    const [timeOfDay, setTimeOfDay] = useState<'day' | 'evening' | 'night'>('day');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 17) setTimeOfDay('day');
        else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
        else setTimeOfDay('night');
    }, []);

    const gradients = {
        day: 'linear-gradient(135deg, rgba(255,241,235,0.4) 0%, rgba(255,255,255,0) 100%)',
        evening: 'linear-gradient(135deg, rgba(235,215,255,0.3) 0%, rgba(255,200,180,0.2) 100%)',
        night: 'linear-gradient(135deg, rgba(20,20,40,0.4) 0%, rgba(40,20,60,0.2) 100%)',
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
            {/* Base Gradient Overlay */}
            <motion.div
                className="absolute inset-0 mix-blend-overlay"
                animate={{ background: gradients[timeOfDay] }}
                transition={{ duration: 5 }}
            />

            {/* Meteors - reduced on mobile */}
            <Meteors number={isMobile ? 2 : 5} className="absolute inset-0 pointer-events-none z-0 opacity-40" />

            {/* Blur Orbs - DESKTOP ONLY (blur-[100px] is a GPU killer on mobile) */}
            {!isMobile && (
                <>
                    <div
                        className="absolute -top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-pink-300/15 blur-[80px] mix-blend-screen"
                        style={{ willChange: 'transform' }}
                    />
                    <div
                        className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/15 blur-[80px] mix-blend-screen"
                        style={{ willChange: 'transform' }}
                    />
                </>
            )}

            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </div>
    );
}
