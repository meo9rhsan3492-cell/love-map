
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeartRainProps {
    isActive: boolean;
    onComplete: () => void;
}

export function HeartRain({ isActive, onComplete }: HeartRainProps) {
    const [hearts, setHearts] = useState<{ id: number; left: number; delay: number; duration: number }[]>([]);

    useEffect(() => {
        if (isActive) {
            // Responsive heart count: 30 for desktop, 15 for mobile
            const count = window.innerWidth < 768 ? 15 : 30;
            const newHearts = Array.from({ length: count }).map((_, i) => ({
                id: i,
                left: Math.random() * 100, // Random horizontal position
                delay: Math.random() * 0.5, // Random delay
                duration: 2 + Math.random() * 2, // Random fall duration
            }));
            setHearts(newHearts);

            // Auto cleanup after animation
            const timer = setTimeout(onComplete, 4500);
            return () => clearTimeout(timer);
        } else {
            setHearts([]);
        }
    }, [isActive, onComplete]);

    return (
        <AnimatePresence>
            {isActive && (
                <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
                    {hearts.map((heart) => (
                        <motion.div
                            key={heart.id}
                            initial={{ y: -50, opacity: 1, rotate: 0 }}
                            animate={{
                                y: '110vh',
                                rotate: 360,
                                opacity: [1, 1, 0]
                            }}
                            transition={{
                                duration: heart.duration,
                                delay: heart.delay,
                                ease: 'linear'
                            }}
                            style={{
                                position: 'absolute',
                                left: `${heart.left}%`,
                                top: -20
                            }}
                        >
                            <Heart
                                className={`w-6 h-6 ${heart.id % 2 === 0 ? 'text-pink-400 fill-pink-200' : 'text-purple-400 fill-purple-200'}`}
                            />
                        </motion.div>
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}
