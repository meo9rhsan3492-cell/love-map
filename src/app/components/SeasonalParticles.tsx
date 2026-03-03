import { useMemo } from 'react';

/**
 * Seasonal floating particles using pure CSS animations (GPU-accelerated).
 * No Framer Motion = zero JS overhead per frame.
 */
export function SeasonalParticles() {
    const month = new Date().getMonth() + 1;

    const season = useMemo(() => {
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }, [month]);

    const emoji = season === 'spring' ? '🌸' : season === 'summer' ? '✨' : season === 'autumn' ? '🍂' : '❄️';

    const particles = useMemo(() => {
        const count = 8; // Reduced from 12
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 10}s`,
            duration: `${Math.random() * 6 + 10}s`,
            size: Math.random() * 10 + 8,
            drift: (Math.random() - 0.5) * 30,
        }));
    }, []);

    return (
        <>
            <style>{`
                @keyframes seasonal-fall {
                    0% { transform: translate3d(0, -5vh, 0) rotate(0deg); opacity: 0.3; }
                    10% { opacity: 0.4; }
                    90% { opacity: 0.3; }
                    100% { transform: translate3d(var(--drift), 105vh, 0) rotate(360deg); opacity: 0; }
                }
                .seasonal-particle {
                    position: absolute;
                    will-change: transform;
                    animation: seasonal-fall var(--dur) var(--delay) linear infinite;
                    pointer-events: none;
                }
            `}</style>
            <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="seasonal-particle"
                        style={{
                            left: p.left,
                            fontSize: p.size,
                            '--drift': `${p.drift}px`,
                            '--dur': p.duration,
                            '--delay': p.delay,
                        } as React.CSSProperties}
                    >
                        {emoji}
                    </div>
                ))}
            </div>
        </>
    );
}
