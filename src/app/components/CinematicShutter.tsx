import { motion, AnimatePresence } from 'motion/react';

interface CinematicShutterProps {
    active: boolean;
}

export function CinematicShutter({ active }: CinematicShutterProps) {
    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[99999] pointer-events-none flex flex-col">
                    {/* Top Shutter */}
                    <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: "50%" }}
                        exit={{ height: "0%" }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full bg-black"
                    />
                    {/* Bottom Shutter */}
                    <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: "50%" }}
                        exit={{ height: "0%" }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full bg-black"
                    />

                    {/* Optional: Flash */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1, delay: 0.3 }}
                        className="absolute inset-0 bg-white mix-blend-overlay"
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
