// Capacitor SQLite adapter — same interface as db.ts (Sprint 0 stub, web Dexie is primary).
export const sqliteReady = async () => false;
export const sqliteSave = async (_t: string, _row: unknown) => {};
export const sqliteAll = async (_t: string): Promise<unknown[]> => [];
