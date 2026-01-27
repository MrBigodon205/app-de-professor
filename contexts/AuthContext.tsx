import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { User, Subject } from '../types';
import { supabase } from '../lib/supabase';
import { seedUserData } from '../utils/seeding';

// --- TYPES & INTERFACES ---
interface AuthContextType {
    currentUser: User | null;
    userId: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string, subject: Subject, subjects?: Subject[]) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateProfile: (data: Partial<User>) => Promise<boolean>;
    resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    completeRegistration: (name: string, password: string, subject: Subject, subjects: Subject[]) => Promise<{ success: boolean; error?: string }>;
    loading: boolean;
    activeSubject: string;
    updateActiveSubject: (subject: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AUTH PROVIDER COMPONENT ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Standard Web State Initialization
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string>(() => localStorage.getItem('last_active_subject') || '');

    // --- PROFILE FETCHING (With Offline Fallback) ---
    const fetchProfile = useCallback(async (uid: string, authUser?: any) => {
        try {
            // 1. Try Network Fetch first (Standard Web)
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, name, email, photo_url, subject, subjects') // OPTIMIZATION: Select only needed columns
                .eq('id', uid)
                .single();

            if (profile) {
                // Determine hasPassword from metadata
                const hasPasswordConfirmed = authUser?.user_metadata?.is_password_set === true ||
                    authUser?.app_metadata?.providers?.includes('email');

                const finalUser: User = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    photoUrl: profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    subject: profile.subject,
                    subjects: profile.subjects || [],
                    isPasswordSet: hasPasswordConfirmed
                };

                // SUCCESS: Save to State AND Cache
                setCurrentUser(finalUser);
                setUserId(finalUser.id);
                localStorage.setItem(`offline_profile_${finalUser.id}`, JSON.stringify(finalUser));

                // Handle Subject Persistence
                const storedSubject = localStorage.getItem('last_active_subject');
                if (!storedSubject || (finalUser.subject !== storedSubject && !finalUser.subjects?.includes(storedSubject))) {
                    const defaultSubject = finalUser.subject || 'Matemática';
                    setActiveSubject(defaultSubject);
                    localStorage.setItem('last_active_subject', defaultSubject);
                }
            }
        } catch (err) {
            console.warn("Fetch profile failed (likely offline). Trying cache...", err);
            // 2. OFFLINE FALLBACK: Load from Cache
            try {
                const cached = localStorage.getItem(`offline_profile_${uid}`);
                if (cached) {
                    const savedUser = JSON.parse(cached);
                    console.log("Restored user from offline cache:", savedUser.name);
                    setCurrentUser(savedUser);
                    setUserId(savedUser.id);
                }
            } catch (e) {
                console.error("Offline cache restore failed:", e);
            }
        }
    }, []);

    // --- INITIALIZATION EFFECT (STANDARD WEB) ---
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                // IMMEDIATE CACHE CHECK: If we have a user in localStorage, restore it INSTANTLY
                // This removes the "white screen" or "spinner" delay entirely for repeat users
                const lastUserId = localStorage.getItem('last_user_id');
                if (lastUserId) {
                    try {
                        const cached = localStorage.getItem(`offline_profile_${lastUserId}`);
                        if (cached) {
                            const savedUser = JSON.parse(cached);
                            if (mounted) {
                                console.log("⚡ Instant Cache Restore:", savedUser.name);
                                setCurrentUser(savedUser);
                                setUserId(savedUser.id);
                                setLoading(false); // Unblock UI immediately

                                const storedSubject = localStorage.getItem('last_active_subject');
                                if (storedSubject) setActiveSubject(storedSubject);
                            }
                        }
                    } catch (e) { console.warn("Cache restore error", e); }
                }

                // CHECK NETWORK STATUS
                if (!navigator.onLine) {
                    console.warn("Offline mode detected at startup.");
                    if (mounted) setLoading(false);
                    return;
                }

                // ASYNC SUPABASE CHECK (Background)
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session?.user) {
                    if (mounted) {
                        setUserId(session.user.id);
                        localStorage.setItem('last_user_id', session.user.id);
                        // Fetch fresh profile in background
                        await fetchProfile(session.user.id, session.user);
                    }
                } else if (!lastUserId) {
                    // Only stop loading if we didn't have a cached user. 
                    // If we had a cached user, we stay logged in until explicit sign out or failure.
                    if (mounted) {
                        setCurrentUser(null);
                        setUserId(null);
                    }
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    // Update fresh data
                    localStorage.setItem('last_user_id', session.user.id);
                    fetchProfile(session.user.id, session.user);
                } else if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
                    fetchProfile(session.user.id, session.user);
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setUserId(null);
                localStorage.removeItem('last_user_id');
                if (mounted) setLoading(false);
            }
        });

        initSession();

        return () => {
            mounted = false;
            subscription.data.subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // --- ACTIONS ---

    const login = useCallback(async (email: string, password: string) => {
        if (!navigator.onLine) {
            return { success: false, error: "Você está offline. Conecte-se para entrar." };
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            console.error("Login error:", e);
            return { success: false, error: e.message || "Erro ao realizar login." };
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string, subject: Subject, subjects: Subject[] = []) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name, subject, subjects, is_password_set: true }
                }
            });

            if (error) return { success: false, error: error.message };

            if (data.user) {
                await seedUserData(data.user.id);
                try {
                    await supabase.from('profiles').update({ name, subject, subjects }).eq('id', data.user.id);
                } catch { }
                return { success: true };
            }
            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setUserId(null);
            // Optional: window.location.reload() if you want a full refresh
        } catch (e) {
            console.error("Logout error", e);
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!userId) return false;
        try {
            // 1. Update Password if provided
            if (data.password) {
                const { error } = await supabase.auth.updateUser({ password: data.password });
                if (error) throw error;
            }

            // 2. Sync Metadata (is_password_set)
            if (data.isPasswordSet === true) {
                const { error: metaError } = await supabase.auth.updateUser({
                    data: { is_password_set: true }
                });
                if (metaError) console.warn("Failed to sync auth metadata:", metaError);
            }

            // 3. Update Profile Table
            const updates: any = {};
            if (data.name) updates.name = data.name;
            if (data.subject) updates.subject = data.subject;
            if (data.subjects) updates.subjects = data.subjects;
            if (data.photoUrl) updates.photo_url = data.photoUrl;

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
                if (error) throw error;
            }

            setCurrentUser(prev => prev ? ({ ...prev, ...data }) : null);
            return true;
        } catch (e: any) {
            alert(`Erro ao atualizar: ${e.message}`);
            return false;
        }
    }, [userId]);

    // Stubs
    const resetPassword = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        return { success: !error, error: error?.message };
    }, []);

    const updatePassword = useCallback(async (password: string) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { success: !error, error: error?.message };
    }, []);

    const completeRegistration = useCallback(async (name: string, password: string, subject: Subject, subjects: Subject[]) => {
        return register(name, "placeholder", password, subject, subjects);
    }, [register]);

    const completeRegistrationReal = useCallback(async (name: string, password: string, subject: Subject, subjects: Subject[]) => {
        if (!userId) return { success: false, error: "Não autenticado" };
        try {
            // Updated to use both password AND data update
            const { error: authError } = await supabase.auth.updateUser({
                password,
                data: { is_password_set: true }
            });
            if (authError) throw authError;

            await updateProfile({ name, subject, subjects, isPasswordSet: true });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, [userId, updateProfile]);

    const updateActiveSubjectWrapper = useCallback((subject: string) => {
        setActiveSubject(subject);
        localStorage.setItem('last_active_subject', subject);
    }, []);

    const contextValue = useMemo(() => ({
        currentUser, userId,
        login, register, logout,
        updateProfile, resetPassword, updatePassword,
        completeRegistration: completeRegistrationReal,
        loading, activeSubject, updateActiveSubject: updateActiveSubjectWrapper
    }), [currentUser, userId, login, register, logout, updateProfile, resetPassword, updatePassword, completeRegistrationReal, loading, activeSubject, updateActiveSubjectWrapper]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

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
