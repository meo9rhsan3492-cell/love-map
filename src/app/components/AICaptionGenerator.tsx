import { useState } from 'react';
import { Wand2, Copy, Check, Image, Sparkles } from 'lucide-react';
import { generateCaption } from '../lib/ai';
import type { Memory } from '../types/memory';

interface AICaptionGeneratorProps {
  memory: Partial<Memory>;
  onClose?: () => void;
}

interface CaptionOption {
  text: string;
  copied?: boolean;
}

export function AICaptionGenerator({ memory, onClose }: AICaptionGeneratorProps) {
  const [captions, setCaptions] = useState<CaptionOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setCaptions([]);

    try {
      const response = await generateCaption(memory);
      
      if (response.error) {
        setError(response.error);
      } else {
        // 解析返回的文案（按行分割）
        const lines = response.content
          .split('\n')
          .filter(line => line.trim() && !line.match(/^\d+[\.、]/))
          .map(line => line.replace(/^["'""']|["'""']$/g, '').trim());
        
        setCaptions(lines.map(text => ({ text })));
      }
    } catch (err) {
      setError('生成失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (index: number) => {
    const text = captions[index].text;
    await navigator.clipboard.writeText(text);
    setCaptions(prev => prev.map((c, i) => 
      i === index ? { ...c, copied: true } : c
    ));
    setTimeout(() => {
      setCaptions(prev => prev.map((c, i) => 
        i === index ? { ...c, copied: false } : c
      ));
    }, 2000);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-pink-200 overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <span className="font-semibold">AI 文案生成</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <span className="text-xl">&times;</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Preview */}
        <div className="bg-pink-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-pink-600">
            <Image className="w-4 h-4" />
            <span className="text-sm font-medium">预览</span>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>{memory.title || '未命名'}</strong></p>
            {memory.location && <p className="text-pink-500">📍 {memory.location}</p>}
            {memory.date && <p className="text-gray-400">{memory.date}</p>}
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span>生成中...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>生成甜蜜文案</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {captions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">点击复制文案：</p>
            {captions.map((caption, i) => (
              <div
                key={i}
                className="group p-3 bg-gray-50 hover:bg-pink-50 rounded-xl cursor-pointer transition flex items-start justify-between gap-2"
                onClick={() => handleCopy(i)}
              >
                <p className="text-sm text-gray-700 flex-1">{caption.text}</p>
                <button className="opacity-0 group-hover:opacity-100 transition">
                  {caption.copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-pink-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Floating generator button
export function AICaptionButton({ memory }: { memory: Partial<Memory> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-[60px] w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <Wand2 className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <AICaptionGenerator memory={memory} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
