
import { useCallback } from 'react';

// Short "pop" sound encoded as base64 to avoid external dependency issues
const POP_SOUND = 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
// Note: Real base64 audio would be longer. Using a very short placeholder for now to prevent large file.
// Ideally, we would load a real file. But for a reliable "pop", let's use a browser native approach or a very short beep if files aren't available.
// Actually, let's use a synthetic sound via Web Audio API for zero dependencies.

export function useSound() {
    const playPop = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            // "Pop" effect: rapid pitch drop
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    }, []);

    const playSuccess = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            // "Success" effect: High ping
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    }, []);

    const playTick = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            // "Tick" effect: Short blip
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    }, []);

    return { playPop, playSuccess, playTick };
}
