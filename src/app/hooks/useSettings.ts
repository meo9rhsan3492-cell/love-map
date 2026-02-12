
import { useState, useEffect } from 'react';

export interface AppSettings {
    startDate: string; // ISO Date String
    names: {
        partner1: string;
        partner2: string;
    };
}

const STORAGE_KEY = 'couple-settings-v1';

const DEFAULT_SETTINGS: AppSettings = {
    startDate: '2024-01-01',
    names: {
        partner1: 'You',
        partner2: 'Me',
    },
};

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    // Save to localStorage when settings change
    // Note: This relies on the user calling updateSettings to trigger a save logic if we wanted auto-save,
    // but here we just provide a setter that saves.
    const updateSettings = (newSettings: Partial<AppSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    };

    return { settings, updateSettings };
}
