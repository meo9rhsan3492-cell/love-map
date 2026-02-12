import { useState, useEffect } from 'react';
import { Memory, MemoryType, MemoryCategory } from '@/app/types/memory';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { ImageUploader } from '@/app/components/ImageUploader';
import { Heart, MapPin, Map as MapIcon } from 'lucide-react';

interface MemoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  initialPosition?: { lat: number; lng: number };
  editingMemory?: Memory | null;
}

export function MemoryForm({ isOpen, onClose, onSave, onUpdate, initialPosition, editingMemory }: MemoryFormProps) {
  const [formData, setFormData] = useState({
    type: 'memory' as MemoryType,
    category: 'place' as MemoryCategory,
    title: '',
    description: '',
    latitude: initialPosition?.lat || 39.9042,
    longitude: initialPosition?.lng || 116.4074,
    locationName: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
    media: [] as { type: 'image' | 'video'; url: string; thumbnailUrl?: string; mimeType: string; fileName?: string }[],
  });

  // Update form when editing memory changes
  useEffect(() => {
    if (editingMemory) {
      setFormData({
        type: editingMemory.type,
        category: editingMemory.category,
        title: editingMemory.title,
        description: editingMemory.description,
        latitude: editingMemory.latitude,
        longitude: editingMemory.longitude,
        locationName: editingMemory.locationName || '',
        date: editingMemory.date,
        imageUrl: editingMemory.imageUrl || '',
        media: editingMemory.media || (editingMemory.imageUrl ? [{
          type: 'image',
          url: editingMemory.imageUrl,
          mimeType: 'image/jpeg', // Assumption for legacy
        }] : []),
      });
    } else if (initialPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: initialPosition.lat,
        longitude: initialPosition.lng,
      }));

      // Auto-fetch address (Reverse Geocoding)
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${initialPosition.lat}&lon=${initialPosition.lng}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'LoveJournal/1.0' }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.display_name) {
            const name = data.address?.amenity || data.address?.building || data.display_name.split(',')[0];
            setFormData(prev => ({ ...prev, locationName: name || prev.locationName }));
            toast.success(`已定位: ${name}`);
          }
        })
        .catch(() => { });
    }
  }, [editingMemory, initialPosition]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingMemory) {
      onUpdate?.(editingMemory.id, formData);
    } else {
      onSave(formData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      type: 'memory',
      category: 'place',
      title: '',
      description: '',
      latitude: initialPosition?.lat || 39.9042,
      longitude: initialPosition?.lng || 116.4074,
      locationName: '',
      date: new Date().toISOString().split('T')[0],
      imageUrl: '',
      media: [],
    });
    onClose();
  };

  const categories = [
    { value: 'place', label: '去过的地方' },
    { value: 'food', label: '吃过的美食' },
    { value: 'first', label: '第一次' },
    { value: 'travel', label: '旅行' },
    { value: 'date', label: '约会' },
    { value: 'special', label: '特殊时刻' },
    { value: 'other', label: '其他' },
  ];

  const handleGeocode = () => {
    if (!formData.locationName) return;
    toast.loading("Searching...");
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(formData.locationName)}&format=json&limit=1`, {
      headers: { 'User-Agent': 'LoveJournal/1.0' }
    })
      .then(res => res.json())
      .then(data => {
        toast.dismiss();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          setFormData(prev => ({
            ...prev,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon)
          }));
          toast.success("Found it! Map updated. 📍");
        } else {
          toast.error("Location not found.");
        }
      })
      .catch(() => toast.dismiss());
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-4 border-pink-100/50 shadow-2xl bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl font-cute font-bold text-gray-800">
            <div className="p-2 bg-pink-100 rounded-full">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            </div>
            {editingMemory ? 'Edit Memory' : 'New Memory'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs font-bold uppercase tracking-wider text-gray-400">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: MemoryType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="rounded-2xl border-pink-100 bg-pink-50/30 focus:ring-pink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-pink-100">
                  <SelectItem value="memory">💖 Memory</SelectItem>
                  <SelectItem value="expectation">✨ Expectation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-gray-400">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: MemoryCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="rounded-2xl border-pink-100 bg-pink-50/30 focus:ring-pink-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-pink-100 max-h-[200px]">
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-gray-400">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Give it a cute name..."
              className="rounded-2xl border-pink-100 bg-pink-50/30 focus:ring-pink-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-gray-400">Story</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What happened? Tell me everything..."
              className="rounded-2xl border-pink-100 bg-pink-50/30 focus:ring-pink-200 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationName">地点名称 (Location)</Label>
            <div className="flex gap-2">
              <Input
                id="locationName"
                value={formData.locationName || ''}
                onChange={(e) => setFormData({ ...formData, locationName: e.target.value })}
                placeholder="e.g. Disney Castle, Shanghai"
                className="rounded-2xl border-pink-100 bg-pink-50/30 focus:ring-pink-200"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleGeocode} title="Locate on Map" className="rounded-xl border-pink-200 hover:bg-pink-50">
                <MapPin className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
            <div className="flex-1">
              {formData.latitude && formData.longitude ? (
                <span className="flex items-center gap-1 text-green-600">
                  <MapIcon className="w-3 h-3" />
                  已定位坐标 ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <MapIcon className="w-3 h-3" />
                  未设置坐标 (将使用默认位置)
                </span>
              )}
            </div>
            <div className="text-[10px] opacity-50">
              *坐标将自动从照片或地图点击处获取
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Media (Photos & Videos)
            </Label>

            <div className="bg-pink-50/30 rounded-2xl p-4 border border-pink-100/50">
              <ImageUploader
                value={formData.media}
                onChange={(newMedia) => {
                  setFormData(prev => ({
                    ...prev,
                    media: newMedia,
                    // Backward compatibility: Set imageUrl to first media if image or thumbnail
                    imageUrl: newMedia[0]?.url || ''
                  }));
                }}
                onExifFound={(exif) => {
                  setFormData(prev => ({
                    ...prev,
                    latitude: exif.latitude ?? prev.latitude,
                    longitude: exif.longitude ?? prev.longitude,
                    date: exif.date ?? prev.date
                  }));

                  if (exif.latitude && exif.longitude) {
                    toast.success('已自动定位到拍摄地点 📍');
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}