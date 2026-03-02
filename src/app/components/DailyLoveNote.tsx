import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircleHeart, X } from 'lucide-react';

const LOVE_NOTES = [
    { text: '今天也要开开心心哦 ☀️', mood: 'happy' },
    { text: '你笑起来真好看 🌸', mood: 'sweet' },
    { text: '想你了，抱抱 🤗', mood: 'miss' },
    { text: '今晚想和你一起看星星 ✨', mood: 'romantic' },
    { text: '谢谢你出现在我的生命里 💕', mood: 'grateful' },
    { text: '以后的日子，有我陪你 🌙', mood: 'promise' },
    { text: '你是我见过最可爱的人 🎀', mood: 'cute' },
    { text: '每天醒来第一个想到的是你 🌅', mood: 'morning' },
    { text: '今天份的喜欢已送达 💌', mood: 'daily' },
    { text: '你要一直这么好命，有我疼你 👑', mood: 'pamper' },
    { text: '世界上最幸运的事就是遇见你 🍀', mood: 'lucky' },
    { text: '好想捏你的小脸 🥰', mood: 'playful' },
    { text: '你是我的例外，也是我的偏爱 💗', mood: 'special' },
    { text: '和你在一起的每一秒都值得 ⏰', mood: 'time' },
    { text: '我的快乐很简单，都是因为你 🎵', mood: 'joy' },
    { text: '下辈子还选你 🔄💕', mood: 'forever' },
    { text: '今天也是爱你的一天 📮', mood: 'love' },
    { text: '你奶呼呼的样子，好可爱 🍼', mood: 'adorable' },
    { text: '不管走到哪，我都会牵着你 🫱🏻‍🫲🏻', mood: 'together' },
    { text: '在我眼里，你永远是最好看的 👀💖', mood: 'beautiful' },
];

export function DailyLoveNote() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Select a note based on the date (changes daily)
    const todayNote = useMemo(() => {
        const today = new Date();
        const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
        );
        return LOVE_NOTES[dayOfYear % LOVE_NOTES.length];
    }, []);

    useEffect(() => {
        // Check if already shown today
        const today = new Date().toISOString().split('T')[0];
        const lastShown = localStorage.getItem('love-note-last-shown');
        if (lastShown === today) {
            setDismissed(true);
            return;
        }

        // Show with delay
        const timer = setTimeout(() => {
            setVisible(true);
            localStorage.setItem('love-note-last-shown', today);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // Auto dismiss after 8 seconds
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => {
            setVisible(false);
            setDismissed(true);
        }, 8000);
        return () => clearTimeout(timer);
    }, [visible]);

    if (dismissed) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.9, rotate: -5 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, y: 40, scale: 0.9, rotate: 5 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 250 }}
                    className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-[800] max-w-xs"
                >
                    <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-pink-100/60 p-4 pr-10">
                        {/* Envelope flap triangle */}
                        <div className="absolute -top-3 left-6 w-6 h-6 bg-pink-100 rotate-45 rounded-sm border-l border-t border-pink-200/60" />

                        {/* Close */}
                        <button
                            onClick={() => { setVisible(false); setDismissed(true); }}
                            className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Content */}
                        <div className="flex items-start gap-3 relative z-10">
                            <motion.div
                                animate={{ rotate: [0, -10, 10, -5, 0] }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md"
                            >
                                <MessageCircleHeart className="w-4.5 h-4.5 text-white" />
                            </motion.div>
                            <div>
                                <p className="text-xs text-pink-400 font-bold mb-1 flex items-center gap-1">
                                    <Heart className="w-3 h-3 fill-pink-400" />
                                    今日情话
                                </p>
                                <p className="text-sm text-gray-700 font-cute leading-relaxed">
                                    {todayNote.text}
                                </p>
                            </div>
                        </div>

                        {/* Subtle pulse ring */}
                        <motion.div
                            className="absolute -inset-1 rounded-2xl border border-pink-200/40"
                            animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
