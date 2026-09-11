import { db } from './db';
import { api } from '../api/client';
export async function syncNow() {
  const pending = await db.submissions.where('syncStatus').equals('local_only').toArray();
  if (!pending.length) return { synced: 0 };
  const res = await api.post('/api/sync/batch', { items: pending.map((p) => p.payload) });
  const ids = new Set((res.data.results || []).filter((r: { status: string }) => r.status === 'accepted').map((r: { id: string }) => r.id));
  await Promise.all(pending.filter((p) => ids.has(p.submissionId)).map((p) => db.submissions.update(p.id!, { syncStatus: 'synced' })));
  return { synced: ids.size };
}
export function startSyncLoop() {
  const run = () => syncNow().catch(() => {});
  window.addEventListener('online', run);
  const t = setInterval(run, 30000);
  return () => { window.removeEventListener('online', run); clearInterval(t); };
}
