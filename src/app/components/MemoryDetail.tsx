import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Memory, MediaItem } from '@/app/types/memory';
import {
  X, ChevronLeft, ChevronRight, Play, Pause,
  MapPin, Heart, Share2, Edit2, Trash2,
  Info, Sparkles, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { RevealText } from '@/app/components/RevealText';
import { ShareCard } from '@/app/components/ShareCard';
import { PassportStamp } from '@/app/components/PassportStamp';

interface MemoryDetailProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (memory: Memory) => void;
  onDelete: (id: string) => void;
  isJourneyMode?: boolean;
}

export function MemoryDetail({ memory, isOpen, onClose, onEdit, onDelete, isJourneyMode = false }: MemoryDetailProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Default muted for journey? Maybe not.
  const [isShareOpen, setIsShareOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Normalize Media (Safe even if memory is null)
  const mediaItems: MediaItem[] = memory && memory.media && memory.media.length > 0
    ? memory.media
    : (memory?.imageUrl ? [{ type: 'image', url: memory.imageUrl, mimeType: 'image/jpeg' }] : []);

  const activeMedia = mediaItems[activeMediaIndex];

  // Reset state when memory changes or opens
  useEffect(() => {
    if (isOpen) {
      setActiveMediaIndex(0);
      setShowInfo(false);
      setIsPlaying(false);
      // If Journey Mode, maybe start muted initially or follow user preference?
      // For now, let's keep default behavior but auto-play.
    }
  }, [isOpen, memory?.id]);

  // Journey Mode: Auto-Slideshow for Images
  useEffect(() => {
    if (!isOpen || !isJourneyMode || !memory?.media || memory.media.length <= 1) return;

    const currentMedia = memory.media[activeMediaIndex];
    if (currentMedia?.type === 'video') return; // Don't auto-slide if video is playing

    const timer = setInterval(() => {
      setActiveMediaIndex(prev => (prev + 1) % (memory.media?.length || 1));
    }, 3000); // 3s per slide

    return () => clearInterval(timer);
  }, [isOpen, isJourneyMode, activeMediaIndex, memory]);

  // Journey Mode: Auto-Play Video
  useEffect(() => {
    if (isOpen && isJourneyMode && videoRef.current) {
      videoRef.current.muted = false; // Try with sound? Unmuted autoplay might be blocked by browser policy without interaction.
      // Since user clicked "Start Journey", we might have interaction context.
      videoRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log("Autoplay blocked", e));
    }
  }, [isOpen, isJourneyMode, activeMediaIndex]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          if (showInfo) setShowInfo(false);
          else onClose();
          break;
        case 'ArrowLeft':
          handlePrevMedia();
          break;
        case 'ArrowRight':
          handleNextMedia();
          break;
        case ' ': // Space to play/pause video if active
          if (activeMedia?.type === 'video') {
            e.preventDefault();
            togglePlay();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showInfo, activeMediaIndex, activeMedia]); // Dependencies need to be correct for closures

  if (!memory) return null;

  // Handlers
  const handleNextMedia = () => {
    if (activeMediaIndex < mediaItems.length - 1) {
      setActiveMediaIndex(prev => prev + 1);
    }
  };

  const handlePrevMedia = () => {
    if (activeMediaIndex > 0) {
      setActiveMediaIndex(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Helper to get reliable URL for background (use thumbnail if video)
  const backgroundUrl = activeMedia?.type === 'video' ? activeMedia.thumbnailUrl : activeMedia?.url;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden font-sans"
        >
          {/* ==========================================
              1. AMBIENT BACKGROUND LAYER
             ========================================== */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {backgroundUrl ? (
              <motion.img
                key={backgroundUrl} // Re-animate on change
                src={backgroundUrl}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.4 }}
                transition={{ duration: 1 }}
                className="w-full h-full object-cover blur-3xl saturate-150"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${memory.type === 'memory' ? 'from-pink-900 to-rose-900' : 'from-purple-900 to-indigo-900'} opacity-50`} />
            )}
            <div className="absolute inset-0 bg-black/40" /> {/* Dimmer */}
          </div>

          {/* ==========================================
              2. MAIN STAGE (Media Viewer)
             ========================================== */}
          <div className="relative z-10 w-full h-full flex flex-col pointer-events-none">
            {/* Pointer events none on container so clicks pass through to controls, 
                but we need to re-enable them on interactive elements */}

            {/* Top Bar (Close) */}
            <div className="absolute top-0 right-0 p-6 z-50 pointer-events-auto flex items-center gap-4">
              {/* Context actions could go here */}
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-12 h-12" onClick={onClose}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Middle Stage */}
            <div className="flex-1 flex items-center justify-center relative p-4 sm:p-12">
              {/* Previous Arrow */}
              {mediaItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={activeMediaIndex === 0}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full w-12 h-12 text-white/50 hover:text-white hover:bg-white/10 transition-opacity pointer-events-auto ${activeMediaIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
                  onClick={(e) => { e.stopPropagation(); handlePrevMedia(); }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {/* Media Content */}
              <motion.div
                key={activeMediaIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden pointer-events-auto"
              >
                {activeMedia ? (
                  activeMedia.type === 'video' ? (
                    <div className="relative group">
                      <video
                        ref={videoRef}
                        src={activeMedia.url}
                        className="max-h-[85vh] max-w-full object-contain mx-auto"
                        poster={activeMedia.thumbnailUrl}
                        muted={isMuted}
                        loop
                        playsInline
                        onClick={togglePlay}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      {/* Video Controls Overlay */}
                      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        <Button size="icon" className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 border-none" onClick={togglePlay}>
                          {isPlaying ? <Pause className="w-8 h-8 fill-white text-white" /> : <Play className="w-8 h-8 fill-white text-white ml-1" />}
                        </Button>
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="text-white hover:bg-black/40" onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <VolumeX /> : <Volume2 />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={activeMedia.url}
                      alt="Memory"
                      className="max-h-[85vh] max-w-full object-contain mx-auto drop-shadow-2xl"
                    />
                  )
                ) : (
                  // Fallback visual
                  <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white/50">
                    <Heart className="w-20 h-20 mb-4 animate-pulse opacity-50" />
                    <span className="font-cute text-xl tracking-widest">NO IMAGE</span>
                  </div>
                )}
              </motion.div>

              {/* Next Arrow */}
              {mediaItems.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={activeMediaIndex === mediaItems.length - 1}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full w-12 h-12 text-white/50 hover:text-white hover:bg-white/10 transition-opacity pointer-events-auto ${activeMediaIndex === mediaItems.length - 1 ? 'opacity-0' : 'opacity-100'}`}
                  onClick={(e) => { e.stopPropagation(); handleNextMedia(); }}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}
              {/* Overlay Gradient for Text Readability (Bottom) - Only if no info panel */}
              {!showInfo && (
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20 pointer-events-none" />
              )}

              {/* PASSPORT STAMP (Journey Mode Only) */}
              {isJourneyMode && (
                <PassportStamp
                  locationName={memory.locationName || 'Unknown Place'}
                  date={memory.date}
                  index={Math.floor(Math.random() * 5)}
                  className="absolute right-[10%] bottom-[25%] sm:bottom-[15%] sm:right-[15%] flex items-center justify-center transform -rotate-12 scale-75 sm:scale-100 origin-bottom-right"
                />
              )}
            </div>

            {/* Bottom Bar: Quick Info */}
            <div className="w-full h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent absolute bottom-0 z-40 pointer-events-auto flex items-end pb-8 px-8 justify-between">

              {/* Left: Title & Date */}
              <div className="flex flex-col gap-1 text-white max-w-2xl">
                <div className="flex items-center gap-3 mb-1">
                  <Badge className={`bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 px-2 py-0.5 pointer-events-auto`}>
                    {memory.type === 'memory' ? <Heart className="w-3 h-3 mr-1 fill-pink-400 text-pink-400" /> : <Sparkles className="w-3 h-3 mr-1 fill-amber-300 text-amber-300" />}
                    {memory.type === 'memory' ? 'Memory' : 'Future'}
                  </Badge>
                  <span className="text-white/60 text-sm font-light tracking-wide">{memory.date}</span>
                  {mediaItems.length > 1 && (
                    <span className="text-white/40 text-xs border border-white/20 rounded-full px-2 py-0.5">
                      {activeMediaIndex + 1} / {mediaItems.length}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md font-display truncate">
                  {memory.title}
                </h1>
                <div
                  className="flex items-center gap-2 text-white/70 text-sm mt-1 font-medium cursor-pointer hover:text-pink-300 transition-colors group"
                  onClick={() => onEdit(memory)}
                  title="点击编辑地点"
                >
                  <MapPin className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
                  <span>{memory.locationName || '添加地点 (Add Location)...'}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 rounded-full gap-2 px-4"
                  onClick={() => setShowInfo(!showInfo)}
                >
                  <Info className="w-5 h-5" />
                  <span className="hidden sm:inline">Details</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => setIsShareOpen(true)}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => onEdit(memory)}
                >
                  <Edit2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full"
                  onClick={() => {
                    if (confirm('Delete this memory?')) {
                      onDelete(memory.id);
                      onClose();
                    }
                  }}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* ==========================================
              3. INFO PANEL (Slide Over)
             ========================================== */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-full sm:w-[400px] bg-white/10 backdrop-blur-2xl border-l border-white/10 z-[60] shadow-2xl flex flex-col"
              >
                <div className="p-6 pt-20 flex-1 overflow-auto">
                  <h2 className="text-2xl font-bold text-white mb-6 font-display">{memory.title}</h2>

                  <div className="prose prose-invert prose-lg max-w-none">
                    <RevealText
                      text={memory.description}
                      className="text-white/90 leading-relaxed font-serif whitespace-pre-wrap"
                      speed={0.01}
                    />
                  </div>

                  <div className="mt-12 space-y-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Location</div>
                      <div className="font-mono text-white/80 text-sm">
                        {memory.locationName ? (
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-pink-400" />
                            {memory.locationName}
                          </span>
                        ) : (
                          <span className="opacity-50">
                            {memory.latitude.toFixed(4)}, {memory.longitude.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-white/40 text-xs uppercase tracking-widest mb-2">Category</div>
                      <Badge variant="outline" className="text-white border-white/20">
                        {memory.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 bg-black/20">
                  <Button className="w-full bg-white text-black hover:bg-white/90" onClick={() => setShowInfo(false)}>
                    Close Info
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share Dialog */}
          <ShareCard
            memory={memory}
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
