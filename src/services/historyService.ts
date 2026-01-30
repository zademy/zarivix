import type { HistoryItem } from "../store/audioSlice";

const STORAGE_KEY = 'transcriptionHistory';
const MAX_HISTORY_ITEMS = 10;

export const HistoryService = {
    load: (): HistoryItem[] => {
        try {
            const serialized = localStorage.getItem(STORAGE_KEY);
            return serialized ? JSON.parse(serialized) : [];
        } catch (e) {
            console.error("Failed to load history", e);
            return [];
        }
    },

    save: (history: HistoryItem[]): void => {
        try {
            // Limit history size to prevent storage overflow
            const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
        } catch (e) {
            console.error("Failed to save history - Storage likely full", e);
        }
    },

    clear: (): void => {
        localStorage.removeItem(STORAGE_KEY);
    }
};
