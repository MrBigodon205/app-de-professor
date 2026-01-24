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
    // 4. The "Worker Logic" (How to sync each type)
    const syncItem = async (item: SyncQueueItem) => {
        const { table, action, payload } = item;

        let supabaseTable = table;
        if (table === 'attendance') supabaseTable = 'attendance_records';

        if (action === 'INSERT' || action === 'UPDATE') {
            // SANITIZATION: Fix types before sending to Supabase
            const cleanPayload = { ...payload };

            // Fix IDs for relational tables (Supabase expects Numbers for BigInt, Dexie uses Strings)
            if (cleanPayload.student_id) cleanPayload.student_id = parseInt(cleanPayload.student_id);
            if (cleanPayload.series_id) cleanPayload.series_id = parseInt(cleanPayload.series_id);
            if (cleanPayload.id && !isNaN(parseInt(cleanPayload.id))) {
                // For update actions, ensure ID is correct type if needed, but usually UUIDs are strings.
                // If ID is numeric (old schema), parse it. If UUID, keep string.
                // ProfAcerta seems to use Numeric IDs for students/grades?
                // Let's assume standard handling -> if it parses to int and looks like one, send as number.
                // Actually, best to trust the source unless known issue.
                // Grades/Attendance use numeric IDs? 
                // Let's safe-guard student_id specifically.
            }

            // Remove local-only fields if they exist
            delete cleanPayload.syncStatus;

            const { error } = await supabase
                .from(supabaseTable)
                .upsert(cleanPayload);

            if (error) {
                console.error(`[Sync] Supabase Error for ${table}:`, error.message);
                throw error;
            }
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
