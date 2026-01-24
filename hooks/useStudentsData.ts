import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useOffline } from '../contexts/OfflineContext';
import { Student } from '../types';
import { ENABLE_OFFLINE_MODE } from '../lib/offlineConfig';

// Standardized Interface for both modes
interface UseStudentsDataReturn {
    students: Student[];
    loading: boolean;
    addStudent: (data: any) => Promise<void>;
    updateStudent: (id: string, data: any) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

export const useStudentsData = (
    seriesId: string | undefined,
    section: string | undefined,
    userId: string | undefined
): UseStudentsDataReturn => {

    // --- MODE 1: OFFLINE / HYBRID (PC APP) ---
    if (ENABLE_OFFLINE_MODE) {
        const { addStudent, updateStudent, deleteStudent, forceSync } = useOffline();

        const students = useLiveQuery(async () => {
            if (!seriesId || !section || !userId) return [];

            const localStudents = await db.students
                .where({ series_id: seriesId, section: section, user_id: userId }) // Match Dexie schema
                .filter(s => s.syncStatus !== 'pending_delete')
                .toArray();

            return localStudents.sort((a, b) => parseInt(a.number) - parseInt(b.number)).map(s => ({
                ...s,
                classId: s.series_id, // Map from DB column
                units: {}
            })) as unknown as Student[];
        }, [seriesId, section, userId]) || [];

        const loading = !students && !!seriesId;

        return {
            students,
            loading,
            addStudent,
            updateStudent,
            deleteStudent,
            refresh: forceSync // For offline mode, refresh means syncing
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
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', seriesId)
                .eq('section', section)
                .eq('user_id', userId);

            if (error) throw error;

            const formatted: Student[] = data.map(s => ({
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

    // Wrappers for Online CRUD
    const addStudent = async (data: any) => {
        // Remove local-only fields if any
        const { seriesId, userId: uid, id, ...rest } = data;
        // Map back to what supabase expects if needed, or just insert
        // NOTE: The UI passes a mix of local/remote fields. 
        // We'll trust the direct insert for now but clean up if needed.
        const cleanData = {
            ...rest,
            id: id,
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
