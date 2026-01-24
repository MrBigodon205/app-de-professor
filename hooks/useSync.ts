import { useState, useEffect, useCallback } from 'react';
import { db, SyncQueueItem } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useSync = () => {
    const { currentUser } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    // 1. Monitor Network Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue(); // Trigger sync immediately when back online
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 2. Monitor Queue Size
    useEffect(() => {
        const updateCount = async () => {
            const count = await db.syncQueue.where('status').equals('pending').count();
            setPendingCount(count);
        };

        // Poll/Subscribe to changes (Dexie liveQuery style would be better but simple poll works)
        updateCount();
        const interval = setInterval(updateCount, 5000);
        return () => clearInterval(interval);
    }, []);


    // 3. The "Postal Worker" (Process Queue)
    const processQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        const count = await db.syncQueue.where('status').equals('pending').count();
        if (count === 0) return;

        setIsSyncing(true);
        console.log(`[Sync] Starting sync of ${count} items...`);

        try {
            // Get batch of pending items
            const pendingItems = await db.syncQueue
                .where('status')
                .equals('pending')
                .limit(50) // Process in chunks
                .toArray();

            for (const item of pendingItems) {
                try {
                    await syncItem(item);
                    // Mark compressed/done
                    // Actually, we delete from queue if successful to keep it clean
                    await db.syncQueue.delete(item.id!);
                } catch (err) {
                    console.error(`[Sync] Failed item ${item.id}`, err);
                    // Increment retry or mark failed
                    await db.syncQueue.update(item.id!, {
                        status: item.retryCount > 3 ? 'failed' : 'pending',
                        retryCount: item.retryCount + 1
                    });
                }
            }

            // Re-check count
            const remaining = await db.syncQueue.where('status').equals('pending').count();
            setPendingCount(remaining);

        } catch (error) {
            console.error("[Sync] Batch process failed", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isSyncing]);


    // 4. The "Worker Logic" (How to sync each type)
    const syncItem = async (item: SyncQueueItem) => {
        const { table, action, payload } = item;

        // Map local table names to Supabase table names if different
        // attendance -> attendance_records
        // grades -> grades (complex structure, might need flattening)

        let supabaseTable = table;
        if (table === 'attendance') supabaseTable = 'attendance_records';
        // if (table === 'students') supabaseTable = 'students'; // same
        // if (table === 'occurrences') supabaseTable = 'occurrences'; // same

        if (action === 'INSERT' || action === 'UPDATE') {
            // Basic strategy: UPSERT based on ID
            // Note: Payload must match Supabase schema columns
            const { error } = await supabase
                .from(supabaseTable)
                .upsert(payload);

            if (error) throw error;
        } else if (action === 'DELETE') {
            const { error } = await supabase
                .from(supabaseTable)
                .delete()
                .eq('id', payload.id);

            if (error) throw error;
        }
    };

    // Auto-trigger sync periodically if online
    useEffect(() => {
        if (isOnline) {
            const timer = setInterval(processQueue, 30000); // Check every 30s
            return () => clearInterval(timer);
        }
    }, [isOnline, processQueue]);

    return {
        isOnline,
        isSyncing,
        pendingCount,
        triggerSync: processQueue
    };
};
