import { useMemo, useEffect, useState } from 'react';

interface ArrivalBurstProps {
    active: boolean;
    color?: 'gold' | 'rose' | 'blue';
}

/**
 * Pure CSS Arrival burst — zero JS main-thread overhead.
 */
export function ArrivalBurst({ active, color = 'gold' }: ArrivalBurstProps) {
    const [render, setRender] = useState(active);

    useEffect(() => {
        if (active) setRender(true);
        else {
            const t = setTimeout(() => setRender(false), 600);
            return () => clearTimeout(t);
        }
    }, [active]);

    const particles = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const velocity = 80 + (i * 20);
            return {
                id: i,
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                size: 4 + (i % 3) * 2,
            };
        }), []
    );

    const colorMap = {
        gold: 'bg-amber-400',
        rose: 'bg-rose-400',
        blue: 'bg-sky-400',
    };

    if (!render) return null;

    return (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center pointer-events-none">
            <style>{`
                @keyframes burst-flash {
                    0% { transform: scale(0); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes burst-ring {
                    0% { transform: scale(0); opacity: 0.6; }
                    100% { transform: scale(3); opacity: 0; }
                }
                @keyframes burst-particle {
                    0% { transform: translate(0, 0); opacity: 0.9; }
                    100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
                }
            `}</style>

            {active && (
                <>
                    {/* Central flash */}
                    <div
                        className={`absolute w-16 h-16 rounded-full ${colorMap[color]}`}
                        style={{ animation: 'burst-flash 0.5s ease-out forwards', willChange: 'transform, opacity' }}
                    />

                    {/* Ring expand */}
                    <div
                        className="absolute w-16 h-16 rounded-full border-2 border-white/40"
                        style={{ animation: 'burst-ring 0.6s ease-out forwards', willChange: 'transform, opacity' }}
                    />

                    {/* Particles */}
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className={`absolute rounded-full ${colorMap[color]}`}
                            style={{
                                width: p.size,
                                height: p.size,
                                '--dx': `${p.x}px`,
                                '--dy': `${p.y}px`,
                                animation: 'burst-particle 0.5s ease-out forwards',
                                willChange: 'transform, opacity'
                            } as React.CSSProperties}
                        />
                    ))}
                </>
            )}
        </div>
    );
}
