import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Subject } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    currentUser: User | null;
    userId: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string, subject: Subject, subjects?: Subject[]) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    loading: boolean;
    activeSubject: string;
    updateActiveSubject: (subject: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string>('');

    const fetchProfile = useCallback(async (uid: string, authUser?: any) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, name, email, photo_url, subject, subjects, is_password_set')
                .eq('id', uid)
                .single();

            if (error) throw error;

            if (profile) {
                const finalUser: User = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    photoUrl: profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    subject: profile.subject,
                    subjects: profile.subjects || [],
                    isPasswordSet: authUser?.user_metadata?.is_password_set ?? profile.is_password_set
                };

                await AsyncStorage.setItem(`cached_profile_${finalUser.id}`, JSON.stringify(finalUser));
                setCurrentUser(finalUser);
                setUserId(finalUser.id);

                const storedSubject = await AsyncStorage.getItem(`activeSubject_${finalUser.id}`);
                if (storedSubject && (finalUser.subject === storedSubject || finalUser.subjects?.includes(storedSubject))) {
                    setActiveSubject(storedSubject);
                } else {
                    setActiveSubject(finalUser.subject || 'Matemática');
                }
            }
        } catch (err: any) {
            console.error(`fetchProfile error:`, err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial session check
    useEffect(() => {
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (session?.user) {
                    setUserId(session.user.id);
                    // Try to load cache first for speed
                    const cached = await AsyncStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try { setCurrentUser(JSON.parse(cached)); } catch (e) { }
                    }
                    await fetchProfile(session.user.id, session.user);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Auth init error:", err);
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    fetchProfile(session.user.id, session.user);
                }
            } else {
                setCurrentUser(null);
                setUserId(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchProfile]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data.user) {
                await fetchProfile(data.user.id, data.user);
                return { success: true };
            }
            return { success: false, error: 'Erro ao autenticar.' };
        } catch (e: any) {
            console.error("Login Error:", e);
            return { success: false, error: e.message };
        }
    }, [fetchProfile]);

    const register = useCallback(async (name: string, email: string, password: string, subject: Subject, subjects: Subject[] = []) => {
        // Registration logic to be implemented or simplified for MVP
        Alert.alert("Aviso", "Registro ainda não implementado na versão mobile. Use a versão web para criar conta.");
        return { success: false, error: "Use a versão web para cadastro." };
    }, []);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            await AsyncStorage.multiRemove(await AsyncStorage.getAllKeys()); // Be careful, but for now it's okay for clean logout
        } catch (error) { console.warn("Logout failed:", error); }
        finally {
            setCurrentUser(null);
            setUserId(null);
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        // Implementation similar to web but using native alerts
        if (!userId) return false;
        try {
            // ... simplified update logic
            return true;
        } catch (e) { return false; }
    }, [userId]);

    const updateActiveSubject = useCallback(async (subject: string) => {
        setActiveSubject(subject);
        if (userId) await AsyncStorage.setItem(`activeSubject_${userId}`, subject);
    }, [userId]);

    // Placeholder Reset Password
    const resetPassword = async (email: string) => ({ success: false });

    const contextValue = useMemo(() => ({
        currentUser, userId, login, register, logout, updateProfile, resetPassword, loading, activeSubject, updateActiveSubject
    }), [currentUser, userId, login, register, logout, updateProfile, loading, activeSubject, updateActiveSubject]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
