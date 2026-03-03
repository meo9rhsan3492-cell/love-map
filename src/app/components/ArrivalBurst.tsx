import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';

interface ArrivalBurstProps {
    active: boolean;
    color?: 'gold' | 'rose' | 'blue';
}

/**
 * Lightweight arrival burst — 8 elements instead of 22.
 * Central flash + ring + 6 particles (no sparkle crosses).
 */
export function ArrivalBurst({ active, color = 'gold' }: ArrivalBurstProps) {
    const particles = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const velocity = 80 + (i * 20);
            return {
                id: i,
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                size: 4 + (i % 3) * 2,
            };
        }), [active]
    );

    const colorMap = {
        gold: 'bg-amber-400',
        rose: 'bg-rose-400',
        blue: 'bg-sky-400',
    };

    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[1500] flex items-center justify-center pointer-events-none">
                    {/* Central flash — no blur, just opacity */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`absolute w-16 h-16 rounded-full ${colorMap[color]}`}
                    />

                    {/* Ring expand */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0.6 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute w-16 h-16 rounded-full border-2 border-white/40"
                    />

                    {/* 6 particles (was 16 + 4 sparkles = 20 elements) */}
                    {particles.map(p => (
                        <motion.div
                            key={p.id}
                            initial={{ x: 0, y: 0, opacity: 0.9 }}
                            animate={{ x: p.x, y: p.y, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className={`absolute rounded-full ${colorMap[color]}`}
                            style={{ width: p.size, height: p.size }}
                        />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
