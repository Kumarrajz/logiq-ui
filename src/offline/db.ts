import Dexie, { Table } from 'dexie';
export interface LocalSubmission { id?: number; submissionId: string; payload: Record<string, unknown>; syncStatus: string; updatedAt: number; }
export interface CachedTemplate { id: string; payload: Record<string, unknown>; cachedAt: number; }
class LogIQDB extends Dexie {
  submissions!: Table<LocalSubmission, number>;
  templates!: Table<CachedTemplate, string>;
  constructor() {
    super('logiq');
    this.version(1).stores({ submissions: '++id,submissionId,syncStatus', templates: 'id' });
  }
}
export const db = new LogIQDB();
