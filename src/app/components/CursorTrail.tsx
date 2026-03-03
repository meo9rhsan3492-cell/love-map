import { useEffect, useRef } from 'react';

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

const COLORS = ['#f472b6', '#fbbf24', '#c084fc', '#fbcfe8', '#fb7185'];
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export function CursorTrail() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const points = useRef<Point[]>([]);
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

        const MAX_PARTICLES = isMobile ? 25 : 40;
        const THROTTLE_MS = isMobile ? 40 : 25;

        let lastAdd = 0;

        const addPoint = (x: number, y: number) => {
            const now = performance.now();
            if (now - lastAdd < THROTTLE_MS) return;
            if (points.current.length >= MAX_PARTICLES) return;

            points.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 0.5, // Float upward
                life: 1.0,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                size: isMobile ? Math.random() * 4 + 3 : Math.random() * 3 + 2,
            });
            lastAdd = now;
        };

        // Desktop: mousemove
        const handleMouseMove = (e: MouseEvent) => {
            addPoint(e.clientX, e.clientY);
        };

        // Mobile: touchmove
        const handleTouchMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) addPoint(touch.clientX, touch.clientY);
        };
        const handleTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            if (touch) addPoint(touch.clientX, touch.clientY);
        };

        // Draw a heart path
        const drawHeart = (cx: number, cy: number, size: number) => {
            const s = size * 1.2;
            ctx.beginPath();
            ctx.moveTo(cx, cy + s * 0.3);
            ctx.bezierCurveTo(cx, cy, cx - s, cy, cx - s, cy + s * 0.3);
            ctx.bezierCurveTo(cx - s, cy + s * 0.7, cx, cy + s, cx, cy + s * 1.2);
            ctx.bezierCurveTo(cx, cy + s, cx + s, cy + s * 0.7, cx + s, cy + s * 0.3);
            ctx.bezierCurveTo(cx + s, cy, cx, cy, cx, cy + s * 0.3);
            ctx.fill();
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            const pts = points.current;
            let writeIdx = 0;

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.02; // Tiny gravity
                p.life -= 0.02;
                p.size *= 0.97;

                if (p.life <= 0 || p.size < 0.3) continue;

                ctx.globalAlpha = p.life * 0.8;
                ctx.fillStyle = p.color;
                drawHeart(p.x, p.y, p.size);

                pts[writeIdx++] = p;
            }
            pts.length = writeIdx;

            rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchStart);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
