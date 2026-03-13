import { useEffect, useState } from 'react';

interface CinematicShutterProps {
    active: boolean;
}

export function CinematicShutter({ active }: CinematicShutterProps) {
    const [render, setRender] = useState(active);

    useEffect(() => {
        if (active) setRender(true);
        else {
            const t = setTimeout(() => setRender(false), 400); // Wait for exit animations
            return () => clearTimeout(t);
        }
    }, [active]);

    if (!render) return null;

    const inStyle = { animation: 'shutter-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' };
    const outStyle = { animation: 'shutter-out 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' };

    return (
        <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
            <style>{`
                @keyframes shutter-in {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(0%); }
                }
                @keyframes shutter-out {
                    0% { transform: translateY(0%); }
                    100% { transform: translateY(-100%); }
                }
                @keyframes shutter-in-bottom {
                    0% { transform: translateY(100%); }
                    100% { transform: translateY(0%); }
                }
                @keyframes shutter-out-bottom {
                    0% { transform: translateY(0%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes shutter-flash {
                    0% { opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
                @keyframes shutter-burst {
                    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.5; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
            `}</style>

            {/* Top blade */}
            <div
                className="absolute top-0 left-0 right-0 h-[52%] bg-black origin-top"
                style={active ? inStyle : outStyle}
            >
                {/* Shutter line glow */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </div>

            {/* Bottom blade */}
            <div
                className="absolute bottom-0 left-0 right-0 h-[52%] bg-black origin-bottom"
                style={active ? { animation: 'shutter-in-bottom 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' } : { animation: 'shutter-out-bottom 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
            >
                {/* Shutter line glow */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
            </div>

            {/* Flash effects only on entry */}
            {active && (
                <>
                    <div
                        className="absolute inset-0 bg-white"
                        style={{ animation: 'shutter-flash 0.25s 0.3s forwards', opacity: 0 }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 w-40 h-40 rounded-full bg-amber-200/20"
                        style={{ animation: 'shutter-burst 0.4s 0.3s forwards', transform: 'translate(-50%, -50%) scale(0)' }}
                    />
                </>
            )}
        </div>
    );
}
