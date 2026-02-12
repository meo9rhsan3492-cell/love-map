import { motion } from 'motion/react';
import { Sparkles, Trophy, Flag, Map } from 'lucide-react';

interface MilestoneBadgeProps {
    type: 'count' | 'streak' | 'city' | 'anniversary';
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
}

export function MilestoneBadge({ type, title, subtitle, icon }: MilestoneBadgeProps) {
    const getIcon = () => {
        if (icon) return icon;
        switch (type) {
            case 'count': return <Flag className="w-8 h-8 text-yellow-500" />;
            case 'streak': return <Trophy className="w-8 h-8 text-orange-500" />;
            case 'city': return <Map className="w-8 h-8 text-blue-500" />;
            default: return <Sparkles className="w-8 h-8 text-pink-500" />;
        }
    };

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[150] pointer-events-none">
            <motion.div
                initial={{ y: -100, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px]"
            >
                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-3 rounded-xl shadow-inner">
                    {getIcon()}
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-0.5">Time Capsule Unlocked</div>
                    <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 font-display">
                        {title}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        {subtitle}
                    </div>
                </div>

                {/* Shine effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 pointer-events-none"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                />
            </motion.div>
        </div>
    );
}
