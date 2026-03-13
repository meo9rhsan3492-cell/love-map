import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useMemo } from 'react';
import { Clapperboard, Heart, MapPin, Clock, Navigation } from 'lucide-react';

interface CinematicOverlayProps {
    type: 'intro' | 'outro';
    onComplete: () => void;
    memoriesCount?: number;
}

// Lightweight star particles for background
function StarField({ count = 30 }: { count?: number }) {
    const stars = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            delay: Math.random() * 3,
            duration: Math.random() * 3 + 2,
        })), [count]
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {stars.map(star => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: star.duration,
                        delay: star.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

// Ring pulse effect on countdown numbers
function PulseRing({ count }: { count: number }) {
    return (
        <>
            {[0, 1, 2].map(i => (
                <motion.div
                    key={`ring-${count}-${i}`}
                    className="absolute inset-0 border-2 border-white/30 rounded-full"
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 2 + i * 0.5, opacity: 0 }}
                    transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
                />
            ))}
        </>
    );
}

export function CinematicOverlay({ type, onComplete, memoriesCount = 0 }: CinematicOverlayProps) {
    const [count, setCount] = useState(3);
    const [showFlash, setShowFlash] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    useEffect(() => {
        if (type === 'intro') {
            setCount(3);
            const t1 = setTimeout(() => setCount(2), 1000);
            const t2 = setTimeout(() => setCount(1), 2000);
            const t3 = setTimeout(() => { setCount(0); setShowFlash(true); }, 3000);
            const t4 = setTimeout(() => setShowFlash(false), 3300);
            const t5 = setTimeout(onComplete, 4000);

            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
        } else {
            const timer = setTimeout(onComplete, 4000);
            return () => clearTimeout(timer);
        }
    }, [type]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-black text-white flex items-center justify-center overflow-hidden pointer-events-auto font-mono"
        >
            {/* Star field background */}
            <StarField count={isMobile ? 15 : 30} />



            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_85%)]" />

            {/* White flash on "Actions!" */}
            <AnimatePresence>
                {showFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-white z-20"
                    />
                )}
            </AnimatePresence>

            {/* Vertical Scratches - DESKTOP ONLY */}
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

            {/* Cinematic horizontal lines (letterbox edges) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10 flex flex-col items-center pointer-events-none">
                {type === 'intro' ? (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={count}
                            initial={{ scale: 0.3, opacity: 0, filter: 'blur(20px)' }}
                            animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                            exit={{ scale: 2.5, opacity: 0, filter: 'blur(10px)' }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex flex-col items-center"
                        >
                            {count > 0 ? (
                                <div className="relative flex items-center justify-center">
                                    {/* Pulse rings */}
                                    <PulseRing count={count} />

                                    {/* Number with glow */}
                                    <div className="text-[10rem] md:text-[14rem] font-black leading-none font-display text-white relative">
                                        <span className="relative z-10">{count}</span>
                                        {/* Glow behind number */}
                                        <div className="absolute inset-0 text-[10rem] md:text-[14rem] font-black leading-none text-pink-500/30 blur-xl">{count}</div>
                                    </div>

                                    {/* SVG progress ring */}
                                    <svg className="absolute w-[200px] h-[200px] md:w-[280px] md:h-[280px] rotate-[-90deg]" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                                        <motion.circle
                                            cx="50" cy="50" r="45"
                                            stroke="url(#gradient)"
                                            strokeWidth="2"
                                            fill="none"
                                            strokeDasharray="283"
                                            initial={{ strokeDashoffset: 283 }}
                                            animate={{ strokeDashoffset: 0 }}
                                            transition={{ duration: 1, ease: "linear" }}
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#ec4899" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    {/* "Actions!" with sweep glow */}
                                    <div className="relative">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="text-5xl md:text-7xl font-black uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-400 whitespace-nowrap">
                                                ACTIONS!
                                            </div>
                                        </motion.div>
                                        {/* Sweep glow */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '200%' }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                        />
                                    </div>
                                    {/* Subtitle */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 0.5, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="text-sm tracking-[0.5em] uppercase font-light"
                                    >
                                        开启旅程回忆
                                    </motion.div>
                                </div>
                            )}

                            {/* Sequence counter */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                transition={{ delay: 0.2 }}
                                className="mt-12 text-xs tracking-[0.5em] uppercase"
                            >
                                SEQUENCE 0{Math.max(1, 4 - count)} / 04
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                ) : (
                    /* Outro */
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="text-center"
                    >
                        {/* Clapperboard icon with spin */}
                        <motion.div
                            className="mb-8 flex justify-center"
                            initial={{ rotate: -30, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                        >
                            <Clapperboard className="w-14 h-14 md:w-20 md:h-20 text-white/70" />
                        </motion.div>

                        {/* FIN with glow */}
                        <motion.div
                            initial={{ letterSpacing: '0.5em', opacity: 0 }}
                            animate={{ letterSpacing: '0.2em', opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-7xl md:text-9xl font-display font-bold mb-4 relative"
                        >
                            <span className="relative z-10">FIN</span>
                            <div className="absolute inset-0 text-7xl md:text-9xl font-display font-bold text-rose-500/20 blur-2xl">FIN</div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 0.7, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-lg font-sans font-light tracking-widest uppercase mb-10"
                        >
                            Journey Completed
                        </motion.div>

                        {/* Stats row */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                            className="flex items-center justify-center gap-6 md:gap-10 text-sm"
                        >
                            <div className="flex flex-col items-center gap-1">
                                <Heart className="w-5 h-5 text-red-400 fill-red-400" />
                                <span className="text-2xl font-bold font-display">{memoriesCount}</span>
                                <span className="text-xs text-white/40 tracking-wider">回忆</span>
                            </div>
                            <div className="w-[1px] h-10 bg-white/20" />
                            <div className="flex flex-col items-center gap-1">
                                <MapPin className="w-5 h-5 text-blue-400" />
                                <span className="text-2xl font-bold font-display">{memoriesCount}</span>
                                <span className="text-xs text-white/40 tracking-wider">地点</span>
                            </div>
                            <div className="w-[1px] h-10 bg-white/20" />
                            <div className="flex flex-col items-center gap-1">
                                <Navigation className="w-5 h-5 text-amber-400" />
                                <span className="text-2xl font-bold font-display">∞</span>
                                <span className="text-xs text-white/40 tracking-wider">距离</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
