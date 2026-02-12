
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

export function CursorTrail() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const points = useRef<Point[]>([]);
    const mouse = useRef({ x: 0, y: 0 });
    const isActive = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const colors = ['#f472b6', '#fbbf24', '#c084fc', '#fbcfe8']; // Pink, Gold, Purple, Light Pink

        const addPoint = (x: number, y: number) => {
            points.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 + 1, // Slight gravity/fall
                life: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2
            });
        };

        let lastAdd = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            isActive.current = true;

            // Throttle adding points to every 20ms to reduce CPU load
            const now = Date.now();
            if (now - lastAdd > 20) {
                // Add multiple points for denser trail but less frequently
                for (let i = 0; i < 2; i++) {
                    addPoint(e.clientX, e.clientY);
                }
                lastAdd = now;
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        const animate = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw points
            for (let i = 0; i < points.current.length; i++) {
                const p = points.current[i];

                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02; // Fade out speed
                p.size *= 0.95; // Shrink speed

                if (p.life <= 0 || p.size < 0.5) {
                    points.current.splice(i, 1);
                    i--;
                    continue;
                }

                ctx.globalAlpha = p.life;
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;

                // Draw Heart
                const s = p.size * 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.bezierCurveTo(p.x - s / 2, p.y - s / 2, p.x - s, p.y + s / 3, p.x, p.y + s);
                ctx.bezierCurveTo(p.x + s, p.y + s / 3, p.x + s / 2, p.y - s / 2, p.x, p.y);
                ctx.fill();
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
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
