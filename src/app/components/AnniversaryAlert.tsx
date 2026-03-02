import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Gift, Star, X } from 'lucide-react';

interface AnniversaryAlertProps {
    startDate: string;
}

const MILESTONES = [
    { days: 1, emoji: '💕', title: '第一天', message: '爱的旅程从今天开始' },
    { days: 7, emoji: '🌸', title: '一周啦', message: '我们在一起已经一周了！' },
    { days: 30, emoji: '🌙', title: '满月纪念', message: '陪你走过了第一个月' },
    { days: 50, emoji: '🎀', title: '50天啦', message: '半个百天，满分幸福' },
    { days: 100, emoji: '💯', title: '百天纪念', message: '100天，每天都在更爱你' },
    { days: 200, emoji: '🌟', title: '200天', message: '200天，你是我最美的风景' },
    { days: 300, emoji: '🏵️', title: '300天', message: '300天，感谢有你的每一天' },
    { days: 365, emoji: '🎂', title: '一周年', message: '我们在一起一整年了！' },
    { days: 500, emoji: '💎', title: '500天', message: '500天，爱情恒久闪耀' },
    { days: 520, emoji: '💗', title: '520天', message: '520 = 我爱你，永远不变' },
    { days: 730, emoji: '👑', title: '两周年', message: '两年了，你依然是我的宝贝' },
    { days: 1000, emoji: '🌈', title: '1000天', message: '一千天，一千个爱你的理由' },
    { days: 1095, emoji: '🎊', title: '三周年', message: '三年如初，爱你依旧' },
];

export function AnniversaryAlert({ startDate }: AnniversaryAlertProps) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    const milestone = useMemo(() => {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) return null;

        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Check if today matches any milestone
        return MILESTONES.find(m => m.days === diffDays) || null;
    }, [startDate]);

    useEffect(() => {
        if (!milestone) return;
        // Only show once per day
        const key = `anniversary-shown-${milestone.days}`;
        if (sessionStorage.getItem(key)) return;

        const timer = setTimeout(() => {
            setVisible(true);
            sessionStorage.setItem(key, 'true');
        }, 2000);
        return () => clearTimeout(timer);
    }, [milestone]);

    if (!milestone || dismissed) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
                    onClick={() => { setDismissed(true); setVisible(false); }}
                >
                    {/* Backdrop with sparkle particles */}
                    <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

                    {/* Floating hearts */}
                    {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute text-pink-300/60 pointer-events-none"
                            initial={{
                                x: `${Math.random() * 100}vw`,
                                y: '100vh',
                                scale: Math.random() * 0.5 + 0.5,
                                rotate: Math.random() * 360
                            }}
                            animate={{
                                y: '-10vh',
                                rotate: Math.random() * 720,
                                transition: {
                                    duration: Math.random() * 4 + 4,
                                    repeat: Infinity,
                                    delay: Math.random() * 3
                                }
                            }}
                        >
                            <Heart className="w-4 h-4 fill-current" />
                        </motion.div>
                    ))}

                    {/* Main Card */}
                    <motion.div
                        initial={{ scale: 0.5, y: 60, rotateX: 15 }}
                        animate={{ scale: 1, y: 0, rotateX: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="relative bg-gradient-to-b from-white via-pink-50 to-purple-50 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-pink-100/50 text-center overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Shimmer overlay */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{ x: ['-100%', '200%'] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                        />

                        {/* Close button */}
                        <button
                            onClick={() => { setDismissed(true); setVisible(false); }}
                            className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Big emoji */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: 0.3, damping: 10 }}
                            className="text-7xl mb-4 relative z-10"
                        >
                            {milestone.emoji}
                        </motion.div>

                        {/* Decorative ring */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-pink-200/50"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 3, opacity: [0, 0.5, 0] }}
                            transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
                        />

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-cute font-bold text-gray-800 mb-2 relative z-10"
                        >
                            {milestone.title}
                        </motion.h2>

                        {/* Days badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4 relative z-10"
                        >
                            <Heart className="w-3.5 h-3.5 fill-white" />
                            第 {milestone.days} 天
                            <Sparkles className="w-3.5 h-3.5" />
                        </motion.div>

                        {/* Message */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-gray-500 font-cute text-lg leading-relaxed relative z-10"
                        >
                            {milestone.message}
                        </motion.p>

                        {/* Footer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="mt-6 flex items-center justify-center gap-2 text-xs text-pink-400 relative z-10"
                        >
                            <Gift className="w-3.5 h-3.5" />
                            <span>点击任意处关闭</span>
                            <Star className="w-3.5 h-3.5 fill-current" />
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
