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
            ctx.scale(dpr, dpr);
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });

        const colors = ['#f472b6', '#fbbf24', '#c084fc', '#fbcfe8'];

        let lastAdd = 0;
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            // Throttle to every 30ms (was 20ms with 2 particles)
            const now = performance.now();
            if (now - lastAdd > 30) {
                if (points.current.length < 40) { // Cap max particles
                    points.current.push({
                        x: e.clientX,
                        y: e.clientY,
                        vx: (Math.random() - 0.5) * 1.5,
                        vy: (Math.random() - 0.5) * 1.5 + 0.8,
                        life: 1.0,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: Math.random() * 3 + 2
                    });
                }
                lastAdd = now;
            }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

            const pts = points.current;
            let writeIdx = 0;

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.025;
                p.size *= 0.96;

                if (p.life <= 0 || p.size < 0.3) continue;

                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                // Simple circle instead of complex bezier heart (faster)
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, 6.28);
                ctx.fill();

                pts[writeIdx++] = p;
            }
            pts.length = writeIdx; // Efficient splice-free cleanup

            rafId.current = requestAnimationFrame(animate);
        };

        rafId.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
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
