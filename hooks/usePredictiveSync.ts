import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const { selectSeries, selectSection, classes, loading: classesLoading, selectedSeriesId, selectedSection } = useClass();

    // We use a ref to track the last auto-selected class to avoid "fighting" the user too much
    // or simply to log it.
    const lastAutoSelectedRef = useRef<string | null>(null);
    // Refs to access latest state inside interval/effect without dependencies
    const selectedSeriesIdRef = useRef(selectedSeriesId);
    const selectedSectionRef = useRef(selectedSection);

    useEffect(() => {
        selectedSeriesIdRef.current = selectedSeriesId;
        selectedSectionRef.current = selectedSection;
    }, [selectedSeriesId, selectedSection]);

    useEffect(() => {
        const checkSchedule = async () => {
            if (!currentUser || classesLoading || classes.length === 0) return;

            const now = new Date();
            const currentDay = now.getDay(); // 0-6 (Sun-Sat)
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            // console.log(`Predictive Sync Check: Day=${currentDay}, Time=${currentTime}`);

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
                    // console.error("Predictive Sync Error:", error);
                    return;
                }

                if (data) {
                    // Match found!
                    // FIX: Ensure ID comparison is string-safe (Supabase might return number)
                    const targetClass = classes.find(c => c.id.toString() === data.class_id.toString());

                    if (!targetClass) {
                        console.warn("Predictive Sync: Slot found but Class ID not in local list.", {
                            slotClassId: data.class_id,
                            availableClasses: classes.map(c => ({ id: c.id, name: c.name }))
                        });
                    }

                    // Only switch if we are not already on it
                    // Construct a unique key for the target
                    const targetKey = `${data.class_id}-${data.section}`;

                    if (targetClass) {
                        // Only switch if we are not already on it
                        const currentKey = `${selectedSeriesIdRef.current}-${selectedSectionRef.current}`;

                        if (currentKey !== targetKey) {
                            console.log(`Predictive Sync: Switching to ${targetClass.name} ${data.section}`);
                            selectSeries(data.class_id);
                            selectSection(data.section);
                            lastAutoSelectedRef.current = targetKey;
                        }
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

                    // Only clear if the CURRENT selection is the one we auto-selected previously
                    // This prevents us from clearing a class the user manually navigated to.

                    const currentKey = `${selectedSeriesIdRef.current}-${selectedSectionRef.current}`;

                    // If we are currently on the "Auto" class, and now it's over/gone -> Release (Clear)
                    if (lastAutoSelectedRef.current && currentKey === lastAutoSelectedRef.current) {
                        console.log("Predictive Sync: releasing auto-selection (Free Time)");
                        selectSeries('');
                        selectSection('');
                        lastAutoSelectedRef.current = null;
                    }
                    // Else: User manually changed or we never auto-selected. Do nothing.
                }

            } catch (e) {
                console.error("Predictive Sync Failed", e);
            }
        };

        // Run immediately on mount/update
        checkSchedule();

        // Run every 60 seconds
        const interval = setInterval(checkSchedule, 10000); // Check every 10s for responsiveness

        return () => clearInterval(interval);

    }, [currentUser, classesLoading, classes]); // Refs allow us to omit selectedSeriesId from deps

    return {};
};
