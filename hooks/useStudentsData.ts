import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Student } from '../types';

export const useStudentsData = (
    seriesId: string | undefined,
    section: string | undefined,
    userId: string | undefined
) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Mount Ref to prevent updates on unmounted components
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const fetchStudents = useCallback(async () => {
        if (!userId || !seriesId || !section) {
            if (mountedRef.current) {
                setStudents([]);
                setLoading(false);
            }
            return;
        }

        if (mountedRef.current) setLoading(true);
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

            // Check mount before heavy processing
            if (!mountedRef.current) return;

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

            formatted.sort((a, b) => a.name.localeCompare(b.name));

            if (mountedRef.current) {
                setStudents(formatted);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [seriesId, section, userId]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const addStudent = async (data: any) => {
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
