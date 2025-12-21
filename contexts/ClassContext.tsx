import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
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
    refreshData: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<ClassConfig[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    const activeSeries = classes.find(c => c.id === selectedSeriesId);

    useEffect(() => {
        if (currentUser) {
            fetchClasses();
        } else {
            setClasses([]);
            setLoading(false);
        }
    }, [currentUser]);

    const fetchClasses = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedClasses: ClassConfig[] = data.map(c => ({
                id: c.id.toString(),
                name: c.name,
                sections: c.sections,
                userId: c.user_id
            }));

            // Deduplicate only if name AND sections are identical
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

            // Initial Default Selection if nothing selected
            if (formattedClasses.length > 0 && !selectedSeriesId) {
                setSelectedSeriesId(formattedClasses[0].id);
                if (formattedClasses[0].sections.length > 0) {
                    setSelectedSection(formattedClasses[0].sections[0]);
                }
            }
        } catch (e) {
            console.error("Failed to fetch classes", e);
        } finally {
            setLoading(false);
        }
    };

    const selectSeries = (id: string) => {
        setSelectedSeriesId(id);
        const target = classes.find(c => c.id === id);
        if (target) {
            // Try to keep same section or default to first
            if (selectedSection && target.sections.includes(selectedSection)) {
                // keep
            } else if (target.sections.length > 0) {
                setSelectedSection(target.sections[0]);
            } else {
                setSelectedSection('');
            }
        }
    };

    const selectSection = (section: string) => {
        setSelectedSection(section);
    };

    // CRUD Wrappers
    const addClass = async (name: string) => {
        if (!currentUser) return;

        // Intelligent Section Mapping
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
        } else if (lowerName.includes('primeiro') || lowerName.includes('segundo') || lowerName.includes('terceiro')) {
            // High school or specific individual series usually have only one section 'A'
            sections = ['A'];
        }

        const newSeries = { name, sections, user_id: currentUser.id };

        const { data, error } = await supabase
            .from('classes')
            .insert(newSeries)
            .select()
            .single();

        if (error) {
            console.error("Failed to add class", error.message);
            return;
        }

        const saved: ClassConfig = {
            id: data.id.toString(),
            name: data.name,
            sections: data.sections,
            userId: data.user_id
        };

        setClasses(prev => [...prev, saved]);
        // Auto select
        setSelectedSeriesId(saved.id);
        setSelectedSection('A');
    };

    const removeClass = async (id: string) => {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to remove class", error.message);
            return;
        }

        const newClasses = classes.filter(c => c.id !== id);
        setClasses(newClasses);
        if (selectedSeriesId === id) {
            if (newClasses.length > 0) {
                setSelectedSeriesId(newClasses[0].id);
                setSelectedSection(newClasses[0].sections[0] || '');
            } else {
                setSelectedSeriesId('');
                setSelectedSection('');
            }
        }
    };

    const addSection = async (classId: string, section: string) => {
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
    };

    const removeSection = async (classId: string, section: string) => {
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
    };

    return (
        <ClassContext.Provider value={{
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
            refreshData: fetchClasses
        }}>
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
