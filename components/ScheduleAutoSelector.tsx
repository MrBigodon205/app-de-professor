import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase';

/**
 * ScheduleAutoSelector
 * Silently detects the current class and lesson based on the user's timetable and the current time.
 * If a match is found, it automatically sets the active subject and selected class/section.
 */
export const ScheduleAutoSelector: React.FC = () => {
    const { currentUser, updateActiveSubject } = useAuth();
    const { selectSeries, selectSection, classes, virtualGroups } = useClass();
    const hasRun = useRef(false);

    useEffect(() => {
        // Run only once per session/mount
        if (!currentUser?.id || hasRun.current || classes.length === 0) return;

        const detectSchedule = async () => {
            try {
                const now = new Date();
                const dayOfWeek = now.getDay(); // 0-6 (Sun-Sat)
                
                // Format time as HH:mm for comparison (e.g., "08:30")
                const currentTime = now.toTimeString().slice(0, 5);

                const { data: schedule, error } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('day_of_week', dayOfWeek)
                    .lte('start_time', currentTime)
                    .gte('end_time', currentTime)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (schedule && schedule.length > 0) {
                    const currentMatch = schedule[0];
                    console.log("[AutoSelector] Found current schedule match:", currentMatch);

                    if (currentMatch.subject) {
                        updateActiveSubject(currentMatch.subject);
                    }

                    // Handle both regular classes and virtual groups
                    const classIdToUse = currentMatch.virtual_group_id || currentMatch.class_id;

                    if (classIdToUse) {
                        const classIdStr = classIdToUse.toString();
                        // Verify if class or group still exists
                        const exists = classes.some(c => c.id === classIdStr) || 
                                     virtualGroups.some(g => g.id === classIdStr);

                        if (exists) {
                            selectSeries(classIdStr);
                            if (currentMatch.section) {
                                selectSection(currentMatch.section);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("[AutoSelector] Detection error:", err);
            } finally {
                hasRun.current = true;
            }
        };

        // Give data a small buffer to load
        const timer = setTimeout(detectSchedule, 1500);
        return () => clearTimeout(timer);
    }, [currentUser, updateActiveSubject, selectSeries, selectSection, classes]);

    return null;
};
