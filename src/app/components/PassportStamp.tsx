import { motion } from 'motion/react';
import { useMemo } from 'react';

interface PassportStampProps {
    locationName: string;
    date: string;
    index: number;
    className?: string; // Allow custom positioning
}

export function PassportStamp({ locationName, date, index, className }: PassportStampProps) {
    // Randomize rotation and position slightly for "imperfect" stamp feel
    const rotation = useMemo(() => Math.random() * 20 - 10, []); // -10 to 10 deg (less rotation for heavy feel)
    const offsetX = useMemo(() => Math.random() * 20 - 10, []);
    const offsetY = useMemo(() => Math.random() * 20 - 10, []);

    // Random color based on index with darker, realistic ink colors
    const colors = [
        'border-blue-600 text-blue-600',
        'border-red-600 text-red-600',
        'border-purple-600 text-purple-600',
        'border-emerald-600 text-emerald-600'
    ];
    const colorClass = colors[index % colors.length];

    return (
        <div className={`z-[100] pointer-events-none ${className ?? "fixed inset-0 flex items-center justify-center"}`}>
            <motion.div
                initial={{ scale: 5, opacity: 0, rotate: rotation }}
                animate={{ scale: 1, opacity: 1, rotate: rotation }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25, // Less bounce, more heavy "thud"
                    mass: 2
                }}
                className={`w-[400px] h-[400px] rounded-full border-8 border-double ${colorClass} flex flex-col items-center justify-center p-8 backdrop-blur-sm bg-white/20 mix-blend-multiply shadow-2xl origin-center`}
                style={{ x: offsetX, y: offsetY }}
            >
                {/* Grunge Texture Overlay for Realism */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay rounded-full" />

                <div className="text-sm font-mono uppercase tracking-[0.5em] font-bold opacity-80 mb-4 border-b-2 border-current pb-2 w-3/4 text-center">
                    VISA ARRIVAL
                </div>

                <div className="text-5xl font-black font-display text-center uppercase leading-none tracking-tighter transform -rotate-1 drop-shadow-sm line-clamp-2">
                    {locationName || 'UNKNOWN'}
                </div>

                <div className="text-xl font-mono mt-6 border-t-2 border-dashed border-current pt-2 w-full text-center opacity-90 font-bold">
                    {date}
                </div>

                {/* Impact Rings (Dust) */}
                <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="absolute inset-0 border-4 border-current rounded-full"
                />
            </motion.div>
        </div>
    );
}
