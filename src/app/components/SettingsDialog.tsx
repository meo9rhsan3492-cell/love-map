
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { AppSettings } from '@/app/hooks/useSettings';
import { Calendar, Users, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (newSettings: AppSettings) => void;
}

export function SettingsDialog({ isOpen, onClose, settings, onSave }: SettingsDialogProps) {
    const [formData, setFormData] = useState<AppSettings>(settings);

    useEffect(() => {
        setFormData(settings);
    }, [settings, isOpen]);

    const handleSave = () => {
        onSave(formData);
        toast.success('设置已保存 ✨');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold font-cute text-center flex items-center justify-center gap-2">
                        <span className="text-pink-500">恋爱</span>设置
                        <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">

                    {/* 纪念日设置 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-pink-600 font-bold border-b border-pink-100 pb-1">
                            <Calendar className="w-4 h-4" />
                            <Label>我们的纪念日</Label>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="startDate" className="text-xs text-gray-500">你们的故事从哪天开始？</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="rounded-xl border-pink-100 focus:border-pink-300 focus:ring-pink-200"
                            />
                        </div>
                    </div>

                    {/* 昵称设置 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-pink-600 font-bold border-b border-pink-100 pb-1">
                            <Users className="w-4 h-4" />
                            <Label>昵称设置（即将推出）</Label>
                        </div>
                        <p className="text-xs text-gray-400 italic">自定义你们在封面上显示的昵称。</p>
                    </div>

                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose} className="rounded-full border-pink-100 text-gray-500 hover:bg-pink-50">
                        取消
                    </Button>
                    <Button onClick={handleSave} className="rounded-full bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-200">
                        保存设置
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
