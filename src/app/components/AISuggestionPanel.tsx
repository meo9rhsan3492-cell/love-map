import { useState } from 'react';
import { MapPin, Sparkles, RefreshCw, Heart, Building2, Coffee, Utensils, Camera } from 'lucide-react';
import { suggestPlace } from '../lib/ai';
import type { Memory } from '../types/memory';

interface AISuggestionPanelProps {
  memories: Memory[];
  onClose?: () => void;
}

interface PlaceSuggestion {
  name: string;
  reason: string;
  category?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  '餐厅': <Utensils className="w-4 h-4" />,
  '咖啡': <Coffee className="w-4 h-4" />,
  '景点': <Camera className="w-4 h-4" />,
  '建筑': <Building2 className="w-4 h-4" />,
  '默认': <Heart className="w-4 h-4" />
};

const categoryColors: Record<string, string> = {
  '餐厅': 'bg-orange-100 text-orange-600',
  '咖啡': 'bg-amber-100 text-amber-600',
  '景点': 'bg-blue-100 text-blue-600',
  '建筑': 'bg-purple-100 text-purple-600',
  '默认': 'bg-pink-100 text-pink-600'
};

export function AISuggestionPanel({ memories, onClose }: AISuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSuggest = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await suggestPlace(memories);
      
      if (response.error) {
        setError(response.error);
      } else {
        // 解析返回的建议
        const lines = response.content
          .split('\n')
          .filter(line => line.trim())
          .slice(0, 5);
        
        const parsed: PlaceSuggestion[] = lines.map(line => {
          // 尝试提取地点名和理由
          const match = line.match(/^[\d]?\.?\s*([^:：]+)[：:]\s*(.+)$/);
          if (match) {
            return { name: match[1].trim(), reason: match[2].trim() };
          }
          // 如果没匹配到，尝试其他格式
          const parts = line.split(/[——~-]/);
          if (parts.length >= 2) {
            return { name: parts[0].replace(/^[\d\.\s]*/, '').trim(), reason: parts[1].trim() };
          }
          return { name: line.replace(/^[\d\.\s]*/, '').trim(), reason: '' };
        }).filter(p => p.name);
        
        setSuggestions(parsed);
      }
    } catch (err) {
      setError('获取建议失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('餐厅') || lower.includes('饭') || lower.includes('餐')) return '餐厅';
    if (lower.includes('咖啡') || lower.includes('cafe')) return '咖啡';
    if (lower.includes('景点') || lower.includes('公园') || lower.includes('海滩')) return '景点';
    if (lower.includes('酒店') || lower.includes('民宿') || lower.includes('建筑')) return '建筑';
    return '默认';
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-pink-200 overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          <span className="font-semibold">打卡建议</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <span className="text-xl">&times;</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="flex gap-4 text-center">
          <div className="flex-1 bg-pink-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-pink-500">{memories.length}</p>
            <p className="text-xs text-gray-500">回忆总数</p>
          </div>
          <div className="flex-1 bg-purple-50 rounded-xl p-3">
            <p className="text-2xl font-bold text-purple-500">
              {new Set(memories.map(m => m.location).filter(Boolean)).size}
            </p>
            <p className="text-xs text-gray-500">去过地点</p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleSuggest}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>分析中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>推荐打卡地点</span>
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
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">基于你们的回忆，推荐以下地点：</p>
            {suggestions.map((place, i) => {
              const category = getCategory(place.name + place.reason);
              return (
                <div
                  key={i}
                  className="p-4 bg-gray-50 hover:bg-pink-50 rounded-xl transition cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-lg ${categoryColors[category]}`}>
                      {categoryIcons[category]}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{place.name}</h4>
                      {place.reason && (
                        <p className="text-sm text-gray-500 mt-1">{place.reason}</p>
                      )}
                    </div>
                    <Heart className="w-4 h-4 text-pink-300 hover:text-pink-500 transition" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && suggestions.length === 0 && !error && (
          <div className="text-center py-8 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">点击上方按钮获取推荐</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating suggestion button
export function AISuggestionButton({ memories }: { memories: Memory[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-[200px] w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40"
      >
        <MapPin className="w-6 h-6" />
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div onClick={e => e.stopPropagation()}>
            <AISuggestionPanel memories={memories} onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
