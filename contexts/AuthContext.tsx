import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, Subject } from '../types';
import { supabase } from '../lib/supabase';
import { seedUserData } from '../utils/seeding';

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSubject, setActiveSubject] = useState<string>('');
    const [profileChannel, setProfileChannel] = useState<any>(null);

    // Local API fallback logic removed to ensure Single Source of Truth from Supabase


    // Helper to race a promise against a timeout
    const withTimeout = useCallback(<T,>(promise: PromiseLike<T>, ms: number, label: string): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} expirou`)), ms))
        ]);
    }, []);

    const fetchProfile = useCallback(async (uid: string, authUser?: any) => {
        // Raw Fetch Helper for Profile
        const rawProfileFetch = async () => {
            // ... (rest of rawProfileFetch)
            const supabaseUrl = (supabase as any).supabaseUrl;
            const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=*`, {
                method: 'GET',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                }
            });

            if (!response.ok) throw new Error('Falha no Raw Fetch Profile');
            const data = await response.json();
            return data && data.length > 0 ? data[0] : null;
        };

        try {
            let profile = null;
            // 1. Try SDK (with timeout)
            try {
                const { data, error } = await withTimeout(
                    supabase.from('profiles').select('*').eq('id', uid).single(),
                    8000,
                    "Busca de Perfil"
                );
                if (error) throw error;
                profile = data;
            } catch (e) {
                try {
                    profile = await withTimeout(rawProfileFetch(), 6000, "Raw Profile Fetch");
                } catch (rawErr) {
                    console.warn("Raw fetch also failed/timed out", rawErr);
                }
            }

            if (profile) {
                // Determine isPasswordSet from User Metadata (primary) or Legacy Providers (fallback)
                let hasPasswordConfirmed = false;

                // 1. Check User Metadata (New Standard)
                if (authUser?.user_metadata?.is_password_set === true) {
                    hasPasswordConfirmed = true;
                }
                // 2. Fallback: Check Providers (Legacy Google Users w/ Password)
                else if (authUser) {
                    const providers = authUser.app_metadata?.providers || [];
                    if (providers.includes('email')) {
                        hasPasswordConfirmed = true;
                        // Self-healing: Save to metadata for future speed
                        supabase.auth.updateUser({ data: { is_password_set: true } });
                    }
                }

                const finalUser: User = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    photoUrl: profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    subject: profile.subject,
                    subjects: profile.subjects || [],
                    isPasswordSet: hasPasswordConfirmed
                };

                localStorage.setItem(`cached_profile_${finalUser.id}`, JSON.stringify(finalUser));

                setCurrentUser(prev => {
                    if (prev && JSON.stringify(prev) === JSON.stringify(finalUser)) {
                        return prev;
                    }
                    return finalUser;
                });

                setUserId(finalUser.id);

                const storedSubject = localStorage.getItem(`activeSubject_${finalUser.id}`);
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
    }, [withTimeout]);

    // ... (initSession logic remains similar, clipped for brevity)
    // We only need to touch the parts that deal with isPasswordSet

    const register = useCallback(async (name: string, email: string, password: string, subject: Subject, subjects: Subject[] = []) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/#/login`,
                    data: {
                        name,
                        subject,
                        subjects,
                        is_password_set: true // Save to User Metadata immediately
                    }
                }
            });

            if (error) {
                // ... (error handling)
                if (error.message.includes("already registered")) return { success: false, error: "Este e-mail já está cadastrado." };
                return { success: false, error: error.message };
            }

            if (data.user) {
                await seedUserData(data.user.id);

                // Update Profile Table (WITHOUT is_password_set)
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        name: name,
                        subject: subject,
                        subjects: subjects
                        // is_password_set REMOVED
                    })
                    .eq('id', data.user.id);

                if (profileError) console.warn("Manual profile update failed:", profileError);

                return { success: true };
            }

            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            console.error("Registration error:", e);
            return { success: false, error: e.message || "Erro ao realizar o cadastro." };
        }
    }, []);

    // updateProfile modified to split metadata vs profile table
    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!userId) {
            console.error("Falha ao atualizar perfil: userId não encontrado");
            return false;
        }

        try {
            // 1. Update Password (Auth)
            if (data.password) {
                const { error: authError } = await supabase.auth.updateUser({ password: data.password });
                if (authError) throw authError;
            }

            // 2. Update IsPasswordSet Flag (User Metadata)
            if (data.isPasswordSet === true) {
                await supabase.auth.updateUser({
                    data: { is_password_set: true }
                });
            }

            // 3. Update Profile Table (Standard Fields)
            const profileUpdate: any = {};
            if (Object.prototype.hasOwnProperty.call(data, 'name')) profileUpdate.name = data.name;
            if (Object.prototype.hasOwnProperty.call(data, 'subject')) profileUpdate.subject = data.subject;
            if (Object.prototype.hasOwnProperty.call(data, 'photoUrl')) profileUpdate.photo_url = data.photoUrl;
            if (Object.prototype.hasOwnProperty.call(data, 'subjects')) profileUpdate.subjects = data.subjects;
            if (Object.prototype.hasOwnProperty.call(data, 'email')) profileUpdate.email = data.email;
            // is_password_set REMOVED from here

            if (Object.keys(profileUpdate).length > 0) {
                const { error } = await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', userId);
                if (error) throw error;
            }

            // 4. Update Local State
            const { password, ...cleanData } = data;
            const newState = currentUser ? { ...currentUser, ...cleanData } : null;
            if (newState) {
                if (!newState.id) newState.id = userId;
                setCurrentUser(newState as User);

                if (data.subject) {
                    setActiveSubject(data.subject);
                    localStorage.setItem('active_subject', data.subject);
                }
            }

            return true;
        } catch (e: any) {
            console.error("Falha ao atualizar perfil", e);
            alert(`Erro ao atualizar perfil: ${e.message || 'Erro desconhecido'}`);
            return false;
        }
    }, [userId, currentUser]);

    const completeRegistration = useCallback(async (name: string, password: string, subject: Subject, subjects: Subject[]) => {
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        try {
            // 1. Update Password
            const { error: passError } = await supabase.auth.updateUser({ password });
            if (passError) throw passError;

            // 2. Update Profile
            await updateProfile({
                name,
                subject,
                subjects,
                isPasswordSet: true // Important
            });

            return { success: true };
        } catch (e: any) {
            console.error("Complete registration error:", e);
            return { success: false, error: e.message || "Erro ao completar cadastro." };
        }
    }, [userId, updateProfile]);

    const resetPassword = useCallback(async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/`,
            });
            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            console.error("Reset password failed:", e);
            return { success: false, error: e.message || "Erro ao enviar e-mail de recuperação." };
        }
    }, []);

    const updatePassword = useCallback(async (password: string) => {
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            return { success: true };
        } catch (e: any) {
            console.error("Erro ao atualizar senha:", e);
            let msg = e.message;
            if (msg === 'New password should be different from the old password.') {
                msg = 'A nova senha deve ser diferente da senha antiga.';
            }
            return { success: false, error: msg || "Erro ao atualizar senha." };
        }
    }, []);

    const updateActiveSubject = useCallback((subject: string) => {
        setActiveSubject(subject);
        if (userId) {
            localStorage.setItem(`activeSubject_${userId}`, subject);
        }
    }, [userId]);

    const contextValue = useMemo(() => ({
        currentUser,
        userId,
        login,
        register,
        logout,
        updateProfile,
        resetPassword,
        updatePassword,
        loading,
        activeSubject,
        updateActiveSubject
    }), [currentUser, userId, login, register, logout, updateProfile, loading, activeSubject, updateActiveSubject]);

    // CRITICAL FIX: Do not render Router (children) until Auth is determined.
    // This prevents HashRouter from stripping the OAuth hash before Supabase can read it.
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">
                        Iniciando sistema...
                    </div>
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
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
