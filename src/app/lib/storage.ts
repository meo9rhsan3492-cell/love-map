import type { Memory } from '@/app/types/memory';

const DB_NAME = 'couple-memories-db';
const DB_VERSION = 1;
const STORE_NAME = 'memories';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/** Load all memories from IndexedDB */
export async function loadMemories(): Promise<Memory[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by date descending (newest first)
            const memories = (request.result as Memory[]).sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            resolve(memories);
        };
        request.onerror = () => reject(request.error);
    });
}

/** Save all memories to IndexedDB (full replace) */
export async function saveMemories(memories: Memory[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Clear existing then put all
        store.clear();
        for (const memory of memories) {
            store.put(memory);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Add a single memory */
export async function addMemory(memory: Memory): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(memory);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Update a single memory */
export async function updateMemory(memory: Memory): Promise<void> {
    return addMemory(memory); // put() is upsert
}

/** Delete a single memory by id */
export async function deleteMemory(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Migrate existing localStorage data to IndexedDB (one-time).
 * Returns true if migration happened.
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
    const LS_KEY = 'couple-memories';
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;

    try {
        const memories: Memory[] = JSON.parse(raw);
        if (!Array.isArray(memories) || memories.length === 0) return false;

        // Check if IndexedDB already has data
        const existing = await loadMemories();
        if (existing.length > 0) {
            // Already migrated, just clean up localStorage
            localStorage.removeItem(LS_KEY);
            return false;
        }

        await saveMemories(memories);
        localStorage.removeItem(LS_KEY);
        console.log(`[Storage] Migrated ${memories.length} memories from localStorage → IndexedDB`);
        return true;
    } catch (e) {
        console.error('[Storage] Migration failed:', e);
        return false;
    }
}
