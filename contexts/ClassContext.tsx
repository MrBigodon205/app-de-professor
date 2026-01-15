import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ClassConfig } from '../types';
import { supabase } from '../lib/supabase';



interface ClassContextType {
    classes: ClassConfig[];
    selectedSeriesId: string;
    selectedSection: string;
    activeSeries: ClassConfig | undefined;
    loading: boolean;

    // Actions
    fetchClasses: () => Promise<void>;
    selectSeries: (id: string) => void;
    selectSection: (section: string) => void;
    addClass: (name: string) => Promise<void>;
    removeClass: (id: string) => Promise<void>;
    addSection: (classId: string, section: string) => Promise<void>;
    removeSection: (classId: string, section: string) => Promise<void>;
    transferStudent: (studentId: string, targetSeriesId: string, targetSection: string) => Promise<boolean>;
    refreshData: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<ClassConfig[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const { currentUser, activeSubject } = useAuth();

    const activeSeries = classes.find(c => c.id === selectedSeriesId);

    useEffect(() => {
        if (currentUser && activeSubject) {
            fetchClasses();
        } else if (currentUser && !activeSubject) {
            // Wait for activeSubject to be set
        } else {
            setClasses([]);
            setLoading(false);
        }
    }, [currentUser, activeSubject]);

    const fetchClasses = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            let query = supabase
                .from('classes')
                .select('*')
                .eq('user_id', currentUser.id);

            const { data, error } = await query.order('created_at', { ascending: true });

            if (error) throw error;

            const formattedClasses: ClassConfig[] = data.map(c => ({
                id: c.id.toString(),
                name: c.name,
                sections: c.sections,
                userId: c.user_id,
                subject: c.subject
            }));

            const uniqueClasses: ClassConfig[] = [];
            const seenConfigs = new Set();
            formattedClasses.forEach(c => {
                const configKey = `${c.name}-${c.sections.join(',')}`;
                if (!seenConfigs.has(configKey)) {
                    seenConfigs.add(configKey);
                    uniqueClasses.push(c);
                }
            });

            setClasses(uniqueClasses);

            if (formattedClasses.length > 0 && !selectedSeriesId) {
                setSelectedSeriesId(formattedClasses[0].id);
                if (formattedClasses[0].sections.length > 0) {
                    setSelectedSection(formattedClasses[0].sections[0]);
                }
            }

            if (selectedSeriesId && !uniqueClasses.find(c => c.id === selectedSeriesId)) {
                setSelectedSeriesId('');
                setSelectedSection('');
            }
        } catch (e) {
            console.error("Failed to fetch classes", e);
        } finally {
            setLoading(false);
        }
    }, [currentUser, selectedSeriesId]);

    const selectSeries = useCallback((id: string) => {
        setSelectedSeriesId(id);
        const target = classes.find(c => c.id === id);
        if (target) {
            if (selectedSection && target.sections.includes(selectedSection)) {
                // keep
            } else if (target.sections.length > 0) {
                setSelectedSection(target.sections[0]);
            } else {
                setSelectedSection('');
            }
        }
    }, [classes, selectedSection]);

    const selectSection = useCallback((section: string) => {
        setSelectedSection(section);
    }, []);

    const addClass = useCallback(async (name: string) => {
        if (!currentUser) return;

        let sections = ['A'];
        const lowerName = name.toLowerCase();
        if (lowerName.includes('sexto')) {
            sections = ['A', 'B', 'C', 'D'];
        } else if (lowerName.includes('sétimo') || lowerName.includes('setimo')) {
            sections = ['A', 'B', 'C'];
        } else if (lowerName.includes('oitavo')) {
            sections = ['A', 'B', 'C'];
        } else if (lowerName.includes('nono')) {
            sections = ['A', 'B'];
        } else if (lowerName.includes('médio') || lowerName.includes('medio') || lowerName.includes('ensino médio')) {
            sections = ['A'];
        }

        const newSeries = { name, sections, user_id: currentUser.id, subject: activeSubject };

        const { data, error } = await supabase
            .from('classes')
            .insert(newSeries)
            .select()
            .single();

        if (error) {
            console.error("Failed to add class", error.message);
            throw new Error(error.message);
        }

        const saved: ClassConfig = {
            id: data.id.toString(),
            name: data.name,
            sections: data.sections,
            userId: data.user_id,
            subject: data.subject
        };

        setClasses(prev => [...prev, saved]);
        setSelectedSeriesId(saved.id);
        setSelectedSection('A');
    }, [currentUser, activeSubject]);

    const removeClass = useCallback(async (id: string) => {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to remove class", error.message);
            return;
        }

        setClasses(prev => {
            const newClasses = prev.filter(c => c.id !== id);
            if (selectedSeriesId === id) {
                if (newClasses.length > 0) {
                    setSelectedSeriesId(newClasses[0].id);
                    setSelectedSection(newClasses[0].sections[0] || '');
                } else {
                    setSelectedSeriesId('');
                    setSelectedSection('');
                }
            }
            return newClasses;
        });
    }, [selectedSeriesId]);

    const addSection = useCallback(async (classId: string, section: string) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return;

        const updatedSections = [...cls.sections, section];

        const { error } = await supabase
            .from('classes')
            .update({ sections: updatedSections })
            .eq('id', classId);

        if (error) {
            console.error("Failed to add section", error.message);
            return;
        }

        setClasses(prev => prev.map(c => c.id === classId ? { ...c, sections: updatedSections } : c));
        setSelectedSection(section);
    }, [classes]);

    const removeSection = useCallback(async (classId: string, section: string) => {
        const cls = classes.find(c => c.id === classId);
        if (!cls) return;
        const updatedSections = cls.sections.filter(s => s !== section);

        const { error } = await supabase
            .from('classes')
            .update({ sections: updatedSections })
            .eq('id', classId);

        if (error) {
            console.error("Failed to remove section", error.message);
            return;
        }

        setClasses(prev => prev.map(c => c.id === classId ? { ...c, sections: updatedSections } : c));
        if (selectedSection === section) {
            setSelectedSection(updatedSections.length > 0 ? updatedSections[0] : '');
        }
    }, [classes, selectedSection]);

    const transferStudent = useCallback(async (studentId: string, targetSeriesId: string, targetSection: string) => {
        try {
            const { error } = await supabase
                .from('students')
                .update({
                    series_id: targetSeriesId,
                    section: targetSection
                })
                .eq('id', studentId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to transfer student", e);
            throw e;
        }
    }, []);

    const contextValue = useMemo(() => ({
        classes,
        selectedSeriesId,
        selectedSection,
        activeSeries,
        loading,
        fetchClasses,
        selectSeries,
        selectSection,
        addClass,
        removeClass,
        addSection,
        removeSection,
        transferStudent,
        refreshData: fetchClasses
    }), [
        classes,
        selectedSeriesId,
        selectedSection,
        activeSeries,
        loading,
        fetchClasses,
        selectSeries,
        selectSection,
        addClass,
        removeClass,
        addSection,
        removeSection,
        transferStudent
    ]);

    return (
        <ClassContext.Provider value={contextValue}>
            {children}
        </ClassContext.Provider>
    );

};

export const useClass = () => {
    const context = useContext(ClassContext);
    if (context === undefined) {
        throw new Error('useClass must be used within a ClassProvider');
    }
    return context;
};
