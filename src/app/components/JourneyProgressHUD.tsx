import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, MapPin, Check } from 'lucide-react';

interface JourneyProgressHUDProps {
    currentIndex: number;
    totalCount: number;
    locationName?: string;
    latitude?: number;
    longitude?: number;
    isFlying: boolean; // true = flying to next, false = viewing card
    show: boolean;
}

export function JourneyProgressHUD({ currentIndex, totalCount, locationName, latitude, longitude, isFlying, show }: JourneyProgressHUDProps) {
    const progress = ((currentIndex + 1) / totalCount) * 100;
    const [displayLocation, setDisplayLocation] = useState<string>(locationName || '未知地点');

    // Fetch reverse geocoding for City + District
    useEffect(() => {
        if (!latitude || !longitude) {
            setDisplayLocation(locationName || '未知地点');
            return;
        }

        let isMounted = true;
        // Use a free public test key or the one from environment
        const apiKey = (import.meta as any).env?.VITE_AMAP_KEY || 'bb3c50005d5d81df2f6d0a7a001a1d95';
        const url = `https://restapi.amap.com/v3/geocode/regeo?key=${apiKey}&location=${longitude},${latitude}&radius=1000&extensions=base&batch=false`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (isMounted && data && data.status === '1' && data.regeocode) {
                    const comp = data.regeocode.addressComponent;
                    const city = comp.city && comp.city.length > 0 ? comp.city : comp.province;
                    const district = comp.district;
                    if (city && district) {
                        setDisplayLocation(`${city} · ${district}`);
                    } else if (city) {
                        setDisplayLocation(city);
                    } else {
                        setDisplayLocation(locationName || '未知地点');
                    }
                }
            })
            .catch(err => {
                console.warn('Reverse geocode failed, using default name', err);
                if (isMounted) setDisplayLocation(locationName || '未知地点');
            });

        return () => { isMounted = false; };
    }, [latitude, longitude, locationName]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, x: -30, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -30, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed bottom-24 left-4 z-[900] pointer-events-none"
                >
                    <div 
                        className="rounded-2xl px-4 py-3 min-w-[180px]"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(20,20,40,0.7) 100%)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        {/* Top row: Progress ring + counter */}
                        <div className="flex items-center gap-3">
                            {/* Mini progress ring */}
                            <div className="relative w-10 h-10 flex-shrink-0">
                                <svg className="w-10 h-10 rotate-[-90deg]" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                                    <motion.circle
                                        cx="20" cy="20" r="16"
                                        stroke="url(#hud-gradient)"
                                        strokeWidth="3"
                                        fill="none"
                                        strokeDasharray={100}
                                        animate={{ strokeDashoffset: 100 - progress }}
                                        transition={{ duration: 0.5 }}
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="hud-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#ec4899" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">{currentIndex + 1}/{totalCount}</span>
                                </div>
                            </div>

                            {/* Status text */}
                            <div className="flex-1 min-w-0">
                                <AnimatePresence mode="wait">
                                    {isFlying ? (
                                        <motion.div
                                            key="flying"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <Navigation className="w-3 h-3 text-pink-400" />
                                            <span className="text-xs text-white/70 truncate">飞往</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="arrived"
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-xs text-emerald-400/80">已到达</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={displayLocation}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-1 mt-0.5"
                                    >
                                        <MapPin className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                        <span className="text-xs font-medium text-white truncate max-w-[120px]">
                                            {displayLocation}
                                        </span>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
