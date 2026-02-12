import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface UserSchool {
    institutionId: string;
    role: 'admin' | 'coordinator' | 'teacher';
    status: 'active' | 'pending' | 'inactive';
    institutionName: string;
}

export function useUserSchools() {
    const { currentUser } = useAuth();
    const [schools, setSchools] = useState<UserSchool[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSchools = useCallback(async () => {
        if (!currentUser) {
            setSchools([]);
            setLoading(false);
            return;
        }

        try {
            // Fetch schools where user is a member
            const { data, error } = await supabase
                .from('institution_teachers')
                .select(`
                    institution_id,
                    role,
                    status,
                    institutions (
                        name
                    )
                `)
                .eq('user_id', currentUser.id);
            // .eq('status', 'active'); // Temporarily removed to debug visibility

            if (error) throw error;

            const formatted: UserSchool[] = data.map((item: any) => ({
                institutionId: item.institution_id,
                role: item.role,
                status: item.status,
                institutionName: item.institutions?.name || 'Escola Desconhecida'
            }));

            setSchools(formatted);
        } catch (err) {
            console.error('Failed to fetch user schools:', err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSchools();
    }, [fetchSchools]);

    return { schools, loading, refreshSchools: fetchSchools };
}
