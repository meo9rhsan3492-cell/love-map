import { Memory } from '@/app/types/memory';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Heart, Sparkles, MapPin, Download, X, QrCode } from 'lucide-react';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';
import { useRef, useState } from 'react';
import { useSound } from '@/app/hooks/useSound';
import { toast } from 'sonner';

interface ShareCardProps {
    memory: Memory | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ShareCard({ memory, isOpen, onClose }: ShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [mode, setMode] = useState<'card' | 'polaroid' | 'receipt'>('card');
    const { playPop } = useSound(); // Add sound effect

    if (!memory) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;

        setIsGenerating(true);
        try {
            // 动态导入 html-to-image 以避免初始加载过大
            const { toPng } = await import('html-to-image');

            const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 }); // Improved quality

            const link = document.createElement('a');
            link.download = `memory-${memory.date}-${mode}.png`;
            link.href = dataUrl;
            link.click();

            toast.success('分享卡片已保存 ✨');
            onClose();
        } catch (err) {
            console.error(err);
            toast.error('生成卡片失败，请重试');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className="relative flex flex-col items-center">
                    {/* Close button outside */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-12 right-0 text-white hover:bg-white/20 rounded-full"
                        onClick={onClose}
                    >
                        <X className="w-6 h-6" />
                    </Button>

                    {/* Mode Toggle */}
                    <div className="absolute -top-12 left-0 bg-white/10 backdrop-blur-md rounded-full p-1 flex gap-1">
                        <button
                            onClick={() => { setMode('card'); playPop?.(); }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'card' ? 'bg-white text-pink-500 shadow-sm' : 'text-white hover:bg-white/10'}`}
                        >
                            Card
                        </button>
                        <button
                            onClick={() => { setMode('polaroid'); playPop?.(); }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'polaroid' ? 'bg-white text-pink-500 shadow-sm' : 'text-white hover:bg-white/10'}`}
                        >
                            Polaroid
                        </button>
                        <button
                            onClick={() => { setMode('receipt'); playPop?.(); }}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mode === 'receipt' ? 'bg-white text-pink-500 shadow-sm' : 'text-white hover:bg-white/10'}`}
                        >
                            Receipt
                        </button>
                    </div>

                    {/* The Card to Caption */}
                    <div
                        ref={cardRef}
                        className={`w-full bg-white overflow-hidden shadow-2xl transition-all duration-500
                            ${mode === 'card' ? 'rounded-2xl' : ''}
                            ${mode === 'polaroid' ? 'rounded-sm p-4 pb-16' : ''}
                            ${mode === 'receipt' ? 'w-[320px] rounded-none' : ''}
                        `}
                        style={{ minHeight: '500px' }}
                    >
                        {/* --- MODE SPECIFIC RENDERING --- */}

                        {/* 1. CARD MODE */}
                        {mode === 'card' && (
                            <>
                                <div className="relative bg-gray-100 overflow-hidden h-64">
                                    {memory.imageUrl ? (
                                        <img src={memory.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${memory.type === 'memory' ? 'from-pink-400 to-rose-500' : 'from-purple-400 to-indigo-500'} flex items-center justify-center`}>
                                            <Heart className="w-20 h-20 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1 z-20">
                                        MEMORY
                                    </div>
                                </div>
                                <div className="p-8 bg-white relative">
                                    <div className="absolute -top-6 left-8 text-6xl text-white opacity-100 font-serif" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>❝</div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 tracking-wider mb-1 uppercase">{memory.date} · {memory.category}</p>
                                            <h2 className="text-2xl font-bold text-gray-800 leading-tight">{memory.title}</h2>
                                        </div>
                                        <p className="text-gray-600 leading-relaxed font-serif italic border-l-2 border-pink-200 pl-4 py-1">{memory.description}</p>
                                        <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <MapPin className="w-4 h-4" />
                                                <span className="text-xs">{memory.latitude.toFixed(4)}, {memory.longitude.toFixed(4)}</span>
                                            </div>
                                            <div className="text-xs font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Couple Memory Map</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 2. POLAROID MODE */}
                        {mode === 'polaroid' && (
                            <div className="flex flex-col h-full bg-white">
                                <div className="relative bg-gray-100 overflow-hidden aspect-[4/5] mb-4 filter contrast-[1.05] brightness-[1.05] shadow-inner">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-30 pointer-events-none z-10" />
                                    {memory.imageUrl ? (
                                        <img src={memory.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center`}>
                                            <Heart className="w-20 h-20 text-white/50" />
                                        </div>
                                    )}
                                </div>
                                <div className="px-2 text-center flex-1 flex flex-col justify-center">
                                    <h2 className="font-cute text-3xl text-gray-800 mb-2 leading-none font-bold">{memory.title}</h2>
                                    <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-mono tracking-widest uppercase opacity-80 mb-4">
                                        <span>{memory.date}</span>
                                        <span>•</span>
                                        <span>{memory.category}</span>
                                    </div>
                                    {memory.description && (
                                        <p className="font-cute text-gray-500 text-lg leading-tight max-w-[90%] mx-auto opacity-80">"{memory.description}"</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. RECEIPT MODE */}
                        {mode === 'receipt' && (
                            <div className="bg-[#fcfaf9] text-gray-800 font-mono text-sm relative h-full flex flex-col shadow-xl">
                                {/* Paper Texture Overlay */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10 mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

                                {/* Top Serrated Edge */}
                                <div className="absolute -top-1 left-0 right-0 h-4 bg-[#fcfaf9]" style={{ clipPath: 'polygon(0% 100%, 5%  0%, 10% 100%, 15%  0%, 20% 100%, 25%  0%, 30% 100%, 35%  0%, 40% 100%, 45%  0%, 50% 100%, 55%  0%, 60% 100%, 65%  0%, 70% 100%, 75%  0%, 80% 100%, 85%  0%, 90% 100%, 95%  0%, 100% 100%)' }}></div>

                                <div className="p-6 pb-8 pt-8 flex-1 flex flex-col relative z-20">
                                    {/* Header */}
                                    <div className="text-center mb-6 space-y-2">
                                        <div className="w-10 h-10 border-2 border-gray-800 rounded-full mx-auto flex items-center justify-center mb-2">
                                            <Heart className="w-5 h-5 text-gray-800 fill-gray-800" />
                                        </div>
                                        <h2 className="text-2xl font-black tracking-widest leading-none">MEMO-RECEIPT</h2>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1">
                                            Store No. 520 • Term: {new Date(memory.createdAt || Date.now()).getFullYear()}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full border-b-2 border-dashed border-gray-300 my-4" />

                                    {/* Meta Info */}
                                    <div className="flex justify-between text-[10px] text-gray-500 mb-5 uppercase tracking-wide font-bold">
                                        <div className="flex flex-col text-left">
                                            <span className="text-gray-400">DATE</span>
                                            <span>{memory.date}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-gray-400">TIME</span>
                                            <span>{new Date(memory.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    {/* Big Photo Section */}
                                    {memory.imageUrl && (
                                        <div className="mb-6 border-4 border-gray-800 p-1 bg-white transform -rotate-1 shadow-sm">
                                            <img
                                                src={memory.imageUrl}
                                                className="w-full h-48 object-cover filter grayscale contrast-[1.1]"
                                                style={{ mixBlendMode: 'multiply' }}
                                            />
                                        </div>
                                    )}

                                    {/* Item List */}
                                    <div className="space-y-4 mb-6 flex-1">
                                        <div className="flex justify-between items-baseline group">
                                            <span className="font-bold uppercase text-lg">{memory.title}</span>
                                            <span className="font-bold text-lg">1</span>
                                        </div>

                                        {memory.description && (
                                            <div className="text-xs text-gray-600 leading-relaxed font-medium pl-2 border-l-2 border-gray-300">
                                                {memory.description}
                                            </div>
                                        )}

                                        {/* Extras / "Service Charge" */}
                                        <div className="pt-2 space-y-1">
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>LOVING.SVC</span>
                                                <span>100%</span>
                                            </div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>HAPPINESS.TAX</span>
                                                <span>999%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="border-t-2 border-dashed border-gray-800 py-3 mb-6">
                                        <div className="flex justify-between text-3xl font-black tracking-tighter items-end">
                                            <span className="text-sm tracking-normal font-normal self-center mr-auto">TOTAL</span>
                                            <span>FOREVER</span>
                                        </div>
                                    </div>

                                    {/* Footer / Barcode */}
                                    <div className="text-center space-y-4 mt-auto">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">THANK YOU FOR VISITING</p>

                                        {/* CSS Barcode */}
                                        <div className="h-12 w-3/4 mx-auto flex items-stretch justify-center gap-0.5 opacity-80 overflow-hidden mix-blend-multiply">
                                            {Array.from({ length: 40 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-full bg-black ${Math.random() > 0.5 ? 'flex-grow' : 'flex-grow-0 w-[1px]'} ${Math.random() > 0.8 ? 'bg-transparent' : ''}`}
                                                    style={{ width: Math.random() * 4 + 1 + 'px' }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-mono">{memory.id.split('-')[0].toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Bottom Edge */}
                                <div
                                    className="absolute -bottom-1 left-0 right-0 h-3 bg-[#fcfaf9]"
                                    style={{
                                        clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)'
                                    }}
                                />
                            </div>
                        )}

                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex gap-4">
                        <Button
                            className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg px-8 py-6 rounded-full text-lg font-medium transition-transform hover:scale-105 active:scale-95"
                            onClick={handleDownload}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                'Generating...'
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
