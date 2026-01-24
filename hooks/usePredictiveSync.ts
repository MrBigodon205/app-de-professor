import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ScheduleItem } from '../types';

import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const { classes } = useClass();
    const [lastSync, setLastSync] = useState<number>(0);
    const [prefetchStatus, setPrefetchStatus] = useState<string>('idle'); // idle, fetching, done

    const masterFetch = useCallback(async () => {
        if (!currentUser || !classes.length || !navigator.onLine) return;

        // Rate limit: Max once every 5 minutes
        const now = Date.now();
        if (now - lastSync < 5 * 60 * 1000) return;

        setPrefetchStatus('fetching');
        console.log("[BackgroundSync] Starting Master Fetch...");

        try {
            // 1. Fetch ALL Schedules
            const { data: schedules } = await supabase
                .from('schedules')
                .select('*')
                .eq('user_id', currentUser.id);

            if (schedules) {
                // Upsert to Dexie
                await db.schedules.bulkPut(schedules);
            }

            // 2. Fetch Data for ALL Classes (Students, Grades, Attendance)
            // We iterate all classes to ensure full offline capability
            for (const cls of classes) {
                const classId = cls.id;

                // A. Students
                const { data: students } = await supabase
                    .from('students')
                    .select('*')
                    .eq('series_id', classId)
                    .eq('user_id', currentUser.id);

                if (students) {
                    await db.students.bulkPut(students.map(s => ({ ...s, id: s.id.toString(), syncStatus: 'synced' })));
                }

                // B. Grades (Heavy? Limit by recent?)
                // For now, fetch all for active subject to ensure gradebook works
                if (students && students.length > 0) {
                    const studentIds = students.map(s => s.id);
                    const { data: grades } = await supabase
                        .from('grades')
                        .select('*')
                        .in('student_id', studentIds)
                        .eq('user_id', currentUser.id);

                    if (grades) {
                        await db.grades.bulkPut(grades.map(g => ({
                            ...g,
                            student_id: g.student_id.toString(),
                            series_id: classId,
                            syncStatus: 'synced'
                        })));
                    }
                }
            }

            console.log("[BackgroundSync] Master Fetch Complete.");
            setLastSync(now);
            setPrefetchStatus('done');
            setTimeout(() => setPrefetchStatus('idle'), 3000);

        } catch (err) {
            console.error("[BackgroundSync] Failed", err);
            setPrefetchStatus('error');
        }
    }, [currentUser, classes, lastSync]);

    useEffect(() => {
        // Trigger on mount, connection restore, or if classes change (new class added)
        if (currentUser && navigator.onLine) {
            masterFetch();
        }

        const handleOnline = () => masterFetch();
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [masterFetch, currentUser]);

    return { prefetchStatus };
};
