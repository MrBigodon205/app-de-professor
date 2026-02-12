import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Institution {
    id: string;
    name: string;
    role: 'admin' | 'coordinator' | 'teacher';
}

interface SchoolContextType {
    currentSchool: Institution | null;
    loading: boolean;
    refreshSchool: () => Promise<void>;
    isCoordinator: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { id: paramsId } = useParams<{ id: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Context Global Lifting:
    // If we are wrapping the whole app, useParams might not catch the :id if it's defined deeper in the router VDOM.
    // So we double check the pathname for /institution/ID
    const extractId = () => {
        if (paramsId) return paramsId;
        const match = location.pathname.match(/\/institution\/([a-f0-9-]+)/i);
        return match ? match[1] : null;
    };

    const id = extractId();

    const [currentSchool, setCurrentSchool] = useState<Institution | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshSchool = async () => {
        // If no ID is found (e.g. user is on /dashboard), we just clear school state and stop loading
        if (!id) {
            setCurrentSchool(null);
            setLoading(false);
            return;
        }

        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            // Fetch school details + user role
            const { data, error } = await supabase
                .from('institution_teachers')
                .select('role, institutions(id, name)')
                .eq('institution_id', id)
                .eq('user_id', currentUser.id)
                .single();

            if (error || !data) {
                console.error('Access denied or school not found');
                // Don't auto-redirect if we are just "passing by" a route? 
                // Actually if the ID is in the URL but load fails, we probably should redirect or show error.
                // But for safety in Layout, we might just be strict:
                navigate('/');
                return;
            }

            // Explicit cast for joined data
            const schoolData = data.institutions as unknown as { id: string; name: string };

            setCurrentSchool({
                id: schoolData.id,
                name: schoolData.name,
                role: data.role as any
            });

        } catch (err) {
            console.error('Error fetching school context:', err);
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSchool();
    }, [id, currentUser]);

    return (
        <SchoolContext.Provider value={{
            currentSchool,
            loading,
            refreshSchool,
            isCoordinator: currentSchool?.role === 'admin' || currentSchool?.role === 'coordinator'
        }}>
            {children}
        </SchoolContext.Provider>
    );
};

export const useSchool = () => {
    const context = useContext(SchoolContext);
    if (context === undefined) {
        throw new Error('useSchool must be used within a SchoolProvider');
    }
    return context;
};
