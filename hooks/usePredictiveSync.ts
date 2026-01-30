import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { supabase } from '../lib/supabase';

export const usePredictiveSync = () => {
    const { currentUser } = useAuth();
    const { selectSeries, selectSection, classes, loading: classesLoading } = useClass();
    const [synced, setSynced] = useState(false);
    const [predictedClass, setPredictedClass] = useState<string | null>(null);

    useEffect(() => {
        const sync = async () => {
            if (!currentUser || classesLoading || classes.length === 0 || synced) return;

            const now = new Date();
            const currentDay = now.getDay(); // 0-6 (Sun-Sat)
            const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            try {
                // Find matching schedule slot
                const { data, error } = await supabase
                    .from('schedules')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .eq('day_of_week', currentDay)
                    .lte('start_time', currentTime)
                    .gt('end_time', currentTime)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore no rows found
                    console.error("Predictive Sync Error:", error);
                    return;
                }

                if (data) {
                    // Match found! Sync context.
                    const targetClass = classes.find(c => c.id === data.class_id);
                    if (targetClass) {
                        selectSeries(data.class_id);
                        selectSection(data.section);
                        setPredictedClass(`${targetClass.name} - Turma ${data.section}`);
                        console.log(`Predictive Sync: Locked to ${targetClass.name} ${data.section}`);
                    }
                }
            } catch (e) {
                console.error("Predictive Sync Failed", e);
            } finally {
                setSynced(true); // Run only once per session/mount
            }
        };

        sync();
    }, [currentUser, classesLoading, classes, synced, selectSeries, selectSection]);

    return { synced, predictedClass };
};
