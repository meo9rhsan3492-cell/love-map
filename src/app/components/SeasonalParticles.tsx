import { useMemo } from 'react';
import { motion } from 'motion/react';

/**
 * Seasonal floating particles:
 * Spring (3-5): 🌸 Cherry blossoms
 * Summer (6-8): ✨ Fireflies
 * Autumn (9-11): 🍂 Falling leaves
 * Winter (12-2): ❄️ Snowflakes
 */
export function SeasonalParticles() {
    const month = new Date().getMonth() + 1;

    const season = useMemo(() => {
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }, [month]);

    const particles = useMemo(() => {
        const count = 12;
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 8,
            duration: Math.random() * 6 + 8,
            size: Math.random() * 12 + 8,
            drift: (Math.random() - 0.5) * 40,
            rotation: Math.random() * 720,
        }));
    }, []);

    const getParticleContent = (size: number) => {
        const style = { fontSize: size };
        switch (season) {
            case 'spring':
                return <span style={style}>🌸</span>;
            case 'summer':
                return (
                    <span style={style} className="blur-[0.5px]">
                        ✨
                    </span>
                );
            case 'autumn':
                return <span style={style}>{Math.random() > 0.5 ? '🍂' : '🍁'}</span>;
            case 'winter':
                return <span style={style}>❄️</span>;
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    className="absolute opacity-40"
                    initial={{
                        left: `${p.x}%`,
                        top: '-5%',
                        rotate: 0,
                    }}
                    animate={{
                        top: '105%',
                        left: `${p.x + p.drift}%`,
                        rotate: p.rotation,
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                >
                    {getParticleContent(p.size)}
                </motion.div>
            ))}
        </div>
    );
}
