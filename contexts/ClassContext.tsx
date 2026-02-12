import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
    bulkTransferStudents: (studentIds: string[], targetSeriesId: string, targetSection: string) => Promise<boolean>;
    refreshData: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<ClassConfig[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const { currentUser, activeSubject } = useAuth();

    const activeSeries = useMemo(() => classes.find(c => c.id === selectedSeriesId), [classes, selectedSeriesId]);

    // Ref to access selectedSeriesId inside fetchClasses without it being a dependency
    const selectedSeriesIdRef = useRef(selectedSeriesId);
    useEffect(() => { selectedSeriesIdRef.current = selectedSeriesId; }, [selectedSeriesId]);

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


    const location = useLocation();

    // Helper to extract ID
    const getInstitutionId = useCallback(() => {
        const match = location.pathname.match(/\/institution\/([a-f0-9-]+)/i);
        return match ? match[1] : null;
    }, [location.pathname]);

    const activeInstitutionId = getInstitutionId();

    const fetchClasses = useCallback(async () => {
        if (!currentUser) return;

        try {
            let query = supabase
                .from('classes')
                .select('id, name, sections, user_id, subject, institution_id');

            // Filter by context
            if (activeInstitutionId) {
                // Institutional Dashboard: Filter by Institution ID
                // RLS will handle the security (Coordinator sees all, Teacher sees own)
                query = query.eq('institution_id', activeInstitutionId);
            } else {
                // Personal Dashboard: Only show personal classes (no institution) AND owned by user
                query = query.is('institution_id', null).eq('user_id', currentUser.id);
            }

            const { data, error } = await query.order('created_at', { ascending: true });

            if (error) throw error;

            const formattedClasses: ClassConfig[] = data.map(c => ({
                id: c.id.toString(),
                name: c.name,
                sections: c.sections,
                userId: c.user_id,
                subject: c.subject,
                institutionId: c.institution_id
            }));

            // Update State (Deduplicated)
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

            // Re-apply selection logic (incase new classes appeared)
            // Use ref to avoid circular dependency
            const currentSelectedId = selectedSeriesIdRef.current;
            const storedSeriesId = localStorage.getItem(`selectedSeriesId_${currentUser.id}_${activeInstitutionId || 'personal'}`);
            if (!currentSelectedId && uniqueClasses.length > 0) {
                if (storedSeriesId && uniqueClasses.find(c => c.id === storedSeriesId)) {
                    setSelectedSeriesId(storedSeriesId);
                    const storedSection = localStorage.getItem(`selectedSection_${currentUser.id}_${activeInstitutionId || 'personal'}`);
                    const target = uniqueClasses.find(c => c.id === storedSeriesId);
                    setSelectedSection(storedSection || (target?.sections[0] || 'A'));
                } else {
                    setSelectedSeriesId(uniqueClasses[0].id);
                    setSelectedSection(uniqueClasses[0].sections[0] || 'A');
                }
            } else if (currentSelectedId && !uniqueClasses.find(c => c.id === currentSelectedId)) {
                // Selection is no longer valid in this context (e.g. switched from personal to school)
                if (uniqueClasses.length > 0) {
                    setSelectedSeriesId(uniqueClasses[0].id);
                    setSelectedSection(uniqueClasses[0].sections[0] || 'A');
                } else {
                    setSelectedSeriesId('');
                    setSelectedSection('');
                }
            }

        } catch (e) {
            console.error("Network fetch classes failed", e);
        } finally {
            setLoading(false);
        }
    }, [currentUser, activeInstitutionId]);

    const selectSeries = useCallback((id: string) => {
        setSelectedSeriesId(id);
        if (currentUser) localStorage.setItem(`selectedSeriesId_${currentUser.id}`, id);

        // Access classes via functional state to avoid dependency on the array
        setClasses(prevClasses => {
            const target = prevClasses.find(c => c.id === id);
            if (target) {
                const currentSection = selectedSeriesIdRef.current ? selectedSection : '';
                if (currentSection && target.sections.includes(currentSection)) {
                    // keep current section
                } else if (target.sections.length > 0) {
                    setSelectedSection(target.sections[0]);
                    if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}`, target.sections[0]);
                } else {
                    setSelectedSection('');
                    if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}`, '');
                }
            }
            return prevClasses; // Don't mutate classes
        });
    }, [currentUser, selectedSection]);

    const selectSection = useCallback((section: string) => {
        setSelectedSection(section);
        if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}`, section);
    }, [currentUser]);

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

        const newSeries = {
            name,
            sections,
            user_id: currentUser.id,
            subject: activeSubject,
            institution_id: activeInstitutionId
        };

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
            subject: data.subject,
            institutionId: data.institution_id
        };

        setClasses(prev => [...prev, saved]);
        setSelectedSeriesId(saved.id);
        setSelectedSection('A');
    }, [currentUser, activeSubject]);

    const removeClass = useCallback(async (id: string) => {
        // Clean up related schedules first (safety net alongside CASCADE)
        await supabase.from('schedules').delete().eq('class_id', id);

        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Failed to remove class", error.message);
            throw new Error(error.message);
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
            // FIX: database expects BIGINT, ensure it's a number
            const seriesIdNum = parseInt(targetSeriesId, 10);

            const { error } = await supabase
                .from('students')
                .update({
                    series_id: seriesIdNum,
                    section: targetSection
                })
                .eq('id', studentId);

            if (error) {
                // Check for Unique Constraint Violation (Code 23505)
                // This happens if we transfer a legacy student (e.g. "01") to a class that already has "01"
                if (error.code === '23505') {
                    console.log("Collision detected. Generating new matricula for legacy student...");
                    // Generate new unique matricula (5-6 digits) to resolve collision
                    const newMatricula = Math.floor(10000 + Math.random() * 90000).toString();

                    const { error: retryError } = await supabase
                        .from('students')
                        .update({
                            series_id: seriesIdNum,
                            section: targetSection,
                            number: newMatricula // Update number to resolve collision
                        })
                        .eq('id', studentId);

                    if (retryError) throw retryError;
                    return true;
                }
                throw error;
            }
            return true;
        } catch (e) {
            console.error("Failed to transfer student", e);
            throw e;
        }
    }, []);

    const bulkTransferStudents = useCallback(async (studentIds: string[], targetSeriesId: string, targetSection: string) => {
        try {
            // FIX: database expects BIGINT, ensure it's a number
            const seriesIdNum = parseInt(targetSeriesId, 10);

            const { error } = await supabase
                .from('students')
                .update({
                    series_id: seriesIdNum,
                    section: targetSection
                })
                .in('id', studentIds);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to bulk transfer students", e);
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
        bulkTransferStudents,
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
        transferStudent,
        bulkTransferStudents
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
