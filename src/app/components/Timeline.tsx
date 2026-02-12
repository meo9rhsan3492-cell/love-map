
import { Memory } from '@/app/types/memory';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Heart, Sparkles, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useSound } from '@/app/hooks/useSound';

interface TimelineProps {
    memories: Memory[];
    onMemoryClick: (memory: Memory) => void;
}

export function Timeline({ memories, onMemoryClick }: TimelineProps) {
    const { playPop } = useSound();

    //按日期排序，最新的在前
    const sortedMemories = useMemo(() => {
        return [...memories].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [memories]);

    // 按月份分组
    const groupedByMonth = useMemo(() => {
        const groups: Record<string, Memory[]> = {};
        sortedMemories.forEach(memory => {
            const date = new Date(memory.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!groups[monthKey]) {
                groups[monthKey] = [];
            }
            groups[monthKey].push(memory);
        });
        return groups;
    }, [sortedMemories]);

    const getCategoryLabel = (category: string) => {
        const labels: Record<string, string> = {
            place: '地点',
            food: '美食',
            first: '第一次',
            travel: '旅行',
            date: '约会',
            special: '特殊时刻',
            other: '其他',
        };
        return labels[category] || category;
    };

    const formatMonthYear = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return `${year}年 ${monthNames[parseInt(month) - 1]}`;
    };

    if (memories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 px-4 text-center">
                <div className="relative mb-6 group cursor-pointer" onClick={() => (window as any).playPop?.()}>
                    <div className="absolute inset-0 bg-pink-200 rounded-full blur-xl opacity-20 animate-pulse" />
                    <Heart className="w-20 h-20 text-pink-300 relative z-10 group-hover:scale-110 transition-transform duration-300 group-hover:text-pink-400" />
                    <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
                </div>
                <h3 className="text-xl font-cute font-bold text-gray-700 mb-2">我们的故事开始了...</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    时间轴正等待着你们的第一个美好回忆。
                    <br />去地图上添加一颗 <span className="text-pink-400 font-bold">爱心</span> 吧！
                </p>
            </div>
        );
    }

    // Flatten all memories to calculate global index for Zigzag layout
    let globalIndex = 0;

    return (
        <div className="space-y-12 pb-12 w-full max-w-5xl mx-auto px-4 sm:px-6 relative">
            {/* Central Journey Line (Desktop) */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 hidden md:block z-0">
                <div className="h-full w-full border-l-2 border-dashed border-pink-300 animate-[dash-flow_30s_linear_infinite]"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}></div>
            </div>

            {/* Left Journey Line (Mobile) */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 md:hidden z-0">
                <div className="h-full w-full border-l-2 border-dashed border-pink-300"
                    style={{ maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)' }}></div>
            </div>

            {Object.entries(groupedByMonth).map(([monthKey, monthMemories]) => (
                <div key={monthKey} className="relative z-10">
                    {/* Month Label (Sticky / Center) */}
                    <div className="flex justify-center mb-8 sticky top-4 z-20">
                        <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full border border-pink-100 shadow-sm flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-pink-400" />
                            <h3 className="text-lg font-bold font-cute text-gray-700">
                                {formatMonthYear(monthKey)}
                            </h3>
                            <span className="bg-pink-100 text-pink-500 text-xs font-bold px-2 py-0.5 rounded-full">
                                {monthMemories.length}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-y-16">
                        {monthMemories.map((memory) => {
                            const isEven = globalIndex % 2 === 0;
                            globalIndex++;

                            return (
                                <motion.div
                                    key={memory.id}
                                    initial={{ opacity: 0, y: 50, rotate: isEven ? -5 : 5 }}
                                    whileInView={{ opacity: 1, y: 0, rotate: isEven ? -2 : 2 }} // Final resting rotation
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                                    className={`
                                        relative
                                        ${isEven ? 'md:col-start-1 md:text-right' : 'md:col-start-2 md:text-left'}
                                        ${isEven ? 'md:pr-12' : 'md:pl-12'}
                                        pl-12 md:pl-0 /* Mobile padding */
                                    `}
                                >
                                    {/* Timeline Node (Dot) - Replaced with "Pin" or "Tape" look could be cool, but keeping Dot for consistency with line */}
                                    <div className={`
                                        absolute w-4 h-4 rounded-full border-4 border-white shadow-md z-10 top-12
                                        transition-colors duration-300
                                        ${memory.type === 'memory' ? 'bg-pink-400 ring-4 ring-pink-100' : 'bg-purple-400 ring-4 ring-purple-100'}
                                        left-[1.35rem] md:left-auto
                                        ${isEven ? 'md:-right-[0.55rem]' : 'md:-left-[0.55rem]'}
                                    `} />

                                    {/* POLAROID CARD */}
                                    <div
                                        className={`group relative inline-block transition-transform duration-300 hover:z-50 hover:scale-105 hover:rotate-0`}
                                        onClick={() => { playPop(); onMemoryClick(memory); }}
                                    >
                                        {/* Paper Clip / Tape (Optional detail) */}
                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-20 bg-white/20 -rotate-45 z-20 hidden`} />

                                        <div className="bg-white p-3 pb-12 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] rounded-sm border border-gray-100 transform transition-all duration-300">

                                            {/* Image Area */}
                                            {memory.imageUrl ? (
                                                <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 relative mb-4">
                                                    <img
                                                        src={memory.imageUrl}
                                                        alt={memory.title}
                                                        className="w-full h-full object-cover filter contrast-[1.05] brightness-[1.05]"
                                                    />
                                                    {/* Glossy Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-50 pointer-events-none" />
                                                </div>
                                            ) : (
                                                /* Text-only Memory - styled as a note */
                                                <div className="aspect-[4/3] w-full bg-pink-50/50 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden mb-4">
                                                    <Heart className="w-12 h-12 text-pink-200 mb-2 opacity-50" />
                                                    <p className="text-gray-600 font-cute text-xl leading-relaxed line-clamp-4">
                                                        "{memory.description}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* Handwritten Caption */}
                                            <div className="absolute bottom-3 left-0 right-0 px-4 text-center">
                                                <h4 className={`font-cute text-2xl text-gray-800 leading-none mb-1 ${!memory.imageUrl && 'hidden'}`}>
                                                    {memory.title}
                                                </h4>
                                                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-mono tracking-widest uppercase opacity-70">
                                                    <span>{memory.date}</span>
                                                    <span>•</span>
                                                    <span>{getCategoryLabel(memory.category)}</span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
