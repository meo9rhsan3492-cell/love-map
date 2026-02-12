
import { useState, useRef, useEffect } from 'react';
import { Disc, Play, Pause, Volume2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Using a high-quality, royalty-free piano track for "Soft Romantic" vibe
const BGM_URL = "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=relaxing-piano-music-248868.mp3";
// Alternative fallback or playlist could be added here

interface MusicPlayerProps {
    autoPlayTrigger?: boolean;
}

export function MusicPlayer({ autoPlayTrigger }: MusicPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.4;
            audioRef.current.loop = true;
        }
    }, []);

    // Watch for trigger
    useEffect(() => {
        if (autoPlayTrigger && audioRef.current && !isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                        setIsExpanded(true); // Expand nicely when auto-starting
                        // Auto collapse after 3s to be non-intrusive
                        setTimeout(() => setIsExpanded(false), 3000);
                    })
                    .catch(error => {
                        console.log("Autoplay prevented:", error);
                        // Expected if user hasn't interacted, but since they clicked "Enter" on landing, sticky interaction exists.
                    });
            }
        }
    }, [autoPlayTrigger]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio play failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
            <audio ref={audioRef} src={BGM_URL} />

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2 border border-pink-100 shadow-lg flex items-center gap-3 overflow-hidden"
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Our Love Song</span>
                            <span className="text-[10px] text-pink-400 whitespace-nowrap">Relaxing Piano</span>
                        </div>
                        <button onClick={togglePlay} className="p-1 hover:bg-pink-50 rounded-full transition-colors">
                            {isPlaying ? <Pause className="w-4 h-4 text-gray-600" /> : <Play className="w-4 h-4 text-gray-600" />}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-12 h-12 rounded-full shadow-xl border-2 border-white flex items-center justify-center relative overflow-hidden transition-colors ${isPlaying ? 'bg-pink-400' : 'bg-white'}`}
            >
                <div className={`absolute inset-0 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                {isPlaying ? (
                    <Disc className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                ) : (
                    <Music className="w-5 h-5 text-gray-400" />
                )}
            </motion.button>
        </div>
    );
}
