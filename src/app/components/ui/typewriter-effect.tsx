"use client";

import { cn } from "@/app/components/ui/utils";
import { motion, stagger, useAnimate, useInView } from "motion/react";
import { useEffect } from "react";

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}: {
    words: {
        text: string;
        className?: string;
    }[];
    className?: string;
    cursorClassName?: string;
}) => {
    // Mobile: Simple fade-in of the full text (no per-character animation)
    if (isMobile) {
        const fullText = words.map(w => w.text).join("");
        return (
            <div className={cn("text-base sm:text-lg md:text-xl font-bold text-center", className)}>
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="dark:text-white text-black"
                >
                    {fullText}
                </motion.span>
            </div>
        );
    }

    // Desktop: Original per-character typewriter animation
    return <TypewriterEffectDesktop words={words} className={className} cursorClassName={cursorClassName} />;
};

// Desktop-only component with full animation
const TypewriterEffectDesktop = ({
    words,
    className,
    cursorClassName,
}: {
    words: { text: string; className?: string }[];
    className?: string;
    cursorClassName?: string;
}) => {
    const wordsArray = words.map((word) => ({
        ...word,
        text: word.text.split(""),
    }));

    const [scope, animate] = useAnimate();
    const isInView = useInView(scope);

    useEffect(() => {
        if (isInView) {
            animate(
                "span",
                { opacity: 1, display: "inline-block" },
                { duration: 0.1, delay: stagger(0.05), ease: "easeInOut" }
            );
        }
    }, [isInView]);

    const renderWords = () => (
        <motion.div ref={scope} className="inline">
            {wordsArray.map((word, idx) => (
                <div key={`word-${idx}`} className="inline-block">
                    {word.text.map((char, index) => (
                        <motion.span
                            initial={{ opacity: 0, display: "none" }}
                            key={`char-${index}`}
                            className={cn("dark:text-white text-black opacity-0", word.className)}
                        >
                            {char}
                        </motion.span>
                    ))}
                    &nbsp;
                </div>
            ))}
        </motion.div>
    );

    return (
        <div className={cn("text-base sm:text-lg md:text-xl font-bold text-center", className)}>
            {renderWords()}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                className={cn("inline-block rounded-sm w-[4px] h-4 md:h-6 lg:h-8 bg-blue-500", cursorClassName)}
            />
        </div>
    );
};
