import { Memory } from '@/app/types/memory';
import { Heart, Sparkles, MapPin, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';

interface StatsPanelProps {
    memories: Memory[];
}

const StatCard = ({ icon: Icon, label, value, subValue, color, onClick, size = "small" }: any) => {
    // Soft Romantic Style - Pastel & Cute
    const colorClasses =
        color === 'pink' ? 'bg-gradient-to-br from-[#ffd1ff] to-[#fad0c4] text-[#d63384]' :
            color === 'purple' ? 'bg-gradient-to-br from-[#e0c3fc] to-[#8ec5fc] text-[#6a4c93]' :
                'bg-gradient-to-br from-[#fff1eb] to-[#ace0f9] text-[#e67e22]'; // blue-orange

    const isLarge = size === 'large';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.03, y: -5 }} // Bouncy hover
            whileTap={{ scale: 0.95 }} // Satisfying click press
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`rounded-3xl p-5 relative flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-xl transition-shadow ${size === "large" ? "col-span-1 md:col-span-2 row-span-1 aspect-square md:aspect-auto" :
                "col-span-1 aspect-square"
                } ${colorClasses}`}
            onClick={onClick}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/40 backdrop-blur-sm rounded-full">
                    <Icon className={`w-5 h-5`} fill="currentColor" strokeWidth={0} />
                </div>
                {isLarge && <span className="text-[10px] font-bold bg-white/40 px-2 py-1 rounded-full text-black/50">亮点</span>}
            </div>

            <div className="mt-auto">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={`font-cute font-bold tracking-tight leading-none ${isLarge ? 'text-5xl' : 'text-3xl'
                        }`}>
                        {value}
                    </span>
                    {subValue && (
                        <span className="text-xs font-bold opacity-60 bg-white/30 px-1.5 py-0.5 rounded-md">
                            {subValue}
                        </span>
                    )}
                </div>
                <span className="text-xs font-bold opacity-70 mt-1 block uppercase tracking-wider">{label}</span>
            </div>

            {/* Cute Decorative Elements */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Icon className="w-16 h-16" />
            </div>
        </motion.div>
    );
};

export function StatsPanel({ memories }: StatsPanelProps) {
    const stats = useMemo(() => {
        const memoryCount = memories.filter(m => m.type === 'memory').length;
        const expectationCount = memories.filter(m => m.type === 'expectation').length;
        const totalCount = memories.length;

        const categoryStats = memories.reduce((acc, m) => {
            acc[m.category] = (acc[m.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];

        return {
            memoryCount,
            expectationCount,
            totalCount,
            topCategory: topCategory?.[0] || null,
            topCategoryCount: topCategory?.[1] || 0,
            provinceCount: new Set(memories.map(m => m.locationName).filter(Boolean)).size
        };
    }, [memories]);

    const categoryLabels: Record<string, string> = {
        place: '地点',
        food: '美食',
        first: '第一次',
        travel: '旅行',
        date: '约会',
        special: '时刻',
        other: '其他',
    };

    const statCards = [
        {
            icon: Heart,
            label: '美好回忆',
            value: stats.memoryCount,
            color: 'pink',
            size: 'large'
        },
        {
            icon: Sparkles,
            label: '未来期待',
            value: stats.expectationCount,
            color: 'purple',
            size: 'medium'
        },
        {
            icon: MapPin,
            label: '足迹点滴',
            value: stats.provinceCount,
            color: 'blue',
            size: 'small'
        },
        {
            icon: Award,
            label: '最爱主题',
            value: stats.topCategory ? categoryLabels[stats.topCategory] || stats.topCategory : '-',
            subValue: stats.topCategory ? `${stats.topCategoryCount}次` : '',
            color: 'pink', // Reusing pink for harmony
            size: 'small'
        }
    ];

    return (
        <div className="grid grid-cols-2 gap-4">
            {statCards.map((card, index) => (
                <StatCard
                    key={index}
                    {...card}
                    delay={index * 0.1}
                />
            ))}
        </div>
    );
}
