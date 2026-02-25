import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';

interface ArrivalBurstProps {
    active: boolean;
    color?: 'gold' | 'rose' | 'blue';
}

// Lightweight CSS-only particle burst for arrival at each location
export function ArrivalBurst({ active, color = 'gold' }: ArrivalBurstProps) {
    const particles = useMemo(() =>
        Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const velocity = 80 + Math.random() * 120;
            return {
                id: i,
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                size: Math.random() * 6 + 3,
                delay: Math.random() * 0.1,
                rotation: Math.random() * 360,
            };
        }), [active]
    );

    const colorMap = {
        gold: 'bg-amber-400',
        rose: 'bg-rose-400',
        blue: 'bg-sky-400',
    };

    const glowMap = {
        gold: 'shadow-amber-400/50',
        rose: 'shadow-rose-400/50',
        blue: 'shadow-sky-400/50',
    };

    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center pointer-events-none">
                    {/* Central flash */}
                    <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`absolute w-20 h-20 rounded-full ${colorMap[color]} blur-xl`}
                    />

                    {/* Ring expand */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 4, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute w-16 h-16 rounded-full border-2 border-white/50"
                    />

                    {/* Particles */}
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                            animate={{
                                x: p.x,
                                y: p.y,
                                scale: 0,
                                opacity: 0,
                                rotate: p.rotation,
                            }}
                            transition={{
                                duration: 0.7,
                                delay: p.delay,
                                ease: "easeOut",
                            }}
                            className={`absolute rounded-full ${colorMap[color]} shadow-lg ${glowMap[color]}`}
                            style={{
                                width: p.size,
                                height: p.size,
                            }}
                        />
                    ))}

                    {/* Sparkle crosses */}
                    {[0, 1, 2, 3].map(i => (
                        <motion.div
                            key={`sparkle-${i}`}
                            initial={{ scale: 0, opacity: 1, rotate: i * 45 }}
                            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                            className="absolute text-white text-2xl"
                            style={{
                                left: `calc(50% + ${Math.cos(i * 1.5) * 30}px)`,
                                top: `calc(50% + ${Math.sin(i * 1.5) * 30}px)`,
                            }}
                        >
                            ✦
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
