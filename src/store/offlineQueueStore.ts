import { create } from 'zustand';
import { persist } from 'zustand/middleware';
interface QueueState { items: Record<string, unknown>[]; enqueue: (i: Record<string, unknown>) => void; clear: () => void; }
export const useOfflineQueueStore = create<QueueState>()(persist((set) => ({
  items: [],
  enqueue: (i) => set((s) => ({ items: [...s.items, i] })),
  clear: () => set({ items: [] }),
}), { name: 'logiq-queue' }));
