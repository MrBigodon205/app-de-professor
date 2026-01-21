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

    // Initial session check
    React.useLayoutEffect(() => {
        let mounted = true;
        let initialLoadDone = false;

        const initSession = async () => {
            try {
                let { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error("Session init error:", error);

                if (!session) {
                    try {
                        const supabaseUrl = (supabase as any).supabaseUrl;
                        const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                        const storageKey = `sb-${projectRef}-auth-token`;
                        const raw = localStorage.getItem(storageKey);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed.user && parsed.access_token) {
                                session = parsed;
                            }
                        }
                    } catch (e) {
                        console.warn("Erro ao ler fallback session:", e);
                    }
                }

                if (session?.user) {
                    setUserId(session.user.id);
                    const cached = localStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            setCurrentUser(parsed);
                        } catch (e) { console.error("Erro ao ler cache:", e); }
                    }
                    try {
                        await fetchProfile(session.user.id, session.user);
                    } catch (e) {
                        console.error("Fetch profile failed explicitly in init:", e);
                    }
                    initialLoadDone = true;
                }
            } catch (err) {
                console.error("Unexpected auth error:", err);
            } finally {
                const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'));
                if (mounted && !hasAuthHash) {
                    setLoading(false);
                } else if (hasAuthHash) {
                    setTimeout(() => {
                        if (mounted) setLoading(false);
                    }, 5000);
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                if (!currentUser) {
                    const cached = localStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try {
                            setCurrentUser(JSON.parse(cached));
                            setLoading(false);
                        } catch (e) { }
                    }
                }

                if (!initialLoadDone || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    const pendingSubs = localStorage.getItem('pending_subs');
                    if (pendingSubs && event === 'SIGNED_IN') {
                        try {
                            const subjects = JSON.parse(pendingSubs);
                            if (Array.isArray(subjects) && subjects.length > 0) {
                                const mainSubject = subjects[0];
                                await supabase.from('profiles').update({
                                    subject: mainSubject,
                                    subjects: subjects
                                }).eq('id', session.user.id);
                                localStorage.removeItem('pending_subs');
                            }
                        } catch (e) { console.error("Error applying pending subjects:", e); }
                    }
                    fetchProfile(session.user.id, session.user);
                    initialLoadDone = true;
                }

                if (event === 'PASSWORD_RECOVERY') window.location.hash = '/reset-password';
            } else {
                setCurrentUser(null);
                setUserId(null);
                if (event === 'SIGNED_OUT') {
                    const keys = Object.keys(localStorage);
                    keys.forEach(k => {
                        if (k.startsWith('cached_profile_')) localStorage.removeItem(k);
                    });
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
            if (e.matches) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
        };
        updateTheme(darkModeMediaQuery);
        darkModeMediaQuery.addEventListener('change', updateTheme);
        return () => darkModeMediaQuery.removeEventListener('change', updateTheme);
    }, []);

    useEffect(() => {
        if (!userId) {
            if (profileChannel) {
                supabase.removeChannel(profileChannel);
                setProfileChannel(null);
            }
            return;
        }

        const channel = supabase.channel(`profile_sync:${userId}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
                (payload) => {
                    const newProfile = payload.new as any;
                    setCurrentUser(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            name: newProfile.name,
                            subject: newProfile.subject,
                            subjects: newProfile.subjects || [],
                            photoUrl: newProfile.photo_url,
                            isPasswordSet: newProfile.is_password_set
                        };
                    });
                }
            )
            .subscribe();

        setProfileChannel(channel);
        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    const register = useCallback(async (name: string, email: string, password: string, subject: Subject, subjects: Subject[] = []) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/#/login`,
                    data: { name, subject, subjects, is_password_set: true }
                }
            });

            if (error) {
                if (error.message.includes("already registered")) return { success: false, error: "Este e-mail já está cadastrado." };
                return { success: false, error: error.message };
            }

            if (data.user) {
                await seedUserData(data.user.id);
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ name, subject, subjects })
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

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!userId) {
            console.error("Falha ao atualizar perfil: userId não encontrado");
            return false;
        }
        try {
            if (data.password) {
                const { error: authError } = await supabase.auth.updateUser({ password: data.password });
                if (authError) throw authError;
            }
            if (data.isPasswordSet === true) {
                await supabase.auth.updateUser({ data: { is_password_set: true } });
            }

            const profileUpdate: any = {};
            if (data.name) profileUpdate.name = data.name;
            if (data.subject) profileUpdate.subject = data.subject;
            if (data.photoUrl) profileUpdate.photo_url = data.photoUrl;
            if (data.subjects) profileUpdate.subjects = data.subjects;
            if (data.email) profileUpdate.email = data.email;

            if (Object.keys(profileUpdate).length > 0) {
                const { error } = await supabase.from('profiles').update(profileUpdate).eq('id', userId);
                if (error) throw error;
            }

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
            const { error: passError } = await supabase.auth.updateUser({ password });
            if (passError) throw passError;
            await updateProfile({ name, subject, subjects, isPasswordSet: true });
            return { success: true };
        } catch (e: any) {
            console.error("Complete registration error:", e);
            return { success: false, error: e.message || "Erro ao completar cadastro." };
        }
    }, [userId, updateProfile]);

    const logout = useCallback(async () => {
        try {
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timed out')), 1000))
            ]);
        } catch (error) { console.warn("Logout upstream falhou:", error); }
        finally {
            setCurrentUser(null);
            setUserId(null);
            localStorage.removeItem('sb-' + (import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token');
            localStorage.removeItem('supabase.auth.token');
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cached_profile_') || k.startsWith('sb-') || k.startsWith('supabase.')) localStorage.removeItem(k);
            });
            sessionStorage.clear();
            window.location.href = '/';
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/` });
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
            return { success: false, error: e.message === 'New password should be different from the old password.' ? 'A nova senha deve ser diferente da antiga.' : "Erro ao atualizar senha." };
        }
    }, []);

    const updateActiveSubject = useCallback((subject: string) => {
        setActiveSubject(subject);
        if (userId) localStorage.setItem(`activeSubject_${userId}`, subject);
    }, [userId]);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        const rawLogin = async () => {
            const supabaseUrl = (supabase as any).supabaseUrl;
            const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;
            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: { 'apikey': supabaseKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error_description || errData.msg || 'Erro no login via HTTP');
            }
            const data = await response.json();
            try {
                const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                const storageKey = `sb-${projectRef}-auth-token`;
                localStorage.setItem(storageKey, JSON.stringify(data));
            } catch (e) { console.warn("Erro ao salvar token manual:", e); }
            if (data.user) {
                setUserId(data.user.id);
                await fetchProfile(data.user.id, data.user);
            }
            return { user: data.user, session: data };
        };

        try {
            let authResult;
            try {
                authResult = await Promise.race([
                    rawLogin(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Login timed out (10s)')), 10000))
                ]);
            } catch (rawErr: any) {
                if (rawErr.message === 'Email not confirmed' || rawErr.message === 'Invalid login credentials') throw rawErr;
                const { data, error } = await Promise.race([
                    supabase.auth.signInWithPassword({ email, password }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SDK Login timed out (10s)')), 10000)) as Promise<any>
                ]);
                if (error) throw error;
                authResult = { user: data.user, session: data.session };
            }
            if (authResult?.user) {
                const cached = localStorage.getItem(`cached_profile_${authResult.user.id}`);
                if (cached) {
                    try { setCurrentUser(JSON.parse(cached)); setLoading(false); } catch (e) { }
                }
                supabase.auth.updateUser({ data: { is_password_set: true } });
                fetchProfile(authResult.user.id, authResult.user);
                return { success: true };
            }
            return { success: false, error: 'Erro ao autenticar.' };
        } catch (e: any) {
            console.error("Falha final no login:", e);
            setLoading(false);
            return { success: false, error: 'Erro ao realizar login. Verifique suas credenciais.' };
        }
    }, [currentUser]);

    const contextValue = useMemo(() => ({
        currentUser, userId, login, register, logout, updateProfile, resetPassword, updatePassword, loading, activeSubject, updateActiveSubject
    }), [currentUser, userId, login, register, logout, updateProfile, loading, activeSubject, updateActiveSubject]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 font-medium text-sm animate-pulse">Iniciando sistema...</div>
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
