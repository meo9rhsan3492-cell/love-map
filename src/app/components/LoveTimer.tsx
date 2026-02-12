
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface LoveTimerProps {
    startDate: string;
    className?: string; // Optional className for custom styling
}

export function LoveTimer({ startDate, className }: LoveTimerProps) {
    const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        // Safe parsing of date string
        const start = new Date(startDate);

        // Validation: if invalid date, fallback to something or just don't crash
        if (isNaN(start.getTime())) return;

        const updateTime = () => {
            const now = new Date();
            const diff = now.getTime() - start.getTime();

            // Handle future dates (not started yet)
            if (diff < 0) {
                setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            setTime({ days, hours, minutes, seconds });
        };

        updateTime(); // Initial call
        const interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [startDate]);

    return (
        <div className={`flex items-center gap-2 mb-4 bg-pink-50 w-fit px-4 py-1.5 rounded-full border border-pink-100 shadow-sm animate-fade-in cursor-help ${className || ''}`} title={`Started on ${startDate}`}>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-pulse" />
            <span className="text-xs font-bold text-pink-600 tracking-wide font-mono tabular-nums">
                {time.days} 天 {String(time.hours).padStart(2, '0')}:{String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}
            </span>
        </div>
    );
}
