import { motion, AnimatePresence } from 'motion/react';

interface CinematicShutterProps {
    active: boolean;
}

export function CinematicShutter({ active }: CinematicShutterProps) {
    return (
        <AnimatePresence>
            {active && (
                <div className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
                    {/* Top blade - diagonal cut */}
                    <motion.div
                        initial={{ y: "-100%", skewY: -2 }}
                        animate={{ y: "0%", skewY: 0 }}
                        exit={{ y: "-100%", skewY: 2 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-0 left-0 right-0 h-[52%] bg-black origin-top"
                    >
                        {/* Shutter line glow */}
                        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                    </motion.div>

                    {/* Bottom blade - diagonal cut */}
                    <motion.div
                        initial={{ y: "100%", skewY: 2 }}
                        animate={{ y: "0%", skewY: 0 }}
                        exit={{ y: "100%", skewY: -2 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute bottom-0 left-0 right-0 h-[52%] bg-black origin-bottom"
                    >
                        {/* Shutter line glow */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                    </motion.div>

                    {/* Center flash on close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ duration: 0.25, delay: 0.3 }}
                        className="absolute inset-0 bg-white"
                    />

                    {/* Radial burst on flash */}
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 2], opacity: [0.5, 0] }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-200/20"
                    />
                </div>
            )}
        </AnimatePresence>
    );
}
