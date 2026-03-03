import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface JourneyEnvironmentProps {
    active: boolean;
    memoryDate?: string; // ISO string like "2024-06-15" or "2023-12-25T20:30"
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

const SEASON_CONFIG: Record<Season, { gradient: string; overlay: string; emoji: string; label: string; particles: string[] }> = {
    spring: {
        gradient: 'from-green-200/30 via-pink-100/20 to-sky-100/20',
        overlay: 'rgba(144,238,144,0.08)',
        emoji: '🌸',
        label: '春',
        particles: ['🌸', '🌷', '🦋'],
    },
    summer: {
        gradient: 'from-amber-200/30 via-orange-100/20 to-sky-200/20',
        overlay: 'rgba(255,200,50,0.08)',
        emoji: '☀️',
        label: '夏',
        particles: ['✨', '🌻', '🌊'],
    },
    autumn: {
        gradient: 'from-orange-300/30 via-amber-200/20 to-red-100/20',
        overlay: 'rgba(200,120,50,0.1)',
        emoji: '🍂',
        label: '秋',
        particles: ['🍂', '🍁', '🌾'],
    },
    winter: {
        gradient: 'from-blue-200/30 via-slate-100/20 to-indigo-100/20',
        overlay: 'rgba(150,180,220,0.1)',
        emoji: '❄️',
        label: '冬',
        particles: ['❄️', '🌨️', '⛄'],
    },
};

const TIME_CONFIG: Record<TimeOfDay, { gradient: string; opacity: number; label: string; icon: string }> = {
    dawn: {
        gradient: 'linear-gradient(180deg, rgba(255,200,150,0.15) 0%, rgba(255,230,200,0.05) 100%)',
        opacity: 0.3,
        label: '清晨',
        icon: '🌅',
    },
    day: {
        gradient: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)',
        opacity: 0,
        label: '白天',
        icon: '☀️',
    },
    sunset: {
        gradient: 'linear-gradient(180deg, rgba(255,120,50,0.12) 0%, rgba(200,80,120,0.08) 50%, rgba(80,50,120,0.06) 100%)',
        opacity: 0.3,
        label: '傍晚',
        icon: '🌇',
    },
    night: {
        gradient: 'linear-gradient(180deg, rgba(10,10,40,0.35) 0%, rgba(20,20,60,0.2) 50%, rgba(10,10,30,0.15) 100%)',
        opacity: 0.5,
        label: '夜晚',
        icon: '🌙',
    },
};

function getSeason(month: number): Season {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
}

function getTimeOfDay(dateStr: string): TimeOfDay {
    const d = new Date(dateStr);
    const hour = d.getHours();
    // If no time info (midnight exactly + date-only string), infer from season
    if (hour === 0 && !dateStr.includes('T')) {
        const month = d.getMonth() + 1;
        if (month >= 6 && month <= 8) return 'day'; // summer = bright
        if (month >= 11 || month <= 2) return 'night'; // winter = dark feel
        return 'sunset'; // spring/autumn = golden hour vibe
    }
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
}

export function JourneyEnvironment({ active, memoryDate }: JourneyEnvironmentProps) {
    const env = useMemo(() => {
        if (!memoryDate) return null;
        const d = new Date(memoryDate);
        if (isNaN(d.getTime())) return null;
        const month = d.getMonth() + 1;
        const season = getSeason(month);
        const timeOfDay = getTimeOfDay(memoryDate);
        return { season, timeOfDay, seasonConfig: SEASON_CONFIG[season], timeConfig: TIME_CONFIG[timeOfDay] };
    }, [memoryDate]);

    if (!env) return null;

    const { seasonConfig, timeConfig } = env;

    return (
        <AnimatePresence mode="wait">
            {active && (
                <motion.div
                    key={`${env.season}-${env.timeOfDay}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    className="fixed inset-0 pointer-events-none z-[6]"
                    style={{ willChange: 'opacity' }}
                >
                    {/* Season gradient overlay */}
                    <div
                        className={`absolute inset-0 bg-gradient-to-br ${seasonConfig.gradient}`}
                        style={{ mixBlendMode: 'soft-light' }}
                    />

                    {/* Day/night overlay */}
                    <div
                        className="absolute inset-0"
                        style={{ background: timeConfig.gradient, opacity: timeConfig.opacity > 0 ? 1 : 0 }}
                    />

                    {/* Night stars */}
                    {env.timeOfDay === 'night' && (
                        <div className="absolute inset-0 overflow-hidden">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full bg-white"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `${Math.random() * 50}%`,
                                    }}
                                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                                    transition={{
                                        duration: Math.random() * 2 + 1.5,
                                        repeat: Infinity,
                                        delay: Math.random() * 2,
                                    }}
                                />
                            ))}
                            {/* Moon */}
                            <div
                                className="absolute top-[8%] right-[12%] w-10 h-10 rounded-full bg-yellow-100/80 shadow-[0_0_30px_rgba(255,255,200,0.3)]"
                            />
                        </div>
                    )}

                    {/* Dawn sun glow */}
                    {env.timeOfDay === 'dawn' && (
                        <motion.div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] rounded-full"
                            style={{
                                background: 'radial-gradient(ellipse, rgba(255,180,100,0.2) 0%, rgba(255,200,150,0.08) 50%, transparent 80%)',
                            }}
                            animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
                            transition={{ duration: 4, repeat: Infinity }}
                        />
                    )}

                    {/* Floating seasonal particles */}
                    <div className="absolute inset-0 overflow-hidden">
                        {seasonConfig.particles.map((emoji, i) => (
                            <motion.div
                                key={i}
                                className="absolute text-lg"
                                style={{
                                    left: `${20 + i * 30}%`,
                                    top: '-5%',
                                    willChange: 'transform',
                                }}
                                animate={{
                                    y: ['0vh', '110vh'],
                                    x: [0, (Math.random() - 0.5) * 60],
                                    rotate: [0, 360],
                                }}
                                transition={{
                                    duration: 12 + i * 3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    delay: i * 2,
                                }}
                            >
                                {emoji}
                            </motion.div>
                        ))}
                    </div>

                    {/* Environment badge */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 25 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/30 backdrop-blur-xl px-4 py-2 rounded-full border border-white/15 z-10"
                    >
                        <span className="text-base">{seasonConfig.emoji}</span>
                        <span className="text-white/90 text-xs font-bold tracking-wider">
                            {seasonConfig.label} · {timeConfig.label}
                        </span>
                        <span className="text-base">{timeConfig.icon}</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
