import { useState, useRef, useEffect } from 'react';
import { Upload, X, Film, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import ExifReader from 'exifreader';

export interface MediaItem {
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    mimeType: string;
    fileName?: string;
}

interface ImageUploaderProps {
    value?: MediaItem[];
    onChange: (media: MediaItem[]) => void;
    maxSizeMB?: number; // Per file
    maxFiles?: number;
    onExifFound?: (data: { latitude?: number; longitude?: number; date?: string }) => void;
}

export function ImageUploader({ value = [], onChange, maxSizeMB = 50, maxFiles = 9, onExifFound }: ImageUploaderProps) {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>(value);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync internal state with props
    useEffect(() => {
        setMediaItems(value);
    }, [value]);

    const generateVideoThumbnail = async (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.playsInline = true;
            video.currentTime = 1; // Capture at 1s

            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                URL.revokeObjectURL(video.src);
                resolve(thumbnail);
            };

            video.onerror = () => {
                resolve(''); // Fallback if fails
            };
        });
    };

    const compressImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1600; // Increased for better quality
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d')!;
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/jpeg', 0.85);
                    resolve(base64);
                };
            };
            reader.onerror = reject;
        });
    };

    const processExif = async (file: File) => {
        try {
            const tags = await ExifReader.load(file);
            let lat: number | undefined;
            let lng: number | undefined;
            let date: string | undefined;

            if (tags['GPSLatitude'] && tags['GPSLongitude']) {
                const latDesc = tags['GPSLatitude'].description;
                const lngDesc = tags['GPSLongitude'].description;
                if (typeof latDesc === 'number') lat = latDesc;
                else if (typeof latDesc === 'string' && !isNaN(parseFloat(latDesc))) lat = parseFloat(latDesc);
                if (typeof lngDesc === 'number') lng = lngDesc;
                else if (typeof lngDesc === 'string' && !isNaN(parseFloat(lngDesc))) lng = parseFloat(lngDesc);
            }

            if (tags['DateTimeOriginal']) {
                const dateStr = tags['DateTimeOriginal'].description;
                if (dateStr) {
                    const [dParts] = dateStr.split(' ');
                    date = dParts.replace(/:/g, '-');
                }
            }

            if ((lat || lng || date) && onExifFound) {
                onExifFound({ latitude: lat, longitude: lng, date: date });
            }
        } catch (e) {
            console.warn('EXIF extraction failed', e);
        }
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList) return;
        setError('');
        setIsProcessing(true);

        const newItems: MediaItem[] = [];
        const files = Array.from(fileList);

        if (mediaItems.length + files.length > maxFiles) {
            setError(`最多只能上传 ${maxFiles} 个文件`);
            setIsProcessing(false);
            return;
        }

        try {
            for (const file of files) {
                const isVideo = file.type.startsWith('video/');
                const isImage = file.type.startsWith('image/');

                if (!isVideo && !isImage) continue;

                if (file.size > maxSizeMB * 1024 * 1024) {
                    setError(`文件 ${file.name} 过大 (限制 ${maxSizeMB}MB)`);
                    continue;
                }

                // Process EXIF for the first image found
                if (isImage && newItems.length === 0 && mediaItems.length === 0) {
                    await processExif(file);
                }

                const reader = new FileReader();
                const filePromise = new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });

                const url = await filePromise; // For video, we might want to store blob or base64. Base64 is easier for local prototype.

                if (isVideo) {
                    // Check video size again, base64 is 33% larger. 
                    // Ideally we should upload to server, but for local storage app we store base64.
                    // Warn user about performance?
                    const thumbnail = await generateVideoThumbnail(file);
                    newItems.push({
                        type: 'video',
                        url: url, // Large base64 string
                        thumbnailUrl: thumbnail,
                        mimeType: file.type,
                        fileName: file.name
                    });
                } else {
                    const compressedUrl = await compressImage(file);
                    newItems.push({
                        type: 'image',
                        url: compressedUrl,
                        mimeType: file.type,
                        fileName: file.name
                    });
                }
            }

            const updated = [...mediaItems, ...newItems];
            setMediaItems(updated);
            onChange(updated);
        } catch (err) {
            console.error(err);
            setError('处理文件时出错');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleRemove = (index: number) => {
        const updated = mediaItems.filter((_, i) => i !== index);
        setMediaItems(updated);
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {/* Grid View of Uploads */}
            <div className="grid grid-cols-3 gap-3">
                <AnimatePresence>
                    {mediaItems.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-gray-50"
                        >
                            {item.type === 'video' ? (
                                <>
                                    <img src={item.thumbnailUrl} alt="Video thumb" className="w-full h-full object-cover opacity-80" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-black/40 rounded-full p-2 backdrop-blur-sm">
                                            <Film className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <img src={item.url} alt="Uploaded" className="w-full h-full object-cover" />
                            )}

                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    ))}

                    {/* Add Button (if not full) */}
                    {mediaItems.length < maxFiles && (
                        <motion.button
                            type="button"
                            layout
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2
                                transition-colors duration-200
                                ${isDragging
                                    ? 'border-pink-500 bg-pink-50 text-pink-500'
                                    : 'border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50/30'
                                }
                            `}
                        >
                            {isProcessing ? (
                                <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <Plus className="w-6 h-6" />
                                    <span className="text-xs font-medium">Add</span>
                                </>
                            )}
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <p className="text-[10px] text-gray-400 text-center">
                支持 Image & Video • 最多 {maxFiles} 个文件 • 智能定位 📍
            </p>
        </div>
    );
}
