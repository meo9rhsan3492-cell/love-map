import { useRef, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Memory } from '@/app/types/memory';
import { Heart, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { useSound } from '@/app/hooks/useSound';

interface PolaroidWallProps {
    memories: Memory[];
    onMemoryClick: (memory: Memory) => void;
}

export function PolaroidWall({ memories, onMemoryClick }: PolaroidWallProps) {
    const containerRef = useRef(null);
    const { playPop } = useSound();

    // Z-Index Management
    const [highestZ, setHighestZ] = useState(10);
    const [zIndices, setZIndices] = useState<Record<string, number>>({});

    // Gallery Focus Mode
    const [focusedId, setFocusedId] = useState<string | null>(null);

    const handleBringToFront = (id: string) => {
        if (focusedId) return; // Disable z-index manipulation when focused
        const newZ = highestZ + 1;
        setHighestZ(newZ);
        setZIndices(prev => ({ ...prev, [id]: newZ }));
        playPop();
    };

    const handleFocus = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setFocusedId(id);
    };

    const handleCloseFocus = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setFocusedId(null);
    };

    // Filter only valid image memories
    const validMemories = useMemo(() => memories.filter(m => m.imageUrl), [memories]);

    // Generate random but stable positions
    const scatterStyles = useMemo(() => {
        return validMemories.map(() => ({
            x: Math.random() * 60 - 30, // -30% to +30%
            y: Math.random() * 60 - 30,
            rotate: Math.random() * 30 - 15,
            scale: 0.9 + Math.random() * 0.2,
        }));
    }, [validMemories.length]);

    if (validMemories.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-gray-400 font-serif italic">
                <p>Upload photos to fill your wall...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#f0f0f0] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Backdrop for Focused Mode */}
            <AnimatePresence>
                {focusedId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseFocus}
                        className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-zoom-out"
                    />
                )}
            </AnimatePresence>

            <div className="absolute inset-0 pointer-events-none opacity-50 bg-gradient-to-tr from-stone-100 to-white mix-blend-multiply" />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {validMemories.map((memory, index) => {
                    const isFocused = focusedId === memory.id;
                    const currentZ = isFocused ? 50 : (zIndices[memory.id] || 1);

                    return (
                        <motion.div
                            key={memory.id}
                            layoutId={`polaroid-${memory.id}`}
                            drag={!isFocused} // Disable drag when focused
                            dragConstraints={containerRef}
                            dragElastic={0.1}
                            dragMomentum={false}
                            onDragStart={() => handleBringToFront(memory.id)}
                            onTapStart={() => !isFocused && handleBringToFront(memory.id)}
                            initial={{ opacity: 0, scale: 0.5, y: 100 }}

                            // Switch between Scattered and Focused state
                            animate={isFocused ? {
                                x: 0,
                                y: 0,
                                rotate: 0,
                                scale: 1.5, // Zoom in
                                zIndex: 50,
                                opacity: 1
                            } : {
                                opacity: 1,
                                x: `${scatterStyles[index]?.x}vw`,
                                y: `${scatterStyles[index]?.y}vh`,
                                rotate: scatterStyles[index]?.rotate,
                                scale: scatterStyles[index]?.scale,
                                zIndex: currentZ
                            }}

                            transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                            className={`absolute bg-white p-3 shadow-md transition-shadow duration-300 pointer-events-auto
                            ${isFocused ? 'w-80 shadow-2xl cursor-default' : 'w-48 sm:w-56 hover:shadow-2xl cursor-grab group'}
                        `}
                            style={{ transformOrigin: 'center center' }}
                        >
                            {/* Tape Effect (Hidden when focused for clean look) */}
                            {!isFocused && (
                                <motion.div
                                    initial={{ opacity: 0.7 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-white/30 backdrop-blur-sm border border-white/40 shadow-sm rotate-1 z-10"
                                />
                            )}

                            <div className="aspect-[4/5] bg-gray-100 mb-3 overflow-hidden filter contrast-[1.05] relative">
                                {memory.imageUrl ? (
                                    <img
                                        src={memory.imageUrl}
                                        alt={memory.title}
                                        className="w-full h-full object-cover pointer-events-none"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-pink-50">
                                        <Heart className="w-12 h-12 text-pink-200" />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className={`absolute inset-0 transition-all flex items-center justify-center gap-2
                                ${isFocused ? 'opacity-100 bg-black/0' : 'opacity-0 group-hover:opacity-100 bg-black/10'}
                             `}>
                                    {!isFocused ? (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full bg-white/90 shadow-lg scale-90 hover:scale-100 transition-transform"
                                            onClick={(e) => handleFocus(memory.id, e)}
                                        >
                                            <Maximize2 className="w-4 h-4 text-gray-700" />
                                        </Button>
                                    ) : (
                                        <>
                                            {/* In focused mode, show Detail or Close */}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-full bg-white/90 shadow-lg px-4 font-bold text-xs"
                                                onClick={(e) => { e.stopPropagation(); onMemoryClick(memory); }}
                                            >
                                                Check Detail
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full bg-white/50 hover:bg-white text-white hover:text-black absolute top-2 right-2"
                                                onClick={handleCloseFocus}
                                            >
                                                <Minimize2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className={`font-cute text-gray-800 leading-none mb-1 ${isFocused ? 'text-2xl mt-2' : 'text-xl line-clamp-1'}`}>{memory.title}</h3>
                                <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">{memory.date}</p>
                                {isFocused && (
                                    <motion.p
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                                        className="text-xs text-gray-500 mt-2 font-serif italic"
                                    >
                                        {memory.description}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
