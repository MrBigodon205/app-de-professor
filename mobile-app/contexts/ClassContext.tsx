import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { ClassConfig, Student } from '../types';

interface ClassContextType {
    classes: ClassConfig[];
    selectedSeriesId: string | null;
    selectedSection: string | null;
    activeSeries: ClassConfig | null;
    setSelectedSeriesId: (id: string | null) => void;
    setSelectedSection: (sec: string | null) => void;
    loading: boolean;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userId, activeSubject } = useAuth();
    const [classes, setClasses] = useState<ClassConfig[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchClasses = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('user_id', userId)
                .or(`subject.eq.${activeSubject},subject.is.null`);

            if (data) {
                setClasses(data.map(c => ({
                    id: c.id.toString(),
                    name: c.name,
                    sections: c.sections || [],
                    userId: c.user_id,
                    subject: c.subject
                })));
            }
            setLoading(false);
        };

        fetchClasses();
    }, [userId, activeSubject]);

    const activeSeries = classes.find(c => c.id === selectedSeriesId) || null;

    return (
        <ClassContext.Provider value={{
            classes,
            selectedSeriesId,
            selectedSection,
            activeSeries,
            setSelectedSeriesId,
            setSelectedSection,
            loading
        }}>
            {children}
        </ClassContext.Provider>
    );
};

export const useClass = () => {
    const context = useContext(ClassContext);
    if (!context) throw new Error('useClass must be used within a ClassProvider');
    return context;
};
