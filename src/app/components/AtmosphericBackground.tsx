import { useEffect, useRef } from 'react';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

/**
 * Subtle aurora borealis effect flowing across the top of screen.
 * Pure CSS + Canvas hybrid for best performance.
 * Replaces static blur orbs with flowing light bands.
 */
export function AtmosphericBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafId = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let w = window.innerWidth;
        let h = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        // Time-of-day color scheme
        const hour = new Date().getHours();
        let palette: [string, string, string];
        if (hour >= 6 && hour < 17) {
            palette = ['rgba(251,191,36,0.06)', 'rgba(244,114,182,0.08)', 'rgba(192,132,252,0.05)']; // Day: warm
        } else if (hour >= 17 && hour < 20) {
            palette = ['rgba(249,115,22,0.08)', 'rgba(192,132,252,0.1)', 'rgba(244,114,182,0.06)']; // Evening: sunset
        } else {
            palette = ['rgba(99,102,241,0.08)', 'rgba(139,92,246,0.1)', 'rgba(59,130,246,0.06)']; // Night: cool
        }

        let t = 0;
        const SPEED = isMobile ? 0.003 : 0.002;
        const BAND_COUNT = isMobile ? 2 : 3;

        const animate = () => {
            t += SPEED;
            ctx.clearRect(0, 0, w, h);

            // Draw flowing aurora bands
            for (let i = 0; i < BAND_COUNT; i++) {
                const phase = t + i * 2.1;
                const yCenter = h * (0.15 + i * 0.25) + Math.sin(phase * 0.7) * h * 0.08;

                ctx.beginPath();
                ctx.moveTo(0, yCenter - 80);

                // Smooth wave using bezier curves
                const segments = 6;
                for (let s = 0; s <= segments; s++) {
                    const sx = (s / segments) * w;
                    const sy = yCenter + Math.sin(phase + s * 0.8) * 50 + Math.cos(phase * 0.5 + s * 1.2) * 30;
                    if (s === 0) {
                        ctx.moveTo(sx, sy - 60);
                    } else {
                        const cpx = sx - w / segments / 2;
                        const cpy = sy + Math.sin(phase + s) * 20;
                        ctx.quadraticCurveTo(cpx, cpy - 60, sx, sy - 60);
                    }
                }

                // Close the band
                for (let s = segments; s >= 0; s--) {
                    const sx = (s / segments) * w;
                    const sy = yCenter + Math.sin(phase + s * 0.8) * 50 + Math.cos(phase * 0.5 + s * 1.2) * 30;
                    if (s === segments) {
                        ctx.lineTo(sx, sy + 60);
                    } else {
                        const cpx = sx + w / segments / 2;
                        const cpy = sy + Math.sin(phase + s) * 20;
                        ctx.quadraticCurveTo(cpx, cpy + 60, sx, sy + 60);
                    }
                }

                ctx.closePath();
                ctx.fillStyle = palette[i % palette.length];
                ctx.fill();
            }

            rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <>
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[4]"
                style={{ mixBlendMode: 'screen' }}
            />
            {/* Noise texture overlay */}
            <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.03] mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
        </>
    );
}
