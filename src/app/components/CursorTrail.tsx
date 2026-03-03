import { useEffect, useRef } from 'react';

/**
 * Replaces CursorTrail: A soft glowing halo that follows the cursor/finger.
 * Desktop: warm ambient glow follows mouse
 * Mobile: glow follows touch point, fades when finger lifts
 * 
 * Pure canvas, GPU-friendly, no DOM elements.
 */

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export function CursorTrail() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafId = useRef(0);
    const target = useRef({ x: -200, y: -200 }); // offscreen initially
    const current = useRef({ x: -200, y: -200 });
    const visible = useRef(false);
    const fadeAlpha = useRef(0);

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

        // Mouse events
        const onMouseMove = (e: MouseEvent) => {
            target.current = { x: e.clientX, y: e.clientY };
            visible.current = true;
        };
        const onMouseLeave = () => { visible.current = false; };

        // Touch events
        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            if (t) { target.current = { x: t.clientX, y: t.clientY }; current.current = { ...target.current }; }
            visible.current = true;
        };
        const onTouchMove = (e: TouchEvent) => {
            const t = e.touches[0];
            if (t) target.current = { x: t.clientX, y: t.clientY };
        };
        const onTouchEnd = () => { visible.current = false; };

        window.addEventListener('mousemove', onMouseMove, { passive: true });
        document.addEventListener('mouseleave', onMouseLeave);
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });

        const LERP = isMobile ? 0.15 : 0.08; // Mobile follows faster
        const GLOW_SIZE = isMobile ? 80 : 120;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            // Smooth lerp towards target
            current.current.x += (target.current.x - current.current.x) * LERP;
            current.current.y += (target.current.y - current.current.y) * LERP;

            // Fade in/out
            if (visible.current) {
                fadeAlpha.current = Math.min(fadeAlpha.current + 0.05, 1);
            } else {
                fadeAlpha.current = Math.max(fadeAlpha.current - 0.03, 0);
            }

            if (fadeAlpha.current > 0.01) {
                const { x, y } = current.current;
                const alpha = fadeAlpha.current;

                // Outer warm glow
                const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, GLOW_SIZE);
                outerGrad.addColorStop(0, `rgba(251, 191, 36, ${0.15 * alpha})`); // amber center
                outerGrad.addColorStop(0.3, `rgba(244, 114, 182, ${0.1 * alpha})`); // pink
                outerGrad.addColorStop(0.6, `rgba(192, 132, 252, ${0.06 * alpha})`); // purple
                outerGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
                ctx.fillStyle = outerGrad;
                ctx.fillRect(x - GLOW_SIZE, y - GLOW_SIZE, GLOW_SIZE * 2, GLOW_SIZE * 2);

                // Inner bright core
                const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, GLOW_SIZE * 0.25);
                coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.25 * alpha})`);
                coreGrad.addColorStop(0.5, `rgba(251, 207, 232, ${0.15 * alpha})`);
                coreGrad.addColorStop(1, `rgba(0, 0, 0, 0)`);
                ctx.fillStyle = coreGrad;
                ctx.fillRect(x - GLOW_SIZE * 0.3, y - GLOW_SIZE * 0.3, GLOW_SIZE * 0.6, GLOW_SIZE * 0.6);
            }

            rafId.current = requestAnimationFrame(animate);
        };
        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
