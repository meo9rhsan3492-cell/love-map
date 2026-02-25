import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import { Clapperboard, Heart } from 'lucide-react';

interface CinematicOverlayProps {
    type: 'intro' | 'outro';
    onComplete: () => void;
    memoriesCount?: number;
}

export function CinematicOverlay({ type, onComplete, memoriesCount = 0 }: CinematicOverlayProps) {
    const [count, setCount] = useState(3);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    // Intro Countdown Logic
    useEffect(() => {
        if (type === 'intro') {
            setCount(3);
            const t1 = setTimeout(() => setCount(2), 1000);
            const t2 = setTimeout(() => setCount(1), 2000);
            const t3 = setTimeout(() => setCount(0), 3000);
            const t4 = setTimeout(onComplete, 4000);

            return () => {
                clearTimeout(t1);
                clearTimeout(t2);
                clearTimeout(t3);
                clearTimeout(t4);
            };
        } else {
            const timer = setTimeout(onComplete, 3000);
            return () => clearTimeout(timer);
        }
    }, [type]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center overflow-hidden pointer-events-auto font-mono">
            {/* Film Grain / Noise Overlay */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay animate-pulse" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_90%)]" />

            {/* Vertical Scratches (Old Film Effect) - DESKTOP ONLY */}
            {!isMobile && (
                <>
                    <motion.div
                        className="absolute top-0 bottom-0 left-[20%] w-[1px] bg-white/20"
                        animate={{ x: [-10, 10, -5, 20, 0], opacity: [0, 0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute top-0 bottom-0 right-[30%] w-[2px] bg-white/10"
                        animate={{ x: [5, -20, 10, -5], opacity: [0, 0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 0.3, ease: "linear", delay: 0.1 }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {type === 'intro' ? (
                    <AnimatePresence>
                        <motion.div
                            key={count}
                            initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
                            animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                            exit={{ scale: 2, opacity: 0, rotate: 5 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="absolute flex flex-col items-center"
                        >
                            {count > 0 ? (
                                <div className="relative">
                                    <div className="text-[12rem] font-black leading-none font-display text-white">
                                        {count}
                                    </div>
                                    {/* Circle around number */}
                                    <div className="absolute inset-0 border-[8px] border-white/50 rounded-full animate-spin-slow" style={{ animationDuration: '3s' }} />
                                    <svg className="absolute inset-0 w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" fill="none" strokeDasharray="283" strokeDashoffset={283 - (283 * (4 - count)) / 3} className="transition-all duration-1000 ease-linear" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="text-6xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-amber-500 animate-pulse">
                                    Actions!
                                </div>
                            )}
                            <div className="mt-8 text-xl font-mono opacity-50 tracking-[0.5em]">
                                SEQUENCE 0{Math.max(1, 4 - count)}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.5 }}
                        className="text-center"
                    >
                        <div className="mb-6 flex justify-center">
                            <Clapperboard className="w-16 h-16 text-white/80" />
                        </div>
                        <div className="text-8xl font-display font-bold tracking-tighter mb-4">
                            FIN
                        </div>
                        <div className="text-xl font-sans font-light tracking-widest opacity-70 uppercase mb-8">
                            Journey Completed
                        </div>

                        <div className="flex items-center gap-2 justify-center text-sm opacity-50 font-mono">
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                            <span>{memoriesCount} Memories Relived</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
