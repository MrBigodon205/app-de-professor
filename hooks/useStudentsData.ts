import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Student } from '../types';

// Unified Offline-First Hook
// Strategy: ALWAYS Read from Local DB (Dexie) + Background Sync (Supabase)
export const useStudentsData = (
    seriesId: string | undefined,
    section: string | undefined,
    userId: string | undefined
) => {
    const [loading, setLoading] = useState(true);

    // 1. LIVE QUERY: Always listen to Dexie. This is our "Source of Truth" for the UI.
    // This allows UI to update instantly when we save to Dexie, even before network finishes.
    const students = useLiveQuery(async () => {
        if (!seriesId || !userId) return [];

        let collection = db.students
            .where('[user_id+series_id]')
            .equals([userId, parseInt(seriesId)]); // Compound index usage if exists, else filter

        // Fallback filtering if compound index doesn't exist or exact match needed
        const localStudents = await collection.filter(s => {
            const student = s as any;
            // Basic match
            let match = student.user_id === userId && (student.series_id === parseInt(seriesId) || student.series_id.toString() === seriesId);

            // Section match (if provided and not empty)
            if (section && section !== '') {
                match = match && student.section === section;
            }

            // Soft Delete check
            match = match && student.syncStatus !== 'deleted';
            return match;
        }).toArray();

        return localStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number)).map((s: any) => ({
            ...s,
            id: s.id.toString(),
            classId: s.series_id?.toString() || '', // Map from DB column
            units: s.units || {}
        })) as unknown as Student[];
    }, [seriesId, section, userId]) || [];

    // 2. BACKGROUND SYNC: Fetch from Server and Update Cache
    const syncWithServer = useCallback(async () => {
        if (!navigator.onLine || !userId || !seriesId) {
            setLoading(false);
            return;
        }

        try {
            // A. Fetch Remote Data
            let query = supabase
                .from('students')
                .select('*')
                .eq('series_id', seriesId)
                .eq('user_id', userId);

            if (section) {
                query = query.eq('section', section);
            }

            const { data, error } = await query;
            if (error) throw error;

            const serverStudents = data || [];

            // B. Cache to Dexie (Smart Merge)
            await db.transaction('rw', db.students, async () => {
                // We only overwrite items that are NOT 'pending' locally to avoid overwriting user's unsaved edits
                // But for Students list, conflicts are rare. Let's do a safe bulkPut.

                const remoteIds = new Set(serverStudents.map(s => s.id));

                // transform for Dexie
                const toCache = serverStudents.map(s => ({
                    ...s,
                    series_id: typeof s.series_id === 'string' ? parseInt(s.series_id) : s.series_id, // Normalize
                    syncStatus: 'synced' // Mark as safely synced
                }));

                // We should check existing items efficiently if needed, but bulkPut is okay.
                // It will overwrite. If we want to preserve "pending" edits, we need to check syncStatus.
                // For now, let's assume Server is truth unless we are actively editing.
                // A safer way:
                const existing = await db.students.where('series_id').equals(parseInt(seriesId)).toArray();
                const pendingMap = new Map(existing.filter(e => e.syncStatus === 'pending').map(e => [e.id, e]));

                const finalCache = toCache.map(remote => {
                    if (pendingMap.has(remote.id)) {
                        return pendingMap.get(remote.id); // Keep local pending version
                    }
                    return remote;
                });

                await db.students.bulkPut(finalCache as any);

                // Clean up? (Remove items that are on local but NOT on server, AND are 'synced' status)
                // This handles deletions from other devices.
                const localToDelete = existing.filter(l =>
                    l.syncStatus === 'synced' &&
                    !remoteIds.has(l.id) &&
                    (section ? l.section === section : true) // Only delete if within current scope
                );

                if (localToDelete.length > 0) {
                    await db.students.bulkDelete(localToDelete.map(l => l.id));
                }
            });

        } catch (err) {
            console.error("Sync Students Failed:", err);
        } finally {
            setLoading(false);
        }
    }, [seriesId, section, userId]);

    // Trigger Sync on mount or param change
    useEffect(() => {
        syncWithServer();
    }, [syncWithServer]);


    // 3. CRUD ACTIONS (Write Local -> Queue -> Trigger)

    const addStudent = async (studentData: any) => {
        // 1. Prepare Payload
        const payload = {
            ...studentData,
            series_id: parseInt(studentData.seriesId || studentData.series_id),
            syncStatus: 'pending'
        };
        delete payload.seriesId; // Clean unnecessary fields

        // 2. Save Local
        await db.students.put(payload);

        // 3. Queue Sync (if online logic is separate, or use generic useSync hook pattern here?)
        // For simplicity reusing manual sync logic or direct supabase if online?
        // To be truly offline-first, we MUST use the Queue pattern.

        await db.syncQueue.add({
            table: 'students',
            action: 'INSERT',
            payload: payload,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0
        });

        // 4. Optimistic Trigger (Only if online, otherwise queue waits)
        // We assume global sync worker picks this up, or we can force it.
        // For this hook, let's just rely on Dexie updating the UI (LiveQuery).
    };

    const updateStudent = async (id: string, updates: any) => {
        const student = await db.students.get(id);
        if (!student) return;

        const updated = { ...student, ...updates, syncStatus: 'pending' };

        await db.students.put(updated);

        await db.syncQueue.add({
            table: 'students',
            action: 'UPDATE',
            payload: updated,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0
        });
    };

    const deleteStudent = async (id: string) => {
        // Soft delete locally first or hard delete?
        // If we hard delete locally, LiveQuery removes it instantly.
        await db.students.delete(id);

        await db.syncQueue.add({
            table: 'students',
            action: 'DELETE',
            payload: { id },
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0
        });
    };

    return {
        students: students as unknown as Student[],
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        refresh: syncWithServer
    };
};
