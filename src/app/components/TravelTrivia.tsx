import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Map, Globe, Wind } from 'lucide-react';

const TRIVIA_FACTS = [
    { icon: Map, text: "你们一起探索过的城市数量正在增加...", label: "Exploration" },
    { icon: Globe, text: "每一段旅程都是一次新的发现。", label: "Journey" },
    { icon: Compass, text: "还记得第一次旅行时的心情吗？", label: "Memory" },
    { icon: Wind, text: "最好的风景永远在路上。", label: "Vibe" },
    { icon: Heart, text: "距离不是问题，爱是唯一的方向。", label: "Love" },
]; // Import Heart needs lucide-react, I will fix imports below

import { Heart } from 'lucide-react';

interface TravelTriviaProps {
    show: boolean;
}

export function TravelTrivia({ show }: TravelTriviaProps) {
    const [fact, setFact] = useState(TRIVIA_FACTS[0]);

    useEffect(() => {
        if (show) {
            // Pick a random fact that is different from previous? (Simple random is fine)
            const random = TRIVIA_FACTS[Math.floor(Math.random() * TRIVIA_FACTS.length)];
            setFact(random);
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed top-24 right-8 z-50 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, x: 50, rotate: 5 }}
                        animate={{ opacity: 1, x: 0, rotate: -2 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="bg-white/95 border border-white shadow-xl rounded-2xl p-4 max-w-xs rotate-2 origin-top-right transform hover:rotate-0 transition-transform duration-500"
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-rose-100/50 p-2 rounded-full text-rose-500">
                                <fact.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">{fact.label}</h4>
                                <p className="text-sm font-medium text-gray-700 leading-relaxed font-serif">
                                    {fact.text}
                                </p>
                            </div>
                        </div>

                        {/* Decorative tape */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-200/60 -rotate-2 transform" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
