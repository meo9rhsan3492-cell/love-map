import { Memory } from '@/app/types/memory';
import { Card, CardContent } from '@/app/components/ui/card';
import { Heart, Sparkles, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsCardProps {
  memories: Memory[];
}

export function StatsCard({ memories }: StatsCardProps) {
  const memoryCount = memories.filter(m => m.type === 'memory').length;
  const expectationCount = memories.filter(m => m.type === 'expectation').length;
  
  const categoryStats = memories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0];

  const categoryLabels: Record<string, string> = {
    place: '地点',
    food: '美食',
    first: '第一次',
    travel: '旅行',
    date: '约会',
    special: '特殊时刻',
    other: '其他',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <Card className="border-pink-100 bg-gradient-to-br from-pink-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">美好回忆</p>
              <p className="text-3xl font-bold text-pink-600">{memoryCount}</p>
            </div>
            <Heart className="w-10 h-10 text-pink-400 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">未来期待</p>
              <p className="text-3xl font-bold text-purple-600">{expectationCount}</p>
            </div>
            <Sparkles className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总标记</p>
              <p className="text-3xl font-bold text-blue-600">{memories.length}</p>
            </div>
            <MapPin className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">最爱分类</p>
              <p className="text-lg font-bold text-orange-600">
                {topCategory ? categoryLabels[topCategory[0]] : '-'}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-orange-400 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
