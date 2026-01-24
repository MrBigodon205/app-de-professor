import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface OfflineContextType {
    isOnline: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
    forceSync: () => Promise<void>;
    addStudent: (student: any) => Promise<void>;
    updateStudent: (id: string, updates: any) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { userId } = useAuth();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    // 1. Detect Online/Offline Status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            triggerSync(); // Auto-sync when back online
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 2. The Great Sync Engine (Simplified for POC)
    const triggerSync = async () => {
        if (!userId || !navigator.onLine) return;
        setSyncStatus('syncing');

        try {
            console.log("🔄 Starting Sync...");

            // A. PULL: Get latest students from Supabase
            const { data: serverStudents, error } = await supabase
                .from('students')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;

            if (serverStudents) {
                // Bulk put into Dexie (Overwrite local with server truth for now)
                const studentsToSave = serverStudents.map(s => ({
                    id: s.id,
                    name: s.name,
                    number: s.number,
                    seriesId: s.series_id?.toString(),
                    section: s.section,
                    userId: s.user_id,
                    syncStatus: 'synced',
                    updatedAt: new Date().toISOString()
                }));

                // Transaction to ensure safety
                await db.transaction('rw', db.students, async () => {
                    await db.students.bulkPut(studentsToSave as any);
                });
                console.log(`✅ Pulled ${serverStudents.length} students from cloud.`);
            }

            setSyncStatus('idle');
        } catch (e) {
            console.error("Sync failed:", e);
            setSyncStatus('error');
        }
    };

    // Initial Sync on mount
    useEffect(() => {
        if (userId) triggerSync();
    }, [userId]);

    // 3. CRUD Helpers (The "Write" Logic)
    const addStudent = async (studentData: any) => {
        // 1. Optimistic Local Save
        const newStudent = {
            ...studentData,
            syncStatus: isOnline ? 'synced' : 'pending_create',
            updatedAt: new Date().toISOString()
        };
        await db.students.add(newStudent);

        // 2. Try Remote if Online
        if (isOnline && userId) {
            try {
                // remove local-only fields before sending
                const { syncStatus, updatedAt, id, ...remoteData } = newStudent;
                // Supabase expects specific structure, map it back if needed or send clean object
                // For now assuming studentData matches supabase schema mostly
                const { error } = await supabase.from('students').insert({ ...remoteData, id: newStudent.id });
                if (error) throw error;
            } catch (e) {
                console.warn("Offline fallback: Saved locally, will sync later.");
                await db.students.update(newStudent.id, { syncStatus: 'pending_create' });
            }
        }
    };

    const updateStudent = async (id: string, updates: any) => {
        await db.students.update(id, { ...updates, syncStatus: isOnline ? 'synced' : 'pending_update', updatedAt: new Date().toISOString() });

        if (isOnline) {
            try {
                const { error } = await supabase.from('students').update(updates).eq('id', id);
                if (error) throw error;
            } catch (e) {
                await db.students.update(id, { syncStatus: 'pending_update' });
            }
        }
    };

    const deleteStudent = async (id: string) => {
        await db.students.update(id, { syncStatus: 'pending_delete' }); // Soft delete locally first to track

        if (isOnline) {
            try {
                await supabase.from('students').delete().eq('id', id);
                await db.students.delete(id); // Hard delete if successful
            } catch (e) {
                console.warn("Delete pending sync");
            }
        } else {
            // If offline, keep it strictly for sync (we filter out pending_delete in UI)
        }
    };

    return (
        <OfflineContext.Provider value={{ isOnline, syncStatus, forceSync: triggerSync, addStudent, updateStudent, deleteStudent }}>
            {children}

            {/* Debug Indicator */}
            <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full font-bold text-xs z-50 shadow-lg flex items-center gap-2 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`size-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {isOnline ? 'Online' : 'Offline Mode'}
                {syncStatus === 'syncing' && <span className="animate-spin material-symbols-outlined text-xs">sync</span>}
            </div>
        </OfflineContext.Provider>
    );
};

export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) throw new Error("useOffline must be used within OfflineProvider");
    return context;
};
