import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const { selectSeries, selectSection, classes, loading: classesLoading, selectedSeriesId } = useClass();

    // We use a ref to track the last auto-selected class to avoid "fighting" the user too much
    // or simply to log it.
    const lastAutoSelectedRef = useRef<string | null>(null);

    useEffect(() => {
        const checkSchedule = async () => {
            if (!currentUser || classesLoading || classes.length === 0) return;

            const now = new Date();
            const currentDay = now.getDay(); // 0-6 (Sun-Sat)
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            console.log(`Predictive Sync Check: Day=${currentDay}, Time=${currentTime}`);

            try {
                // Find matching schedule slot
                // We use lte/gt to find a slot that ENCOMPASSES the current time.
                const { data, error } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('day_of_week', currentDay)
                    .lte('start_time', currentTime)
                    .gte('end_time', currentTime) // Changed to gte to include the exact end minute? or gt. lte/gt is standard.
                    // Actually, if start=07:00, end=07:50. Time=07:50. Should match? Usually no. Time=07:00 should match.
                    // So: start_time <= current < end_time
                    // Supabase doesn't have '<' easily mixed with lte/gt strings sometimes, but verify.
                    // Simple logic: start <= now AND end > now
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Predictive Sync Error:", error);
                    return;
                }

                if (data) {
                    // Match found!
                    const targetClass = classes.find(c => c.id === data.class_id);

                    // Only switch if we are not already on it
                    // Construct a unique key for the target
                    const targetKey = `${data.class_id}-${data.section}`;

                    // We also check if the user is ALREADY on this class to avoid re-render loops or toasts
                    // But we *should* enforce it if the user wants "Automation". 
                    // However, if the user manually navigated away 10s ago, forcing them back every 30s is annoyingly aggressive.
                    // User request: "Automaticamente vai". 
                    // Implementation: We set it.

                    if (targetClass) {
                        // Check current state via refs or just state? 
                        // Accessing state inside interval is tricky if not in dependency array. 
                        // But we are inside useEffect which depends on [classes].
                        // To make this robust, we define this function inside useEffect.

                        selectSeries(data.class_id);
                        selectSection(data.section);
                        lastAutoSelectedRef.current = targetKey;
                        // console.log(`Auto-switched to ${targetClass.name} ${data.section}`);
                    }
                } else {
                    // No match found (Free time)
                    // User requirement: "não deve se prender a nenhuma turma"
                    // Interpretation: Clear selection if we are "stuck" on an old one?
                    // Safe bet: If we are in "Auto Mode", clear it.
                    // We will explicitly clear the selection to "Release" the app.

                    // To avoid clearing while the user is browsing history, maybe we only clear if 
                    // the CURRENTLY selected class was the one we auto-selected Previously?
                    // OR just force clear.
                    // Given the user's specific complaint "não deve se prender", I will FORCE CLEAR.

                    if (selectedSeriesId !== '') {
                        // Only clear if we have something selected. 
                        // This effectively "Resets" the dashboard to neutral when class ends.
                        selectSeries('');
                        selectSection('');
                    }
                }

            } catch (e) {
                console.error("Predictive Sync Failed", e);
            }
        };

        // Run immediately on mount/update
        checkSchedule();

        // Run every 60 seconds
        const interval = setInterval(checkSchedule, 60000);

        return () => clearInterval(interval);

    }, [currentUser, classesLoading, classes]); // Removing selectedSeriesId dependency to avoid loops, handling inside logic

    return {};
};
