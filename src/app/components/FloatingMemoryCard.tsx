import { CardBody, CardContainer, CardItem } from "@/app/components/ui/3d-card";
import { Memory } from "@/app/types/memory";
import { format } from "date-fns";
import { MapPin, Heart } from "lucide-react";
import { TypewriterEffect } from "@/app/components/ui/typewriter-effect";
import { motion } from "motion/react";

interface FloatingMemoryCardProps {
    memory: Memory;
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Mobile: Simple 2D card with fade-in (no 3D transforms, no backdrop-blur)
function MobileMemoryCard({ memory }: FloatingMemoryCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white/95 w-[90vw] max-w-md rounded-xl p-5 border border-rose-100 shadow-lg"
        >
            {/* Title */}
            <h3 className="text-xl font-bold text-neutral-700 font-display">
                {memory.title}
            </h3>
            <p className="text-neutral-500 text-sm mt-1 flex items-center gap-1">
                <MapPin size={14} className="text-rose-500" />
                {memory.locationName || "Somewhere on Earth"}
            </p>

            {/* Image */}
            <div className="w-full h-52 overflow-hidden rounded-xl shadow-md mt-4">
                <img
                    src={memory.imageUrl || memory.media?.[0]?.url || "/placeholder.jpg"}
                    className="h-full w-full object-cover"
                    alt="thumbnail"
                    loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-full text-xs font-bold text-rose-500 shadow-sm flex items-center gap-1 border border-white/50">
                    <Heart size={10} className="fill-current" />
                    {format(new Date(memory.date), 'yyyy.MM.dd')}
                </div>
            </div>

            {/* Description - plain text, no TypewriterEffect */}
            {memory.description && (
                <p className="mt-4 text-sm text-gray-600 leading-relaxed border-l-4 border-rose-300 pl-3 bg-rose-50/50 p-2 rounded-r-lg font-serif">
                    {memory.description.slice(0, 120)}{memory.description.length > 120 ? '...' : ''}
                </p>
            )}

            {/* Footer */}
            <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                <span>{memory.latitude.toFixed(3)}°N, {memory.longitude.toFixed(3)}°E</span>
                <span className="px-3 py-1 rounded-full bg-black text-white font-bold">
                    Tap to Explore
                </span>
            </div>
        </motion.div>
    );
}

// Desktop: Full 3D card with all effects
function DesktopMemoryCard({ memory }: FloatingMemoryCardProps) {
    return (
        <CardContainer className="inter-var">
            <CardBody className="bg-white/80 backdrop-blur-xl relative group/card dark:hover:shadow-2xl dark:hover:shadow-rose-500/[0.1] dark:bg-black dark:border-white/[0.2] border-white/20 w-auto sm:w-[32rem] h-auto rounded-xl p-6 border shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                {/* Glare/Sheen Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-50 pointer-events-none rounded-xl" />

                <CardItem
                    translateZ="50"
                    className="text-2xl font-bold text-neutral-700 dark:text-white font-display"
                >
                    {memory.title}
                </CardItem>
                <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300 flex items-center gap-1"
                >
                    <MapPin size={14} className="text-rose-500" />
                    {memory.locationName || "Somewhere on Earth"}
                </CardItem>

                <CardItem translateZ="100" className="w-full mt-6">
                    <div className="w-full h-72 overflow-hidden rounded-xl shadow-lg relative aspect-video">
                        <img
                            src={memory.imageUrl || memory.media?.[0]?.url || "/placeholder.jpg"}
                            className="h-full w-full object-cover object-center group-hover/card:scale-110 transition-transform duration-700 ease-in-out"
                            alt="thumbnail"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-rose-500 shadow-sm flex items-center gap-1.5 border border-white/50">
                            <Heart size={12} className="fill-current" />
                            {format(new Date(memory.date), 'yyyy.MM.dd')}
                        </div>
                    </div>
                </CardItem>

                <div className="flex justify-between items-center mt-8">
                    <CardItem
                        translateZ={40}
                        as="div"
                        className="px-4 py-2 rounded-xl text-xs font-normal dark:text-white bg-white/50 backdrop-blur-sm border border-white/20"
                    >
                        <div className="flex items-center gap-2 text-gray-600">
                            {memory.latitude.toFixed(3)}°N, {memory.longitude.toFixed(3)}°E
                        </div>
                    </CardItem>
                    <CardItem
                        translateZ={40}
                        as="div"
                        className="px-4 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold shadow-md"
                    >
                        Hover to Explore
                    </CardItem>
                </div>

                {/* Story Snippet */}
                {memory.description && (
                    <CardItem translateZ="80" className="mt-6 w-full text-sm text-gray-600 leading-relaxed border-l-4 border-rose-300 pl-4 bg-rose-50/50 p-2 rounded-r-lg">
                        <TypewriterEffect
                            words={(() => {
                                const text = memory.description.slice(0, 120) + (memory.description.length > 120 ? '...' : '');
                                const hasCJK = /[\u4e00-\u9fa5]/.test(text);
                                if (hasCJK) {
                                    return text.split("").map(char => ({ text: char }));
                                } else {
                                    return text.split(" ").map(word => ({ text: word }));
                                }
                            })()}
                            className="text-sm font-normal text-left font-serif"
                            cursorClassName="bg-rose-500 h-4"
                        />
                    </CardItem>
                )}

            </CardBody>
        </CardContainer>
    );
}

export function FloatingMemoryCard({ memory }: FloatingMemoryCardProps) {
    if (isMobile) {
        return <MobileMemoryCard memory={memory} />;
    }
    return <DesktopMemoryCard memory={memory} />;
}
