import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ScheduleItem } from '../types';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const [lastRun, setLastRun] = useState<number>(0);
    const [prefetchStatus, setPrefetchStatus] = useState<string>('idle'); // idle, fetching, done

    useEffect(() => {
        if (!currentUser) return;

        const checkSchedule = async () => {
            const now = new Date();
            // Prevent running too often (e.g., only once every 15 min)
            if (now.getTime() - lastRun < 15 * 60 * 1000) return;

            console.log("[PredictiveSync] Checking schedule...");
            const currentDay = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

            // Get offline schedules
            // Note: Dexie 'schedules' table might not have indices for day_of_week yet if simple store
            // We'll fetch all matching user and filter in memory for now (list is small)
            const allSchedules = await db.schedules
                .where('user_id')
                .equals(currentUser.id)
                .toArray();

            const todaysClasses = allSchedules.filter((s: any) => s.day_of_week === currentDay);

            if (todaysClasses.length === 0) {
                console.log("[PredictiveSync] No classes today.");
                setLastRun(now.getTime());
                return;
            }

            // Look ahead 45 minutes
            const lookAheadTime = new Date(now.getTime() + 45 * 60 * 1000);
            const currentHours = lookAheadTime.getHours();
            const currentMinutes = lookAheadTime.getMinutes();
            const timeString = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

            // Simple string comparison for "is upcoming"
            // Start times are like "07:00", "08:40"
            // We want to find classes starting soon
            const upcomingClass = todaysClasses.find((cls: any) => {
                // If current time is close to start time
                // e.g. Now 06:45, Class 07:00 -> within window
                // We'll simplify: just check if start_time is greater than Now and less than Now+45m
                // Or just download EVERYTHING for today once in the morning.
                // STRATEGY: "Download Today". Much safer/robust.
                return true;
            });

            if (upcomingClass) {
                console.log("[PredictiveSync] Classes found for today. Pre-fetching data...");
                setPrefetchStatus('fetching');
                await prefetchData(todaysClasses);
                setPrefetchStatus('done');
            }

            setLastRun(now.getTime());
        };

        // Run check immediately on mount, then interval
        checkSchedule();
        const interval = setInterval(checkSchedule, 10 * 60 * 1000); // Check every 10 min

        return () => clearInterval(interval);
    }, [currentUser, lastRun]);

    const prefetchData = async (schedules: any[]) => {
        // Extract unique Class IDs
        const classIds = [...new Set(schedules.map((s: any) => s.class_id))];

        for (const classId of classIds) {
            console.log(`[PredictiveSync] Pre-fetching Class ${classId}`);

            // 1. Fetch Students
            const { data: students } = await supabase
                .from('students')
                .select('*')
                .eq('series_id', classId); // Assuming series_id maps to classId

            if (students) {
                // Save to Dexie
                await db.students.bulkPut(students);
            }

            // 2. Fetch recent Attendance (last 30 days) used for stats
            // ... logic ...

            // 3. Fetch Grades
            // ... logic ...
        }
    };

    return { prefetchStatus };
};
