import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { User, Subject } from '../types';
import { supabase } from '../lib/supabase';
import { seedUserData } from '../utils/seeding';

// --- TYPES & INTERFACES ---
interface AuthContextType {
    currentUser: User | null;
    userId: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: any }>;
    register: (name: string, email: string, password: string, subject?: string, subjects?: string[], institutionName?: string) => Promise<{ success: boolean; error?: string; institutionId?: string; user?: any }>;
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

// --- ERROR TRANSLATION HELPER ---
const translateAuthError = (errorMsg: string): string => {
    // Normalizing
    const msg = errorMsg.toLowerCase();

    if (msg.includes('email not confirmed')) return 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
    if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('user already registered')) return 'Este e-mail já está cadastrado.';
    if (msg.includes('password should be at least 6 characters')) return 'A senha precisa ter no mínimo 6 caracteres.';
    if (msg.includes('auth session missing')) return 'Sessão expirada. Faça login novamente.';
    if (msg.includes('rate limit exceeded')) return 'Muitas tentativas. Aguarde um momento.';

    // Default fallback (if it's a raw generic error, try to be helpful or keep original if specific)
    return errorMsg;
};

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
            // Get freshest auth user if not provided
            let freshAuthUser = authUser;
            if (!freshAuthUser || !freshAuthUser.user_metadata) {
                const { data } = await supabase.auth.getUser();
                if (data.user) freshAuthUser = data.user;
            }

            // 1. Fetch from Supabase
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, name, email, photo_url, subject, subjects, account_type')
                .eq('id', uid)
                .single();

            if (profile) {
                const isEmailUser = freshAuthUser?.app_metadata?.providers?.includes('email');
                const isPasswordSetInMeta = freshAuthUser?.user_metadata?.is_password_set === true;
                const hasPasswordConfirmed = isEmailUser || isPasswordSetInMeta;

                const finalUser: User = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    photoUrl: profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    subject: profile.subject,
                    subjects: profile.subjects || [],
                    isPasswordSet: !!hasPasswordConfirmed,
                    account_type: profile.account_type || 'personal'
                };

                setCurrentUser(finalUser);
                setUserId(finalUser.id);

                // Handle Subject Persistence
                const storedSubject = localStorage.getItem('last_active_subject');
                if (!storedSubject || (finalUser.subject !== storedSubject && !finalUser.subjects?.includes(storedSubject))) {
                    const defaultSubject = finalUser.subject || 'Matemática';
                    setActiveSubject(defaultSubject);
                    localStorage.setItem('last_active_subject', defaultSubject);
                }
            }
        } catch (err) {
            console.error("Fetch profile failed:", err);
        }
    }, []);

    // --- INITIALIZATION EFFECT (STANDARD WEB) ---
    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    if (mounted) {
                        setUserId(session.user.id);
                        await fetchProfile(session.user.id, session.user);
                    }
                } else {
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
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (data.user) {
                // Critical: Wait for profile to be loaded before returning success
                await fetchProfile(data.user.id, data.user);
            }

            return { success: true, user: data.user };
        } catch (e: any) {
            console.error("Login error:", e);
            const translated = translateAuthError(e.message || "Erro ao realizar login.");
            return { success: false, error: translated };
        } finally {
            setLoading(false);
        }
    }, [fetchProfile]);

    const register = useCallback(async (name: string, email: string, password: string, subject?: string, subjects?: string[], institutionName?: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        subject,
                        subjects,
                        is_password_set: true,
                        account_type: institutionName ? 'institutional' : 'personal'
                    }
                }
            });

            if (error) return { success: false, error: translateAuthError(error.message) };

            if (data.user) {
                await seedUserData(data.user.id);

                // Update profile
                try {
                    await supabase.from('profiles').update({
                        name,
                        subject,
                        subjects,
                        account_type: institutionName ? 'institutional' : 'personal'
                    }).eq('id', data.user.id);
                } catch { }

                // Create Institution if requested
                if (institutionName) {
                    console.log('[AuthContext] Creating institution:', institutionName, 'for user:', data.user.id);
                    try {
                        // 1. Create Institution
                        const { data: instData, error: instError } = await supabase
                            .from('institutions')
                            .insert({
                                name: institutionName,
                                owner_id: data.user.id
                            })
                            .select()
                            .single();

                        console.log('[AuthContext] Institution insert result:', { instData, instError });
                        if (instError) throw instError;

                        // 2. Add owner as Admin member
                        if (instData) {
                            console.log('[AuthContext] Adding user as admin to institution_teachers...');
                            const { error: memberError } = await supabase
                                .from('institution_teachers')
                                .insert({
                                    institution_id: instData.id,
                                    user_id: data.user.id,
                                    role: 'admin',
                                    status: 'active'
                                });

                            console.log('[AuthContext] Teacher insert result:', { memberError });
                            if (memberError) throw memberError;
                        }

                        console.log('[AuthContext] Institution created successfully:', instData.id);
                        return { success: true, institutionId: instData.id, user: data.user };
                    } catch (err) {
                        console.error("[AuthContext] Error creating institution during signup:", err);
                        // We continue even if school creation fails (edge case)
                    }
                }

                return { success: true, user: data.user };
            }
            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            return { success: false, error: translateAuthError(e.message) };
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
