import { useEffect, useRef } from 'react';

/**
 * Beautiful ink ripple effect on click/tap.
 * Expanding ring with Chinese ink-wash aesthetic.
 * Pure canvas, no DOM re-renders.
 */

interface Ripple {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    life: number;
    hue: number;
}

export function GlobalClickEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ripples = useRef<Ripple[]>([]);
    const rafId = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let dpr = window.devicePixelRatio || 1;

        const resize = () => {
            dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const addRipple = (x: number, y: number) => {
            if (ripples.current.length >= 5) return; // Cap concurrent ripples
            ripples.current.push({
                x, y,
                radius: 0,
                maxRadius: 60 + Math.random() * 40,
                life: 1.0,
                hue: 330 + Math.random() * 40, // Pink-rose range
            });
        };

        const handleClick = (e: MouseEvent) => addRipple(e.clientX, e.clientY);
        const handleTouch = (e: TouchEvent) => {
            const t = e.changedTouches[0];
            if (t) addRipple(t.clientX, t.clientY);
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('touchstart', handleTouch, { passive: true });

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            const rs = ripples.current;
            let writeIdx = 0;

            for (let i = 0; i < rs.length; i++) {
                const r = rs[i];
                r.radius += (r.maxRadius - r.radius) * 0.08; // Ease out expansion
                r.life -= 0.02;

                if (r.life <= 0) continue;

                const alpha = r.life;

                // Outer ring
                ctx.strokeStyle = `hsla(${r.hue}, 80%, 70%, ${alpha * 0.6})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.stroke();

                // Inner ring (slightly behind)
                ctx.strokeStyle = `hsla(${r.hue + 20}, 70%, 80%, ${alpha * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
                ctx.stroke();

                // Center dot flash
                if (r.life > 0.7) {
                    const dotAlpha = (r.life - 0.7) / 0.3;
                    const dotGrad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 8);
                    dotGrad.addColorStop(0, `hsla(${r.hue}, 90%, 85%, ${dotAlpha * 0.8})`);
                    dotGrad.addColorStop(1, `hsla(${r.hue}, 90%, 85%, 0)`);
                    ctx.fillStyle = dotGrad;
                    ctx.fillRect(r.x - 10, r.y - 10, 20, 20);
                }

                rs[writeIdx++] = r;
            }
            rs.length = writeIdx;

            rafId.current = requestAnimationFrame(animate);
        };
        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('touchstart', handleTouch);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
        />
    );
}
