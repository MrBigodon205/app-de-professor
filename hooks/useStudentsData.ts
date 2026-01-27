import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Student } from '../types';

// Unified Offline-First Hook (Hybrid Strategy)
// Strategy: ALWAYS Read from Local DB (Dexie) if Offline Mode Enabled
// If Online Mode Only: Read directly from Supabase.
import { ENABLE_OFFLINE_MODE } from '../lib/offlineConfig';

export const useStudentsData = (
    seriesId: string | undefined,
    section: string | undefined,
    userId: string | undefined
) => {
    // --- MODE 1: OFFLINE / HYBRID (PC APP) ---
    if (ENABLE_OFFLINE_MODE) {
        const [loading, setLoading] = useState(true);

        // 1. LIVE QUERY: Always listen to Dexie. This is our "Source of Truth" for the UI.
        const students = useLiveQuery(async () => {
            if (!seriesId || !userId) return [];

            let collection = db.students
                .where('[user_id+series_id]')
                .equals([userId, parseInt(seriesId)]);

            const localStudents = await collection.filter(s => {
                const student = s as any;
                let match = student.user_id === userId && (student.series_id === parseInt(seriesId) || student.series_id.toString() === seriesId);

                if (section && section !== '') {
                    match = match && student.section === section;
                }

                match = match && student.syncStatus !== 'deleted';
                return match;
            }).toArray();

            return localStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number)).map((s: any) => ({
                ...s,
                id: s.id.toString(),
                classId: s.series_id?.toString() || '',
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

                await db.transaction('rw', db.students, async () => {
                    const remoteIds = new Set(serverStudents.map(s => s.id));

                    const toCache = serverStudents.map(s => ({
                        ...s,
                        series_id: typeof s.series_id === 'string' ? parseInt(s.series_id) : s.series_id,
                        syncStatus: 'synced'
                    }));

                    const existing = await db.students.where('series_id').equals(parseInt(seriesId)).toArray();
                    const pendingMap = new Map(existing.filter(e => e.syncStatus === 'pending').map(e => [e.id, e]));

                    const finalCache = toCache.map(remote => {
                        if (pendingMap.has(remote.id)) {
                            return pendingMap.get(remote.id);
                        }
                        return remote;
                    });

                    await db.students.bulkPut(finalCache as any);

                    const localToDelete = existing.filter(l =>
                        l.syncStatus === 'synced' &&
                        !remoteIds.has(l.id) &&
                        (section ? l.section === section : true)
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

        useEffect(() => {
            syncWithServer();
        }, [syncWithServer]);

        // Dexie CRUD wrappers
        const addStudent = async (studentData: any) => {
            const payload = {
                ...studentData,
                series_id: parseInt(studentData.seriesId || studentData.series_id),
                syncStatus: 'pending'
            };
            delete payload.seriesId;
            await db.students.put(payload);
            await db.syncQueue.add({
                table: 'students', action: 'INSERT', payload, status: 'pending', createdAt: Date.now(), retryCount: 0
            });
        };

        const updateStudent = async (id: string, updates: any) => {
            const student = await db.students.get(id);
            if (!student) return;
            const updated = { ...student, ...updates, syncStatus: 'pending' };
            await db.students.put(updated);
            await db.syncQueue.add({
                table: 'students', action: 'UPDATE', payload: updated, status: 'pending', createdAt: Date.now(), retryCount: 0
            });
        };

        const deleteStudent = async (id: string) => {
            await db.students.delete(id);
            await db.syncQueue.add({
                table: 'students', action: 'DELETE', payload: { id }, status: 'pending', createdAt: Date.now(), retryCount: 0
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
    }

    // --- MODE 2: ONLINE ONLY (WEB APP) ---
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudents = async () => {
        if (!userId || !seriesId || !section) {
            setStudents([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Direct Supabase Fetch
            let query = supabase
                .from('students')
                .select('*')
                .eq('series_id', seriesId)
                .eq('user_id', userId);

            if (section && section !== '') {
                query = query.eq('section', section);
            }

            const { data, error } = await query;
            if (error) throw error;

            const formatted: Student[] = (data || []).map(s => ({
                id: s.id.toString(),
                name: s.name,
                number: s.number,
                initials: s.initials || '',
                color: s.color || '',
                classId: s.series_id.toString(),
                section: s.section,
                userId: s.user_id,
                units: s.units || {}
            }));

            formatted.sort((a, b) => parseInt(a.number) - parseInt(b.number));
            setStudents(formatted);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [seriesId, section, userId]);

    const addStudent = async (data: any) => {
        // Direct Supabase Insert
        const { seriesId, userId: uid, id: _tempId, ...rest } = data;
        const cleanData = {
            ...rest,
            series_id: seriesId,
            user_id: uid
        };
        const { error } = await supabase.from('students').insert(cleanData);
        if (error) throw error;
        await fetchStudents();
    };

    const updateStudent = async (id: string, updates: any) => {
        const { error } = await supabase.from('students').update(updates).eq('id', id);
        if (error) throw error;
        await fetchStudents();
    };

    const deleteStudent = async (id: string) => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw error;
        await fetchStudents();
    };

    return {
        students,
        loading,
        addStudent,
        updateStudent,
        deleteStudent,
        refresh: fetchStudents
    };
};
