import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const { selectSeries, selectSection, classes, loading: classesLoading, selectedSeriesId, selectedSection } = useClass();

    const lastAutoSelectedRef = useRef<string | null>(null);
    const selectedSeriesIdRef = useRef(selectedSeriesId);
    const selectedSectionRef = useRef(selectedSection);
    // Track when user manually changes selection — suppress auto-sync for a cooldown period
    const manualOverrideUntilRef = useRef<number>(0);

    useEffect(() => {
        const prevKey = `${selectedSeriesIdRef.current}-${selectedSectionRef.current}`;
        const newKey = `${selectedSeriesId}-${selectedSection}`;

        selectedSeriesIdRef.current = selectedSeriesId;
        selectedSectionRef.current = selectedSection;

        // If the change was NOT triggered by us (auto-sync), it's a manual override
        if (prevKey !== newKey && newKey !== lastAutoSelectedRef.current) {
            // User manually changed — suppress auto-sync for 5 minutes
            manualOverrideUntilRef.current = Date.now() + 5 * 60 * 1000;
        }
    }, [selectedSeriesId, selectedSection]);

    useEffect(() => {
        const checkSchedule = async () => {
            if (!currentUser || classesLoading || classes.length === 0) return;

            // Respect manual override cooldown
            if (Date.now() < manualOverrideUntilRef.current) {
                return;
            }

            const now = new Date();
            const currentDay = now.getDay();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            try {
                const { data, error } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('day_of_week', currentDay)
                    .lte('start_time', currentTime)
                    .gte('end_time', currentTime)
                    .limit(1);

                if (error) return;

                const match = data && data.length > 0 ? data[0] : null;

                if (match) {
                    const targetClass = classes.find(c => c.id.toString() === match.class_id.toString());

                    if (!targetClass) {
                        console.warn("Predictive Sync: Slot found but Class ID not in local list.", {
                            slotClassId: match.class_id,
                            availableClasses: classes.map(c => ({ id: c.id, name: c.name }))
                        });
                    }

                    const targetKey = `${match.class_id}-${match.section}`;

                    if (targetClass) {
                        const currentKey = `${selectedSeriesIdRef.current}-${selectedSectionRef.current}`;

                        if (currentKey !== targetKey) {
                            console.log(`Predictive Sync: Switching to ${targetClass.name} ${match.section}`);
                            lastAutoSelectedRef.current = targetKey;
                            selectSeries(match.class_id);
                            selectSection(match.section);
                        }
                    }
                } else {
                    const currentKey = `${selectedSeriesIdRef.current}-${selectedSectionRef.current}`;

                    if (lastAutoSelectedRef.current && currentKey === lastAutoSelectedRef.current) {
                        console.log("Predictive Sync: releasing auto-selection (Free Time)");
                        selectSeries('');
                        selectSection('');
                        lastAutoSelectedRef.current = null;
                    }
                }

            } catch (e) {
                console.error("Predictive Sync Failed", e);
            }
        };

        checkSchedule();

        const interval = setInterval(checkSchedule, 60000);

        return () => clearInterval(interval);

    }, [currentUser, classesLoading, classes]);

    return {};
};
