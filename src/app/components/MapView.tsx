
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Memory } from '@/app/types/memory';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Heart, Play, StopCircle } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { Button } from '@/app/components/ui/button';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  memories: Memory[];
  activeMemory?: Memory | null; // For auto-pilot
  isPlaying?: boolean;
  isPaused?: boolean; // Optimization: Stop animations when hidden
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (memory: Memory) => void;
  onStartJourney?: () => void;
  onStopJourney?: () => void;
}

// Map controller to handle clicks
function MapController({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    map.on('click', (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
    return () => {
      map.off('click');
    };
  }, [map, onMapClick]);

  return null;
}

// Component to handle auto-pilot flying
function MapRealigner({ activeMemory }: { activeMemory?: Memory | null }) {
  const map = useMap();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  useEffect(() => {
    if (activeMemory) {
      map.flyTo([activeMemory.latitude, activeMemory.longitude], 17, {
        animate: true,
        duration: isMobile ? 2 : 4,
        easeLinearity: 0.2
      });
    }
  }, [activeMemory, map]);
  return null;
}

// RadiantAuraLayer (The "Light" Effect - No Darkness)
const RadiantAuraLayer = ({ memories, hoveredMemoryId, isPaused }: { memories: Memory[]; hoveredMemoryId?: string | null; isPaused?: boolean }) => {
  const map = useMap();
  const frameRef = useRef<number>(0);
  const frameCountRef = useRef(0);
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;

  // Optimization: Use ref to track hover state without re-triggering the main effect (canvas recreation)
  const hoveredIdRef = useRef(hoveredMemoryId);

  // Sync ref with prop
  useEffect(() => {
    hoveredIdRef.current = hoveredMemoryId;
  }, [hoveredMemoryId]);

  useEffect(() => {
    // If paused (e.g., landing page visible), do nothing and don't create canvas
    if (isPaused) return;

    const canvas = L.DomUtil.create('canvas', 'leaflet-aura-layer');
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '350'; // Above tiles
    canvas.style.transition = 'opacity 0.5s ease';

    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let time = 0;

    const draw = () => {
      if (!ctx) return;

      // Frame throttling: mobile ~30fps, journey mode ~10fps
      frameCountRef.current++;
      const skipRate = isMobileDevice ? 2 : 1; // Mobile: every 2nd frame
      if (frameCountRef.current % skipRate !== 0) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bounds = map.getBounds().pad(0.5);
      const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());
      const size = { x: bottomRight.x - topLeft.x, y: bottomRight.y - topLeft.y };

      const dpr = window.devicePixelRatio || 1;
      const isMobile = window.innerWidth < 768; // Simple check inside the effect

      canvas.width = size.x * dpr;
      canvas.height = size.y * dpr;
      canvas.style.width = size.x + 'px';
      canvas.style.height = size.y + 'px';

      L.DomUtil.setPosition(canvas, topLeft);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(-topLeft.x, -topLeft.y);

      // Clear previous frame
      ctx.clearRect(topLeft.x, topLeft.y, size.x, size.y);

      // Use 'lighter' for additive light effect (glowing)
      ctx.globalCompositeOperation = 'lighter';

      // Animate the pulse
      time += 0.02;

      memories.forEach((memory, index) => {
        const point = map.latLngToLayerPoint([memory.latitude, memory.longitude]);
        // Read from Ref to avoid closure staleness without dependency
        const isHovered = memory.id === hoveredIdRef.current;

        // Interactive Pulse: Faster and bigger if hovered
        // On Mobile: Always have a gentle "breathing" pulse since there is no hover
        const mobilePulse = isMobile ? 0.3 : 0;

        const speed = isHovered ? 4 : (isMobile ? 2 : 1);
        const scaleBase = isHovered ? 0.15 : (0.08 + mobilePulse * 0.1);
        const radiusBoost = isHovered ? 1.5 : (1.0 + mobilePulse);

        const pulseScale = 1 + Math.sin(time * speed + index) * scaleBase; // Offset phase by index

        // Base radius for the aura
        const baseRadius = (150 + (index % 3) * 30) * radiusBoost;
        const currentRadius = baseRadius * pulseScale;

        // Gradient: Center (Hot Pink/Gold) -> Edge (Transparent)
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, currentRadius);

        if (isHovered) {
          // Hotter, brighter look for hovered
          gradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');   // Golden-ish
          gradient.addColorStop(0.4, 'rgba(251, 113, 133, 0.4)'); // Rose-400
          gradient.addColorStop(1, 'rgba(244, 114, 182, 0)');     // Transparent
        } else {
          // Standard warm look
          // On Mobile: Slightly more visible default state
          const alpha = isMobile ? 0.5 : 0.4;
          gradient.addColorStop(0, `rgba(244, 114, 182, ${alpha})`);   // Pink-400
          gradient.addColorStop(0.4, 'rgba(251, 113, 133, 0.2)'); // Rose-400
          gradient.addColorStop(1, 'rgba(244, 114, 182, 0)');     // Transparent
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner Core "Hotspot" (Brighter)
        const innerGradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, baseRadius * 0.4);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      canvas.remove();
    };
  }, [map, memories, isPaused]); // Removed hoveredMemoryId to prevent re-creation on hover

  return null;
};

// Function to create custom icon
const createCustomIcon = (media: Memory['media']) => {
  const cover = media?.[0];
  const imageUrl = cover ? (cover.type === 'video' ? cover.thumbnailUrl : cover.url) : null;

  if (imageUrl) {
    const isVideo = cover?.type === 'video';

    // Video Badge (Small Play Icon)
    const videoBadge = isVideo ? `
      <div class="absolute -top-1 -right-1 bg-black/60 backdrop-blur-md rounded-full p-1.5 border border-white/50 z-30 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>
      </div>
    ` : '';

    const html = `
      <div class="marker-icon-wrapper relative group">
        <div class="w-12 h-12 rounded-full border-2 border-white shadow-lg overflow-hidden relative z-10 transition-transform duration-500 ease-out group-hover:scale-125 group-hover:rotate-[10deg]">
          <img src="${imageUrl}" class="w-full h-full object-cover" />
          ${isVideo ? '<div class="absolute inset-0 bg-black/10"></div>' : ''}
        </div>
        ${videoBadge}
        <div class="absolute -bottom-1 -right-1 bg-pink-500 rounded-full p-1 border border-white z-20 shadow-sm animate-bounce">
           ${renderToString(<Heart className="w-3 h-3 text-white fill-white" />)} 
        </div>
      </div>
    `;
    return L.divIcon({
      html,
      className: 'custom-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 48],
      popupAnchor: [0, -48]
    });
  }

  // Fallback to Icon only
  // ... (Keep existing fallback logic but maybe refine it)
  const icon = <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />; // Simplified for now

  const html = renderToString(
    <div className="relative">
      <div className="marker-icon-wrapper w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-pink-100 transform transition-transform duration-300 hover:scale-110 relative z-10">
        {icon}
      </div>
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

export function MapView({
  memories,
  activeMemory,
  isPlaying,
  onMapClick,
  onMarkerClick,
  onStartJourney,
  onStopJourney
}: MapViewProps) {
  const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
  // ... existing hooks ...
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [memories]);

  const routePositions = useMemo(() => {
    return sortedMemories.map(m => [m.latitude, m.longitude] as [number, number]);
  }, [sortedMemories]);

  return (
    <div className="h-full w-full rounded-[2rem] overflow-hidden shadow-inner border border-white/50 relative z-0">
      <MapContainer
        center={[31.2304, 121.4737]}
        zoom={13}
        minZoom={3} // Prevent zooming out to grey void
        maxZoom={20} // Allow deep zoom
        className="h-full w-full bg-[#faf5f0]"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          className="saturate-[1.1] contrast-[1.05]"
          opacity={1}
          maxNativeZoom={20}
          maxZoom={20}
          keepBuffer={20}
          updateWhenZooming={false}
          updateWhenIdle={false}
          crossOrigin="anonymous"
        />

        <RadiantAuraLayer memories={memories} hoveredMemoryId={hoveredMemoryId} />
        <MapRealigner activeMemory={activeMemory} />

        {/* Journey Route Polyline - Only Visible When Playing */}
        {isPlaying && routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#f472b6',
              weight: 4,
              opacity: 0.8,
              dashArray: '8, 12',
              lineCap: 'round',
              className: 'animate-[dash-flow_3s_linear_infinite]'
            }}
          />
        )}

        <MapController onMapClick={onMapClick} />

        {sortedMemories.map((memory) => (
          <Marker
            key={memory.id}
            position={[memory.latitude, memory.longitude]}
            icon={createCustomIcon(memory.media)}
            eventHandlers={{
              click: () => onMarkerClick(memory),
              mouseover: () => setHoveredMemoryId(memory.id),
              mouseout: () => setHoveredMemoryId(null)
            }}
          >
            <Popup className="font-sans">
              <div className="text-center font-cute p-1">
                <p className="font-bold text-pink-600 text-lg mb-1">{memory.title}</p>
                <p className="text-xs text-gray-400 font-mono">{new Date(memory.date).toLocaleDateString()}</p>
                {/* Mini Badge for Video in Popup */}
                {memory.media?.some(m => m.type === 'video') && (
                  <div className="mt-1 inline-flex items-center gap-1 bg-pink-100 px-2 py-0.5 rounded-full text-[10px] text-pink-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                    Video Memory
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Overlay Gradients */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent pointer-events-none z-[400]" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/60 to-transparent pointer-events-none z-[400]" />

      {/* Journey Control FAB -- Moved up to avoid MusicPlayer overlap */}
      <div className="absolute bottom-24 right-8 z-[500] flex flex-col gap-2">
        {isPlaying ? (
          <Button
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 shadow-xl border-4 border-white/20 animate-pulse"
            onClick={onStopJourney}
          >
            <StopCircle className="w-6 h-6 text-white" fill="white" />
          </Button>
        ) : (
          <Button
            className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-xl border-4 border-white/20"
            onClick={onStartJourney}
          >
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </Button>
        )}
      </div>
    </div>
  );
}
