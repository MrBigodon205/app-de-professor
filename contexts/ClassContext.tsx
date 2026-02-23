import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ClassConfig } from '../types';
import { supabase } from '../lib/supabase';

export interface VirtualGroup {
    id: string;
    name: string;
    classIds: string[];
}



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
    renameClass: (id: string, newName: string) => Promise<void>;
    removeClass: (id: string) => Promise<void>;
    addSection: (classId: string, section: string) => Promise<void>;
    removeSection: (classId: string, section: string) => Promise<void>;
    transferStudent: (studentId: string, targetSeriesId: string, targetSection: string) => Promise<boolean>;
    bulkTransferStudents: (studentIds: string[], targetSeriesId: string, targetSection: string) => Promise<boolean>;
    reorderClasses: (orderedIds: string[]) => void;
    // Virtual Groups
    virtualGroups: VirtualGroup[];
    createVirtualGroup: (name: string, classIds: string[]) => Promise<void>;
    renameVirtualGroup: (groupId: string, newName: string) => Promise<void>;
    deleteVirtualGroup: (groupId: string) => Promise<void>;
    addSeriesToGroup: (groupId: string, classId: string) => Promise<void>;
    removeSeriesFromGroup: (groupId: string, classId: string) => Promise<void>;
    refreshData: () => Promise<void>;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [classes, setClasses] = useState<ClassConfig[]>([]);
    const [virtualGroups, setVirtualGroups] = useState<VirtualGroup[]>([]);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    const { currentUser, activeSubject } = useAuth();

    const activeSeries = useMemo(() => classes.find(c => c.id === selectedSeriesId), [classes, selectedSeriesId]);

    // Ref to access selectedSeriesId inside fetchClasses without it being a dependency
    const selectedSeriesIdRef = useRef(selectedSeriesId);
    useEffect(() => { selectedSeriesIdRef.current = selectedSeriesId; }, [selectedSeriesId]);

    const location = useLocation();

    // Helper to extract ID - Memoized to prevent re-fetching on sub-route changes if ID stays same
    const activeInstitutionId = useMemo(() => {
        const match = location.pathname.match(/\/institution\/([a-f0-9-]+)/i);
        return match ? match[1] : null;
    }, [location.pathname]);

    // Persistent Save Effect - REMOVED: Now we save directly to Supabase in each action


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

            // Restore user custom order from localStorage
            const contextKey = activeInstitutionId || 'personal';
            const orderKey = `classOrder_${currentUser.id}_${contextKey}`;
            const savedOrderStr = localStorage.getItem(orderKey);

            if (savedOrderStr) {
                try {
                    const savedOrder: string[] = JSON.parse(savedOrderStr);
                    // Sort uniqueClasses according to savedOrder, new classes go to the end
                    uniqueClasses.sort((a, b) => {
                        const indexA = savedOrder.indexOf(a.id);
                        const indexB = savedOrder.indexOf(b.id);

                        if (indexA === -1 && indexB === -1) return 0; // Both new
                        if (indexA === -1) return 1; // A is new, goes to bottom
                        if (indexB === -1) return -1; // B is new, goes to bottom
                        return indexA - indexB;
                    });
                } catch (e) {
                    console.error("Failed to parse saved class order", e);
                }
            }

            // Restore Virtual Groups from Supabase (Cloud Sync)
            const { data: cloudGroups, error: cloudError } = await supabase
                .from('virtual_groups')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('context_key', contextKey);

            if (cloudError) {
                console.error("[ClassContext] Failed to load virtual groups from cloud", cloudError);
            }

            let finalGroups: VirtualGroup[] = [];

            if (cloudGroups && cloudGroups.length > 0) {
                console.info(`[ClassContext] Loaded ${cloudGroups.length} groups from Supabase`);
                finalGroups = cloudGroups.map(g => ({
                    id: g.id,
                    name: g.name,
                    classIds: g.class_ids
                }));
            } else {
                // No groups in cloud, check localStorage for migration
                const groupsKey = `classGroups_${currentUser.id}_${contextKey}`;
                const savedGroupsStr = localStorage.getItem(groupsKey);

                if (savedGroupsStr) {
                    try {
                        const localGroups: VirtualGroup[] = JSON.parse(savedGroupsStr);
                        if (localGroups.length > 0) {
                            console.info(`[ClassContext] Migrating ${localGroups.length} local groups to cloud...`);

                            // Upload to Supabase
                            const toUpload = localGroups.map(lg => ({
                                user_id: currentUser.id,
                                name: lg.name,
                                context_key: contextKey,
                                class_ids: lg.classIds
                            }));

                            const { data: uploaded, error: uploadErr } = await supabase
                                .from('virtual_groups')
                                .insert(toUpload)
                                .select();

                            if (!uploadErr && uploaded) {
                                finalGroups = uploaded.map(g => ({
                                    id: g.id,
                                    name: g.name,
                                    classIds: g.class_ids
                                }));
                                console.info("[ClassContext] Migration successful");
                                // Clear localStorage migration flag/data if desired? 
                                // Better keep it for safety but we now have cloud as source of truth
                            }
                        }
                    } catch (e) {
                        console.error("[ClassContext] Failed to migrate local groups", e);
                    }
                }
            }

            // Filter out classIds that no longer exist in uniqueClasses
            const cleanedGroups = finalGroups.map(g => ({
                ...g,
                classIds: g.classIds.filter(id => uniqueClasses.some(c => c.id === id))
            })).filter(g => g.classIds.length > 0);

            setVirtualGroups(cleanedGroups);
            setIsHydrated(true);

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

    useEffect(() => {
        if (currentUser && activeSubject) {
            fetchClasses();
        } else if (currentUser && !activeSubject) {
            // Wait for activeSubject to be set
        } else {
            setClasses([]);
            setLoading(false);
        }
    }, [currentUser, activeSubject, fetchClasses]);

    const selectSeries = useCallback((id: string) => {
        const contextKey = activeInstitutionId || 'personal';
        setSelectedSeriesId(id);
        if (currentUser) localStorage.setItem(`selectedSeriesId_${currentUser.id}_${contextKey}`, id);

        // Access classes via functional state to avoid dependency on the array
        setClasses(prevClasses => {
            const target = prevClasses.find(c => c.id === id);
            if (target) {
                const currentSection = selectedSeriesIdRef.current ? selectedSection : '';
                if (currentSection && target.sections.includes(currentSection)) {
                    // keep current section
                } else if (target.sections.length > 0) {
                    setSelectedSection(target.sections[0]);
                    if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}_${contextKey}`, target.sections[0]);
                } else {
                    setSelectedSection('');
                    if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}_${contextKey}`, '');
                }
            }
            return prevClasses; // Don't mutate classes
        });
    }, [currentUser, selectedSection]);

    const selectSection = useCallback((section: string) => {
        const contextKey = activeInstitutionId || 'personal';
        setSelectedSection(section);
        if (currentUser) localStorage.setItem(`selectedSection_${currentUser.id}_${contextKey}`, section);
    }, [currentUser, activeInstitutionId]);

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

    const renameClass = useCallback(async (id: string, newName: string) => {
        if (!newName.trim()) return;

        const { error } = await supabase
            .from('classes')
            .update({ name: newName.trim() })
            .eq('id', id);

        if (error) {
            console.error("Failed to rename class", error.message);
            throw new Error(error.message);
        }

        setClasses(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
    }, []);

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

    const reorderClasses = useCallback((orderedIds: string[]) => {
        if (!currentUser) return;

        const contextKey = activeInstitutionId || 'personal';
        const orderKey = `classOrder_${currentUser.id}_${contextKey}`;

        // Save to local storage
        localStorage.setItem(orderKey, JSON.stringify(orderedIds));

        // Optimistically apply the new order visually
        setClasses(prevClasses => {
            const nextClasses = [...prevClasses];
            nextClasses.sort((a, b) => {
                const indexA = orderedIds.indexOf(a.id);
                const indexB = orderedIds.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
            return nextClasses;
        });
    }, [currentUser, activeInstitutionId]);

    // Virtual Group Functions (Sync with Supabase)
    const createVirtualGroup = useCallback(async (name: string, classIds: string[]) => {
        if (!currentUser) return;
        const tempId = `temp-${Date.now()}`;
        const contextKey = activeInstitutionId || 'personal';

        // Optimistic Update
        setVirtualGroups(prev => [...prev, {
            id: tempId,
            name,
            classIds: classIds
        }]);

        console.info(`[ClassContext] Creating virtual group "${name}" in cloud`);
        const { data, error } = await supabase
            .from('virtual_groups')
            .insert({
                user_id: currentUser.id,
                name,
                context_key: contextKey,
                class_ids: classIds
            })
            .select()
            .single();

        if (error) {
            console.error("[ClassContext] Failed to create virtual group in cloud", error);
            // Rollback
            setVirtualGroups(prev => prev.filter(g => g.id !== tempId));
            // Show alert to user
            alert("Erro ao salvar grupo na nuvem. Verifique sua conexão.");
            return;
        }

        if (data) {
            console.info(`[ClassContext] Group created with ID: ${data.id}`);
            // Replace temp ID with real ID
            setVirtualGroups(prev => prev.map(g => g.id === tempId ? { ...g, id: data.id } : g));
        }
    }, [currentUser, activeInstitutionId]);

    const renameVirtualGroup = useCallback(async (groupId: string, newName: string) => {
        if (!currentUser) return;
        // Prevent action on temp IDs
        if (groupId.startsWith('temp-')) {
            console.warn("[ClassContext] Cannot rename group while syncing...");
            return;
        }

        const oldGroups = [...virtualGroups];
        setVirtualGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));

        const { error } = await supabase
            .from('virtual_groups')
            .update({ name: newName })
            .eq('id', groupId);

        if (error) {
            console.error("[ClassContext] Failed to rename group in cloud", error);
            setVirtualGroups(oldGroups);
            return;
        }
    }, [currentUser, virtualGroups]);

    const deleteVirtualGroup = useCallback(async (groupId: string) => {
        if (!currentUser) return;
        if (groupId.startsWith('temp-')) return; // Ignore delete on unsynced items

        const oldGroups = [...virtualGroups];
        setVirtualGroups(prev => prev.filter(g => g.id !== groupId));

        const { error } = await supabase
            .from('virtual_groups')
            .delete()
            .eq('id', groupId);

        if (error) {
            console.error("[ClassContext] Failed to delete group in cloud", error);
            setVirtualGroups(oldGroups);
            return;
        }
    }, [currentUser, virtualGroups]);

    const addSeriesToGroup = useCallback(async (groupId: string, classId: string) => {
        if (!currentUser) return;
        if (groupId.startsWith('temp-')) {
            console.warn("[ClassContext] Please wait for group to sync before adding more series.");
            return;
        }

        const group = virtualGroups.find(g => g.id === groupId);
        if (!group || group.classIds.includes(classId)) return;

        const nextClassIds = [...group.classIds, classId];
        const oldGroups = [...virtualGroups];

        setVirtualGroups(prev => prev.map(g => g.id === groupId ? { ...g, classIds: nextClassIds } : g));

        const { error } = await supabase
            .from('virtual_groups')
            .update({ class_ids: nextClassIds })
            .eq('id', groupId);

        if (error) {
            console.error("[ClassContext] Failed to add series to group in cloud", error);
            setVirtualGroups(oldGroups);
            return;
        }
    }, [currentUser, virtualGroups]);

    const removeSeriesFromGroup = useCallback(async (groupId: string, classId: string) => {
        if (!currentUser) return;
        if (groupId.startsWith('temp-')) return;

        const group = virtualGroups.find(g => g.id === groupId);
        if (!group) return;

        const nextClassIds = group.classIds.filter(id => id !== classId);
        const oldGroups = [...virtualGroups];

        if (nextClassIds.length === 0) {
            await deleteVirtualGroup(groupId);
            return;
        }

        setVirtualGroups(prev => prev.map(g => g.id === groupId ? { ...g, classIds: nextClassIds } : g));

        const { error } = await supabase
            .from('virtual_groups')
            .update({ class_ids: nextClassIds })
            .eq('id', groupId);

        if (error) {
            console.error("[ClassContext] Failed to remove series from group in cloud", error);
            setVirtualGroups(oldGroups);
            return;
        }
    }, [currentUser, virtualGroups, deleteVirtualGroup]);

    const contextValue = useMemo(() => ({
        classes,
        selectedSeriesId,
        selectedSection,
        activeSeries,
        loading,
        virtualGroups,
        fetchClasses,
        selectSeries,
        selectSection,
        addClass,
        renameClass,
        removeClass,
        addSection,
        removeSection,
        transferStudent,
        bulkTransferStudents,
        reorderClasses,
        createVirtualGroup,
        renameVirtualGroup,
        deleteVirtualGroup,
        addSeriesToGroup,
        removeSeriesFromGroup,
        refreshData: fetchClasses
    }), [
        classes,
        selectedSeriesId,
        selectedSection,
        activeSeries,
        loading,
        virtualGroups,
        fetchClasses,
        selectSeries,
        selectSection,
        addClass,
        renameClass,
        removeClass,
        addSection,
        removeSection,
        transferStudent,
        bulkTransferStudents,
        reorderClasses,
        createVirtualGroup,
        renameVirtualGroup,
        deleteVirtualGroup,
        addSeriesToGroup,
        removeSeriesFromGroup
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
