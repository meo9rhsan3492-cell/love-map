import { useState, useEffect } from 'react';
import { useJourney } from '@/app/hooks/useJourney';
import { loadMemories, saveMemories, migrateFromLocalStorage } from '@/app/lib/storage';
import { useSound } from '@/app/hooks/useSound';
import { Map as MapIcon, Settings, X, Plus, Calendar as CalendarIcon, Sparkles, LayoutGrid, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast, Toaster } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { LoveTimer } from '@/app/components/LoveTimer';
import { HeartRain } from '@/app/components/HeartRain';
import { MusicPlayer } from '@/app/components/MusicPlayer';
import { CursorTrail } from '@/app/components/CursorTrail';
import { GlobalClickEffect } from '@/app/components/GlobalClickEffect';
import { AtmosphericBackground } from '@/app/components/AtmosphericBackground';
import { CinematicOverlay } from '@/app/components/CinematicOverlay';
import { LandingPage } from '@/app/components/LandingPage';
import { useSettings } from '@/app/hooks/useSettings';
import type { Memory } from '@/app/types/memory';

import { MapView } from '@/app/components/MapView';

// Static imports to fix runtime error #321
import { Timeline } from '@/app/components/Timeline';
import { BucketList } from '@/app/components/BucketList';
import { PolaroidWall } from '@/app/components/PolaroidWall';
import { MemoryForm } from '@/app/components/MemoryForm';
import { MemoryDetail } from '@/app/components/MemoryDetail';
import { SettingsDialog } from '@/app/components/SettingsDialog';
import { TravelTrivia } from '@/app/components/TravelTrivia';
import { CinematicShutter } from '@/app/components/CinematicShutter';
import { FloatingMemoryCard } from '@/app/components/FloatingMemoryCard';
import { MilestoneBadge } from '@/app/components/MilestoneBadge';
import { ArrivalBurst } from '@/app/components/ArrivalBurst';
import { JourneyProgressHUD } from '@/app/components/JourneyProgressHUD';
import { AnniversaryAlert } from '@/app/components/AnniversaryAlert';
import { DailyLoveNote } from '@/app/components/DailyLoveNote';
import { SeasonalParticles } from '@/app/components/SeasonalParticles';

// Storage now uses IndexedDB via lib/storage.ts

export default function App() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showLanding, setShowLanding] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [isPinning, setIsPinning] = useState(false);
  // Mobile View Mode: 'map' | 'stats' | 'timeline' | 'future' | 'wall'
  const [mobileView, setMobileView] = useState<'map' | 'stats' | 'timeline' | 'future' | 'wall'>('map');
  // Desktop View Mode: 'map' | 'timeline' | 'future' | 'wall'
  const [desktopView, setDesktopView] = useState<'map' | 'timeline' | 'future' | 'wall'>('map');

  const { playPop, playSuccess } = useSound();

  // Load from IndexedDB on mount (with automatic localStorage migration)
  const [storageReady, setStorageReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await migrateFromLocalStorage();
        const saved = await loadMemories();
        setMemories(saved);
      } catch (e) {
        console.error('Failed to load memories from IndexedDB', e);
      } finally {
        setStorageReady(true);
      }
    })();
  }, []);

  // Persist to IndexedDB whenever memories change
  useEffect(() => {
    if (!storageReady) return;
    saveMemories(memories).catch(e => console.error('Failed to save:', e));
  }, [memories, storageReady]);

  const filteredMemories = memories;

  const handleAddMemory = (newMemory: Omit<Memory, 'id' | 'createdAt'>) => {
    const memory: Memory = {
      ...newMemory,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setMemories([memory, ...memories]);
    setIsFormOpen(false);
    setIsPinning(false); // Disable pin mode after adding
    toast.success(memory.type === 'expectation' ? '未来心愿已许下 ✨' : '美好的回忆已记录 💖');
    playSuccess();
    if (memory.type === 'memory') setShowCelebration(true);
  };

  const handleUpdateMemory = (updatedMemory: Memory) => {
    setMemories(memories.map(m => m.id === updatedMemory.id ? updatedMemory : m));
    setSelectedMemory(null);
    toast.success('回忆已更新 ✨');
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(memories.filter(m => m.id !== id));
    setSelectedMemory(null);
    toast.success('回忆已删除');
  };

  const handleCompleteWish = (completedMemory: Memory) => {
    // Update memory (change type to memory, update date/desc)
    setMemories(memories.map(m => m.id === completedMemory.id ? completedMemory : m));
    toast.success('恭喜！心愿达成 🎉');
    setShowCelebration(true); // Trigger confetti
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (!isPinning) return; // Only allow click when pinning mode is active

    setTempLocation({ lat, lng });
    if (!isFormOpen && !selectedMemory) {
      setIsFormOpen(true); // Auto open form if nothing else active
      toast.info("已选择地图位置 📍");
    }
  };

  const handleMarkerClick = (memory: Memory) => {
    setSelectedMemory(memory);
  };

  const handleEdit = () => {
    toast.info('编辑功能开发中');
  };

  // Helper for stats and isMobile
  const isMobile = window.innerWidth < 768; // Simple check for mobile
  const setDesktopAddOpen = (isOpen: boolean) => setIsFormOpen(isOpen);

  // Platform settings
  const { settings, updateSettings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Journey Hook
  const {
    journeyState,
    journeyIndex,
    activeMilestone,
    currentDuration,
    showTrivia,
    showShutter,
    showBurst,
    isFlying,
    handleStartJourney,
    handleStopJourney,
    handleIntroComplete,
    handleOutroComplete
  } = useJourney({
    memories: filteredMemories,
    onMemorySelect: setSelectedMemory
  });

  const onStartJourneyClick = () => {
    setMobileView('map');
    setDesktopView('map');
    handleStartJourney();
  };

  // Journey Logic handled by useJourney hook

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-900 text-editorial overflow-hidden font-sans selection:bg-rose-200 relative">
      <AtmosphericBackground />
      <SeasonalParticles />
      <AnniversaryAlert startDate={settings.startDate} />
      <DailyLoveNote />

      {/* Cinematic Overlays */}
      <CinematicShutter active={showShutter} />
      <TravelTrivia show={showTrivia} />
      <ArrivalBurst active={showBurst} color={journeyIndex % 3 === 0 ? 'gold' : journeyIndex % 3 === 1 ? 'rose' : 'blue'} />

      <AnimatePresence>
        {journeyState === 'intro' && (
          <CinematicOverlay type="intro" onComplete={handleIntroComplete} />
        )}
        {journeyState === 'outro' && (
          <CinematicOverlay type="outro" onComplete={handleOutroComplete} memoriesCount={filteredMemories.length} />
        )}
      </AnimatePresence>

      {/* Milestone Badge Overlay */}
      <AnimatePresence>
        {activeMilestone && (
          <MilestoneBadge
            type={activeMilestone.type}
            title={activeMilestone.title}
            subtitle={activeMilestone.subtitle}
          />
        )}
      </AnimatePresence>

      {/* Letterbox Cinematic Bars + Progress */}
      <AnimatePresence>
        {journeyState === 'playing' && (
          <>
            {/* Top letterbox bar */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 40 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 right-0 z-[998] pointer-events-none bg-black/80 flex items-center px-4"
            >
              <span className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-mono">OUR LOVE JOURNAL</span>
              <span className="ml-auto text-white/30 text-[10px] font-mono">{journeyIndex + 1} / {filteredMemories.length}</span>
            </motion.div>

            {/* Bottom letterbox bar with progress */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 40 }}
              exit={{ height: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[998] pointer-events-none bg-black/80 flex items-center"
            >
              {/* Embedded progress bar */}
              <motion.div
                key={journeyIndex}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: currentDuration / 1000, ease: 'linear' }}
                className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]"
              />
              <span className="text-white/30 text-[10px] font-mono px-4">
                {filteredMemories[journeyIndex]?.locationName || '...'}
              </span>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Journey Progress HUD */}
      <JourneyProgressHUD
        currentIndex={journeyIndex}
        totalCount={filteredMemories.length}
        locationName={filteredMemories[journeyIndex]?.locationName}
        isFlying={isFlying}
        show={journeyState === 'playing'}
      />

      <AnimatePresence mode="sync">
        {showLanding && (
          <LandingPage onEnter={() => setShowLanding(false)} />
        )}
      </AnimatePresence>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

      {/* Main App Content - Aerial Drop Animation */}
      <motion.div
        className="relative w-full h-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={!showLanding ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18, mass: 1, delay: 0.5 }}
      >
        <Toaster position="top-center" />
        <HeartRain isActive={showCelebration} onComplete={() => setShowCelebration(false)} />
        {/* Hide Music Player in Journey Mode (or keep it?) - Let's fade it out to avoid distraction */}
        <motion.div animate={{ opacity: journeyState === 'playing' ? 0 : 1, pointerEvents: journeyState === 'playing' ? 'none' : 'auto' }}>
          <MusicPlayer autoPlayTrigger={!showLanding} />
        </motion.div>

        <GlobalClickEffect />
        <CursorTrail />

        {/* --- FULL SCREEN MAP BACKGROUND --- */}
        <div className="absolute inset-0 z-0 bg-gray-900">
          {/* --- FULL SCREEN MAP BACKGROUND --- */}
          <div className="absolute inset-0 z-0 bg-gray-900">
            {/* Sort memories for correct journey order (Time Ascending) */}
            <MapView
              memories={filteredMemories}
              activeMemory={journeyState === 'playing' ? filteredMemories[journeyIndex] : null}
              isPlaying={journeyState === 'playing'}
              isPaused={showLanding} // Pause heavy map effects while on landing page
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              onStartJourney={onStartJourneyClick}
              onStopJourney={handleStopJourney}
            />
          </div>
        </div>

        {/* --- OVERLAYS --- */}

        {/* Polaroid Wall Overlay */}
        <AnimatePresence>
          {(isMobile ? mobileView === 'wall' : desktopView === 'wall') && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              className="absolute inset-0 z-20 bg-stone-100/80 backdrop-blur-sm"
            >
              <div className="absolute top-6 right-6 z-30">
                <Button variant="ghost" size="icon" onClick={() => { setMobileView('map'); setDesktopView('map'); }} className="rounded-full bg-black/10 hover:bg-black/20 text-gray-800">
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <PolaroidWall memories={filteredMemories} onMemoryClick={handleMarkerClick} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timeline Overlay */}
        <AnimatePresence>
          {(isMobile ? mobileView === 'timeline' : desktopView === 'timeline') && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
              className="absolute inset-4 bottom-32 md:inset-x-20 md:top-20 md:bottom-32 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] z-20 overflow-hidden border border-white/40"
            >
              <div className="h-full overflow-y-auto p-6 md:p-12 custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-cute text-3xl text-gray-800">时光线</h2>
                  <Button variant="ghost" size="icon" onClick={() => { setMobileView('map'); setDesktopView('map'); }} className="rounded-full hover:bg-gray-100">
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                <Timeline memories={filteredMemories} onMemoryClick={handleMarkerClick} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Future Overlay */}
        <AnimatePresence>
          {(isMobile ? mobileView === 'future' : desktopView === 'future') && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 24, mass: 0.8 }}
              className="absolute inset-4 bottom-32 md:inset-x-auto md:w-[600px] md:left-1/2 md:-translate-x-1/2 md:top-20 md:bottom-32 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] z-20 overflow-hidden border border-purple-100/40"
            >
              <div className="h-full overflow-y-auto p-6 custom-scrollbar bg-gradient-to-b from-purple-50/50 to-white/50">
                <div className="flex justify-end mb-2">
                  <Button variant="ghost" size="icon" onClick={() => { setMobileView('map'); setDesktopView('map'); }} className="rounded-full hover:bg-purple-100">
                    <X className="w-6 h-6 text-purple-400" />
                  </Button>
                </div>
                <BucketList memories={memories} onComplete={handleCompleteWish} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory Detail View */}
        <AnimatePresence>
          {selectedMemory && (
            <MemoryDetail
              memory={selectedMemory}
              isOpen={!!selectedMemory}
              onClose={() => setSelectedMemory(null)}
              onDelete={handleDeleteMemory}
              onEdit={handleUpdateMemory}
              isJourneyMode={journeyState === 'playing'}
            />
          )}
        </AnimatePresence>


        {/* --- FLOATING UI CONTROLS (Distraction Free Wrapper) --- */}
        <motion.div
          animate={{ opacity: journeyState === 'playing' ? 0 : 1, pointerEvents: journeyState === 'playing' ? 'none' : 'auto' }}
          transition={{ duration: 0.5 }}
        >

          {/* Top Left: Brand / Title */}
          <div className="absolute top-6 left-6 z-30 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
              <h1 className="font-black italic text-3xl md:text-5xl text-white tracking-tighter drop-shadow-lg"
                style={{ textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                SQ <span className="text-pink-400">♥</span> ZXY
              </h1>
              <LoveTimer startDate={settings.startDate} className="text-white/80 mt-2 text-sm font-bold" />
            </div>
          </div>

          {/* Top Right: Settings */}
          <div className="absolute top-6 right-6 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { playPop(); setIsSettingsOpen(true); }}
              className="rounded-full bg-black/30 text-white hover:bg-black/50 backdrop-blur-xl w-10 h-10 md:w-12 md:h-12 border border-white/15 shadow-[0_4px_16px_rgba(0,0,0,0.15)] transition-all duration-300"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>

          {/* BOTTOM NAV BAR - Centered */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="bg-black/35 backdrop-blur-2xl px-2 py-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/15 flex items-center gap-1 md:gap-2">
              <NavButton
                active={(isMobile ? mobileView : desktopView) === 'map'}
                onClick={() => { setMobileView('map'); setDesktopView('map'); }}
                icon={<MapIcon className="w-5 h-5" />}
                label="地图"
              />
              <NavButton
                active={(isMobile ? mobileView : desktopView) === 'wall'}
                onClick={() => { setMobileView('wall'); setDesktopView('wall'); }}
                icon={<LayoutGrid className="w-5 h-5" />}
                label="墙"
              />
              <NavButton
                active={(isMobile ? mobileView : desktopView) === 'timeline'}
                onClick={() => { setMobileView('timeline'); setDesktopView('timeline'); }}
                icon={<CalendarIcon className="w-5 h-5" />}
                label="时光"
              />
              <NavButton
                active={(isMobile ? mobileView : desktopView) === 'future'}
                onClick={() => { setMobileView('future'); setDesktopView('future'); }}
                icon={<Sparkles className="w-5 h-5" />}
                label="未来"
              />
            </div>
          </div>

          {/* RIGHT SIDE ACTION BUTTONS - Stacked vertically, above nav bar */}
          <div className="absolute bottom-28 md:bottom-24 right-4 md:right-8 z-40 flex flex-col items-center gap-4">
            {/* Pin Toggle */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => {
                playPop();
                const nextState = !isPinning;
                setIsPinning(nextState);
                if (nextState) {
                  toast.info('点击地图任意位置添加回忆 📍', { duration: 3000 });
                } else {
                  toast.info('退出定位模式');
                }
              }}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex items-center justify-center border transition-all duration-300 ${isPinning ? 'bg-rose-500/90 backdrop-blur-xl border-white/20 text-white rotate-12 scale-110 ring-4 ring-rose-300/40' : 'bg-black/35 backdrop-blur-xl border-white/15 text-white hover:bg-black/50'}`}
            >
              <MapPin className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </motion.button>

            {/* FAB (Quick Add) */}
            <motion.button
              whileHover={{ scale: 1.15, rotate: 5 }}
              whileTap={{ scale: 0.85 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              onClick={() => { playPop(); setDesktopAddOpen(true); }}
              className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-tr from-pink-500 to-rose-400 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(236,72,153,0.4)] flex items-center justify-center text-white border-2 border-white/25"
            >
              <Plus className="w-7 h-7 md:w-10 md:h-10" strokeWidth={3} />
            </motion.button>
          </div>
        </motion.div>

        {/* Center Guide (If Empty) - Not wrapped because we might want it visible? actually wrap it too */}
        {memories.length === 0 && journeyState !== 'playing' && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-2xl text-white px-6 py-4 rounded-2xl border border-white/20 text-center animate-pulse shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.2)]"
            >
              <p className="font-bold text-lg">点击图钉按钮开始记录 📍</p>
              <p className="text-sm opacity-80">点亮我们的第一座城市 🌍</p>
            </motion.div>
          </div>
        )}

      </motion.div>

      {/* Forms & Modals */}
      <MemoryForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setIsPinning(false); }}
        onSave={handleAddMemory}
        initialPosition={tempLocation}
      />

      <AnimatePresence>
        {selectedMemory && (
          journeyState === 'playing' ? (
            <motion.div
              key={`journey-card-${selectedMemory.id}`}
              initial={{ opacity: 0, y: 80, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -60, scale: 0.85, filter: 'blur(6px)' }}
              transition={{ type: "spring", stiffness: 300, damping: 22, mass: 0.6 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none"
              style={{ willChange: 'transform, opacity' }}
            >
              {/* Backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              />
              {/* Glow behind card */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 blur-3xl"
              />
              <div className="pointer-events-auto relative z-10">
                <FloatingMemoryCard memory={selectedMemory} />
              </div>
            </motion.div>
          ) : (
            <MemoryDetail
              key="detail-view"
              memory={selectedMemory}
              isOpen={!!selectedMemory}
              onClose={() => {
                setSelectedMemory(null);
              }}
              onEdit={handleEdit}
              onDelete={handleDeleteMemory}
              isJourneyMode={false}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  const { playPop } = useSound();
  return (
    <motion.button
      onClick={() => { playPop(); onClick(); }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={`
                relative px-4 py-3 rounded-full flex items-center gap-2 transition-colors duration-300
                ${active ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
            `}
    >
      {icon}
      <span className={`text-sm font-bold ${!active && 'hidden md:inline'}`}>{label}</span>
      {active && <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white/25 backdrop-blur-xl rounded-full -z-10 border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
    </motion.button>
  );
}