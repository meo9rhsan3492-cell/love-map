
import { motion } from 'motion/react';

interface RevealTextProps {
    text: string;
    className?: string;
    speed?: number; // Delay per character in seconds
}

export function RevealText({ text, className = "", speed = 0.03 }: RevealTextProps) {
    // Split text into characters, preserving spaces
    const characters = Array.from(text);

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: speed, delayChildren: 0.04 * i },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 5,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.p
            className={className}
            variants={container}
            initial="hidden"
            whileInView="visible" // Only animate when in view
            viewport={{ once: true }}
        >
            {characters.map((char, index) => (
                <motion.span variants={child} key={index} className="inline-block" style={{ whiteSpace: 'pre-wrap' }}>
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
        </motion.p>
    );
}
