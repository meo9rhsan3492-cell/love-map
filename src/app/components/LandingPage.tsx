
import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { useSound } from '@/app/hooks/useSound';
import { SparklesCore } from '@/app/components/ui/sparkles';

interface LandingPageProps {
    onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
    const { playPop } = useSound();

    // "Parting" Transition
    const partingEase = "easeInOut";
    const partingDuration = 1.5;

    // Staggered Exit Timing
    // 1. Click Start
    // 2. Background & Clouds Exit IMMEDIATELY (via their own exit prop)
    // 3. Text Stays for 1s (delay 1s in its exit prop)
    // 4. Text Fades out (duration 0.5s)
    // 5. Component Unmounts (Root exit duration must cover the total time)

    const textExitDelay = 1.0;
    const textExitDuration = 0.5;
    const totalDuration = textExitDelay + textExitDuration;

    // Daily Love Quotes
    const LOVE_QUOTES = [
        { en: "In every lifetime, I will choose you.", cn: "每一世，我都会选择你。" },
        { en: "You are my today and all of my tomorrows.", cn: "你是我的今天，以及所有的明天。" },
        { en: "I love you more than I have ever found a way to say to you.", cn: "我对你的爱，无法言表。" },
        { en: "My favorite place is inside your hug.", cn: "我最喜欢的地方，是你的怀抱。" },
        { en: "Whatever our souls are made of, his and mine are the same.", cn: "无论灵魂由什么用成，你的和我的，是同一种。" },
        { en: "You are the finest, loveliest, tenderest, and most beautiful person I have ever known.", cn: "你是我见过最美好、最可爱、最温柔、最美丽的人。" },
        { en: "If I know what love is, it is because of you.", cn: "如果我知道什么是爱，那是因为你。" },
        { en: "I look at you and see the rest of my life in front of my eyes.", cn: "看着你，其实就是看着我的余生。" },
    ];

    // Select random quote once on mount
    const randomQuote = useMemo(() => LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)], []);

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1, delay: totalDuration }} // Root waits for children to finish
        >
            {/* Background: Fades out INSTANTLY when exiting */}
            <motion.div
                className="absolute inset-0 mesh-gradient-bg pointer-events-auto"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
            />

            {/* --- Cloud Curtain Layers --- */}
            {/* Slide out INSTANTLY when exiting */}

            {/* Top Left Quadrant */}
            <motion.div
                className="absolute top-0 left-0 w-[80vw] h-[80vh] pointer-events-none mix-blend-overlay"
                style={{
                    background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 80%)',
                    transformOrigin: 'top left',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ x: '-100%', y: '-100%', opacity: 0 }}
                transition={{ duration: partingDuration, ease: partingEase }}
            />

            {/* Top Right Quadrant */}
            <motion.div
                className="absolute top-0 right-0 w-[80vw] h-[80vh] pointer-events-none mix-blend-overlay"
                style={{
                    background: 'radial-gradient(ellipse at top right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 80%)',
                    transformOrigin: 'top right',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ x: '100%', y: '-100%', opacity: 0 }}
                transition={{ duration: partingDuration, ease: partingEase }}
            />

            {/* Bottom Left Quadrant */}
            <motion.div
                className="absolute bottom-0 left-0 w-[80vw] h-[80vh] pointer-events-none mix-blend-overlay"
                style={{
                    background: 'radial-gradient(ellipse at bottom left, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 80%)',
                    transformOrigin: 'bottom left',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ x: '-100%', y: '100%', opacity: 0 }}
                transition={{ duration: partingDuration, ease: partingEase }}
            />

            {/* Bottom Right Quadrant */}
            <motion.div
                className="absolute bottom-0 right-0 w-[80vw] h-[80vh] pointer-events-none mix-blend-overlay"
                style={{
                    background: 'radial-gradient(ellipse at bottom right, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0) 80%)',
                    transformOrigin: 'bottom right',
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ x: '100%', y: '100%', opacity: 0 }}
                transition={{ duration: partingDuration, ease: partingEase }}
            />


            {/* Center Content UI */}
            {/* Text STAYS for 1s, then fades out - Simplified Exit (No Blur) */}
            <motion.div
                exit={{ opacity: 0, scale: 1.05 }} // Removed blur, reduced scale change
                transition={{ duration: textExitDuration, delay: textExitDelay }}
                className="relative z-50 flex flex-col items-center text-center px-4 max-w-4xl pointer-events-auto"
            >
                {/* Top Label */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="mb-8 flex items-center gap-2 text-white font-mono tracking-[0.4em] text-sm uppercase drop-shadow-md bg-white/10 px-4 py-1 rounded-full backdrop-blur-sm"
                >
                    <Star className="w-4 h-4 text-yellow-300 animate-spin-slow" />
                    <span>Since 2020</span>
                    <Star className="w-4 h-4 text-yellow-300 animate-spin-slow" />
                </motion.div>

                {/* Huge 3D Floating Title */}
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, duration: 1, type: "spring" }}
                    className="mb-8 relative"
                >
                    <div className="absolute -inset-32 z-0 pointer-events-none">
                        <SparklesCore
                            id="titleSparkles"
                            background="transparent"
                            minSize={0.4}
                            maxSize={1.2}
                            particleDensity={window.innerWidth < 768 ? 30 : 50}
                            className="w-full h-full"
                            particleColor="#FFFFFF"
                            speed={1}
                        />
                    </div>
                    <motion.h1
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 font-sans font-black italic text-7xl md:text-9xl leading-tight text-white tracking-tight"
                        style={{
                            textShadow: `
                        1px 1px 0px #eba4b9,
                        2px 2px 0px #ea9cb3,
                        3px 3px 0px #e994ad,
                        4px 4px 0px #e88ca7,
                        5px 5px 0px #e784a1,
                        6px 6px 0px #e67c9b,
                        7px 7px 0px #e57495,
                        8px 8px 0px #d65d82,
                        9px 9px 0px #c7466f,
                        10px 10px 0px #b82f5c,
                        11px 11px 0px #a91849,
                        12px 12px 20px rgba(0,0,0,0.2),
                        12px 12px 40px rgba(0,0,0,0.15)
                    `
                        }}
                    >
                        SQ <br />
                        <span className="text-pink-100" style={{ textShadow: 'inherit' }}>♥ ZXY</span>
                    </motion.h1>
                </motion.div>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5, duration: 1 }}
                    className="text-lg md:text-2xl text-white font-cute mb-8 max-w-lg leading-relaxed drop-shadow-md"
                >
                    记录我们走过的每一步，<br />
                    把美好的瞬间，永远留在心里。
                </motion.p>

                {/* DAILY LOVE QUOTE */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.8, duration: 1 }}
                    className="mb-12 max-w-lg bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
                >
                    <p className="font-serif italic text-white/90 text-lg mb-1 leading-snug">
                        "{randomQuote.en}"
                    </p>
                    <p className="font-serif text-white/70 text-sm">
                        {randomQuote.cn}
                    </p>
                </motion.div>

                {/* Enter Button */}
                {/* Button fades out immediately on click to clear view */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3, delay: 0 } }} // Button leaves FAST
                    transition={{ delay: 2, duration: 0.8, type: "spring", bounce: 0.5 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-white/40 rounded-full animate-ping opacity-75 duration-1000" />

                    <Button
                        onClick={() => { playPop(); onEnter(); }}
                        className="relative z-10 group px-12 py-9 rounded-full bg-white text-purple-600 hover:bg-purple-50 text-xl font-bold shadow-[0_0_50px_-10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,1)] transition-all duration-300 transform hover:scale-105 border-4 border-white/20"
                    >
                        <span className="flex items-center gap-3">
                            开启旅程 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Button>
                </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-8 text-white/60 text-xs font-mono tracking-widest z-30 pointer-events-none drop-shadow-sm"
            >
                CREATED WITH ♥ BY SQ
            </motion.div>
        </motion.div>
    );
}
