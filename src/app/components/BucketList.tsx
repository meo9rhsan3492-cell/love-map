import { Memory } from '@/app/types/memory';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Circle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useSound } from '@/app/hooks/useSound';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

interface BucketListProps {
    memories: Memory[];
    onComplete: (memory: Memory) => void;
}

export function BucketList({ memories, onComplete }: BucketListProps) {
    const wishes = memories.filter(m => m.type === 'expectation');
    const { playSuccess, playPop } = useSound();
    const [completingWish, setCompletingWish] = useState<Memory | null>(null);

    // State for the completion dialog
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
    const [completionNote, setCompletionNote] = useState('');

    const handleStartCompletion = (wish: Memory) => {
        playPop();
        setCompletingWish(wish);
        setCompletionNote(wish.description || ''); // Pre-fill with existing description
    };

    const confirmCompletion = () => {
        if (!completingWish) return;

        playSuccess(); // Celebration sound!

        const completedMemory: Memory = {
            ...completingWish,
            type: 'memory', // Convert to memory
            date: completionDate, // Set to selected date (usually today)
            description: completionNote, // Update description if changed
        };

        onComplete(completedMemory);
        setCompletingWish(null);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 pb-24">
            <div className="mb-10 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4"
                >
                    <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
                </motion.div>
                <h1 className="font-sans font-black italic text-4xl text-gray-800 mb-2">
                    我们的 <span className="text-purple-500">心愿单</span>
                </h1>
                <p className="font-cute text-xl text-gray-500">
                    一起去追逐的梦想...
                </p>
            </div>

            {wishes.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-purple-200"
                >
                    <p className="text-gray-400 font-cute text-xl mb-4">还没有许下心愿？</p>
                    <p className="text-sm text-gray-400">添加一条记录并选择“期待”类型！</p>
                </motion.div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {wishes.map((wish, index) => (
                            <motion.div
                                key={wish.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.1 }}
                                className="group relative bg-white pl-4 pr-6 py-5 rounded-2xl shadow-sm hover:shadow-md border border-purple-50 transition-all flex items-start gap-4"
                            >
                                {/* Checkbox Area */}
                                <button
                                    onClick={() => handleStartCompletion(wish)}
                                    className="mt-1 flex-shrink-0 text-purple-200 hover:text-purple-500 transition-colors"
                                >
                                    <Circle className="w-6 h-6" />
                                </button>

                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
                                        {wish.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-2">
                                        <span>目标日: {wish.date}</span>
                                        <span>•</span>
                                        <span>{wish.category}</span>
                                    </div>
                                    {wish.description && (
                                        <p className="text-gray-500 font-serif italic text-sm border-l-2 border-purple-100 pl-3">
                                            "{wish.description}"
                                        </p>
                                    )}
                                </div>

                                {/* Hover Prompt */}
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider bg-purple-50 px-3 py-1.5 rounded-full cursor-pointer"
                                    onClick={() => handleStartCompletion(wish)}>
                                    <span>实现</span>
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Completion Dialog */}
            <Dialog open={!!completingWish} onOpenChange={(open) => !open && setCompletingWish(null)}>
                <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-purple-100 custom-shadow rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-cute flex items-center gap-2 text-purple-600">
                            <Sparkles className="w-6 h-6 fill-purple-200" />
                            梦想成真！
                        </DialogTitle>
                    </DialogHeader>

                    {completingWish && (
                        <div className="space-y-4 py-4">
                            <p className="text-gray-600">
                                将 <strong>"{completingWish.title}"</strong> 转化为珍贵回忆。
                            </p>

                            <div className="space-y-2">
                                <Label>这是哪天实现的？</Label>
                                <Input
                                    type="date"
                                    value={completionDate}
                                    onChange={(e) => setCompletionDate(e.target.value)}
                                    className="rounded-xl border-purple-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>想说点什么？</Label>
                                <Input
                                    value={completionNote}
                                    onChange={(e) => setCompletionNote(e.target.value)}
                                    placeholder="这一刻比想象中更美好..."
                                    className="rounded-xl border-purple-100"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setCompletingWish(null)} className="rounded-full">
                            取消
                        </Button>
                        <Button onClick={confirmCompletion} className="bg-purple-500 hover:bg-purple-600 text-white rounded-full px-6">
                            确认打卡 💖
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Helper utility if not present, otherwise generic
// function cn(...classes: (string | undefined | null | false)[]) {
//   return classes.filter(Boolean).join(' ');
// }
