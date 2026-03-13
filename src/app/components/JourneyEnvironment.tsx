import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface JourneyEnvironmentProps {
    active: boolean;
    memoryDate?: string;
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

const SEASON_CONFIG: Record<Season, { gradient: string; overlay: string; emoji: string; label: string; particles: string[]; glow: string }> = {
    spring: {
        gradient: 'from-emerald-300/85 via-green-200/80 to-sky-200/85',
        overlay: 'rgba(144,238,144,0.2)',
        emoji: '🌸',
        label: '春',
        particles: ['🌸', '🌷', '🦋'],
        glow: 'rgba(52, 211, 153, 0.3)',
    },
    summer: {
        gradient: 'from-sky-400/85 via-cyan-200/80 to-amber-100/85',
        overlay: 'rgba(255,200,50,0.2)',
        emoji: '☀️',
        label: '夏',
        particles: ['✨', '🌻', '🌊'],
        glow: 'rgba(251, 191, 36, 0.3)',
    },
    autumn: {
        gradient: 'from-orange-400/85 via-amber-300/80 to-yellow-200/85',
        overlay: 'rgba(200,120,50,0.25)',
        emoji: '🍂',
        label: '秋',
        particles: ['🍂', '🍁', '🌾'],
        glow: 'rgba(251, 146, 60, 0.3)',
    },
    winter: {
        gradient: 'from-indigo-300/90 via-slate-200/85 to-blue-200/90',
        overlay: 'rgba(150,180,220,0.25)',
        emoji: '❄️',
        label: '冬',
        particles: ['❄️', '🌨️', '⛄'],
        glow: 'rgba(147, 197, 253, 0.3)',
    },
};

const TIME_CONFIG: Record<TimeOfDay, { gradient: string; opacity: number; label: string; icon: string }> = {
    dawn: {
        gradient: 'linear-gradient(180deg, rgba(255,180,120,0.4) 0%, rgba(255,230,200,0.1) 100%)',
        opacity: 0.6,
        label: '清晨',
        icon: '🌅',
    },
    day: {
        gradient: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)',
        opacity: 0.2,
        label: '白天',
        icon: '☀️',
    },
    sunset: {
        gradient: 'linear-gradient(180deg, rgba(255,100,50,0.4) 0%, rgba(200,60,100,0.2) 50%, rgba(80,40,100,0.1) 100%)',
        opacity: 0.7,
        label: '傍晚',
        icon: '🌇',
    },
    night: {
        gradient: 'linear-gradient(180deg, rgba(10,10,30,0.8) 0%, rgba(20,20,50,0.6) 50%, rgba(10,10,30,0.8) 100%)',
        opacity: 0.9,
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
    if (hour === 0 && !dateStr.includes('T')) {
        const month = d.getMonth() + 1;
        if (month >= 6 && month <= 8) return 'day';
        if (month >= 11 || month <= 2) return 'night';
        return 'sunset';
    }
    if (hour >= 5 && hour < 8) return 'dawn';
    if (hour >= 8 && hour < 17) return 'day';
    if (hour >= 17 && hour < 20) return 'sunset';
    return 'night';
}

// ★ Pre-compute star positions ONCE (avoid Math.random in render)
const STAR_POSITIONS = Array.from({ length: 12 }, (_, i) => ({
    left: `${(i * 8.3 + 5) % 100}%`,
    top: `${(i * 7.1 + 3) % 50}%`,
    duration: 1.5 + (i * 0.37) % 2,
    delay: (i * 0.5) % 3,
}));

// ★ Pre-compute particle positions (avoid Math.random in render)
const PARTICLE_DRIFT = [25, -20, 30, -15, 20];

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
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    className="fixed inset-0 pointer-events-none z-0"
                    style={{ willChange: 'opacity' }}
                >
                    {/* Season gradient — single div, no blend mode overhead */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${seasonConfig.gradient}`} />

                    {/* Day/night overlay — single div */}
                    {timeConfig.opacity > 0 && (
                        <div className="absolute inset-0" style={{ background: timeConfig.gradient }} />
                    )}

                    {/* Night stars — CSS animation only, no Framer per-star */}
                    {env.timeOfDay === 'night' && (
                        <div className="absolute inset-0 overflow-hidden">
                            {STAR_POSITIONS.map((star, i) => (
                                <div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full bg-white animate-pulse"
                                    style={{
                                        left: star.left,
                                        top: star.top,
                                        animationDuration: `${star.duration}s`,
                                        animationDelay: `${star.delay}s`,
                                        opacity: 0.6,
                                    }}
                                />
                            ))}
                            <div className="absolute top-[8%] right-[12%] w-10 h-10 rounded-full bg-yellow-100/80 shadow-[0_0_20px_rgba(255,255,200,0.25)]" />
                        </div>
                    )}

                    {/* Floating particles — pure CSS keyframes, no Framer overhead */}
                    <div className="absolute inset-0 overflow-hidden">
                        {seasonConfig.particles.map((emoji, i) => (
                            <div
                                key={i}
                                className="absolute text-lg"
                                style={{
                                    left: `${20 + i * 30}%`,
                                    top: '-5%',
                                    willChange: 'transform',
                                    animation: `journeyFloat ${10 + i * 4}s linear ${i * 2}s infinite`,
                                    transform: `translateX(${PARTICLE_DRIFT[i]}px)`,
                                }}
                            >
                                {emoji}
                            </div>
                        ))}
                    </div>

                    {/* Environment badge — no backdrop-blur on small element */}
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/15 z-10"
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
