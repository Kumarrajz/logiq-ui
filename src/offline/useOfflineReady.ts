import { useEffect, useState } from 'react';
import { db } from './db';
import { syncNow } from './syncEngine';
export function useOfflineReady() {
  const [isOnline, setOnline] = useState(navigator.onLine);
  const [pendingCount, setPending] = useState(0);
  useEffect(() => {
    const a = () => setOnline(true); const b = () => setOnline(false);
    window.addEventListener('online', a); window.addEventListener('offline', b);
    db.submissions.where('syncStatus').equals('local_only').count().then(setPending).catch(() => {});
    return () => { window.removeEventListener('online', a); window.removeEventListener('offline', b); };
  }, []);
  return { isOnline, pendingCount, sync: syncNow };
}
