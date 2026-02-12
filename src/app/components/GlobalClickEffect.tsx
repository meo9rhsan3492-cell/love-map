
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface ClickHeart {
    id: number;
    x: number;
    y: number;
    rotation: number;
    color: string;
}

const COLORS = ['#ef4444', '#ec4899', '#d946ef', '#a855f7', '#f43f5e'];

export function GlobalClickEffect() {
    const [hearts, setHearts] = useState<ClickHeart[]>([]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const newHeart = {
                id: Date.now(),
                x: e.clientX,
                y: e.clientY,
                rotation: Math.random() * 360,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
            };

            setHearts(prev => [...prev, newHeart]);

            // Cleanup
            setTimeout(() => {
                setHearts(prev => prev.filter(h => h.id !== newHeart.id));
            }, 1000);
        };

        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ scale: 0, opacity: 1, x: heart.x, y: heart.y }}
                        animate={{
                            scale: [0, 1.5, 0],
                            opacity: [1, 1, 0],
                            y: heart.y - 100, // Float up
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ position: 'absolute' }}
                    >
                        <Heart
                            className="w-6 h-6 fill-current"
                            style={{ color: heart.color, transform: `rotate(${heart.rotation}deg)` }}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
