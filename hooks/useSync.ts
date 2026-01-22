import { useState, useEffect, useCallback } from 'react';
import { db, SyncQueueItem } from '../lib/db';
import { supabase } from '../lib/supabase';
// import { useLiveQuery } from 'dexie-react-hooks'; // Removed as not installed
// Actually, let's write it without dexie-react-hooks first to be safe, or I can install it.
// Given strict instructions, I should probably stick to what I installed.
// I'll use standard useEffect and event listeners.

export const useSync = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // Monitor Online Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor Queue Size (Simple Polling or Trigger)
    useEffect(() => {
        const checkQueue = async () => {
            const count = await db.syncQueue.where('status').equals('pending').count();
            setPendingCount(count);
        };

        checkQueue();
        const interval = setInterval(checkQueue, 2000); // Poll every 2s for queue updates
        return () => clearInterval(interval);
    }, []);

    const processQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;
        setIsSyncing(true);

        try {
            const pendingItems = await db.syncQueue
                .where('status')
                .equals('pending')
                .toArray();

            if (pendingItems.length === 0) {
                setIsSyncing(false);
                return;
            }

            for (const item of pendingItems) {
                try {
                    const { table, action, payload } = item;
                    let error = null;

                    // Execute against Supabase
                    if (action === 'INSERT') {
                        const { error: e } = await supabase.from(table as any).insert(payload);
                        error = e;
                    } else if (action === 'UPDATE') {
                        const { id, ...data } = payload;

                        const match = payload.id ? { id: payload.id } :
                            (table === 'attendance' ? { student_id: payload.student_id, date: payload.date, subject: payload.subject, unit: payload.unit } :
                                (table === 'grades' ? { student_id: payload.student_id, unit: payload.unit, subject: payload.subject } :
                                    ((table as string) === 'students' ? { id: payload.id } : {})));

                        const { error: e } = await supabase.from(table as any).update(data).match(match);
                        error = e;
                    } else if (action === 'DELETE') {
                        const match = payload.id ? { id: payload.id } :
                            (table === 'attendance' ? { student_id: payload.student_id, date: payload.date } :
                                ((table as string) === 'students' ? { id: payload.id } : {}));
                        const { error: e } = await supabase.from(table as any).delete().match(match);
                        error = e;
                    }

                    // If Upsert (often better for syncing)
                    // We might change action to UPSERT in the queue for safety

                    if (!error) {
                        await db.syncQueue.delete(item.id!);
                    } else {
                        console.error("Sync Error Item:", item, error);
                        // Mark as failed or increment retry?
                        // For now keep pending but maybe backoff?
                        // Let's increment retry logic if we had it, or just leave it.
                    }

                } catch (err) {
                    console.error("Process Queue Error", err);
                }
            }
        } catch (e) {
            console.error("Queue execution failed", e);
        } finally {
            setIsSyncing(false);
            // Re-check count
            const count = await db.syncQueue.where('status').equals('pending').count();
            setPendingCount(count);
        }
    }, [isSyncing]);

    // Expose a function to manually trigger sync (e.g. after adding item)
    const triggerSync = () => {
        if (navigator.onLine) processQueue();
    };

    return {
        isOnline,
        isSyncing,
        pendingCount,
        triggerSync
    };
};
