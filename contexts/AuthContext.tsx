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
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))
        ]);
    }, []);

    const fetchProfile = useCallback(async (uid: string, retryCount = 0) => {
        // Raw Fetch Helper for Profile
        const rawProfileFetch = async () => {
            // console.log("Tentando buscar perfil via Raw Fetch...");
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
                // console.debug("SDK Profile fetch failed, trying raw fetch...");
                profile = await rawProfileFetch();
            }

            if (profile) {
                const finalUser: User = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    photoUrl: profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=random`,
                    subject: profile.subject,
                    subjects: profile.subjects || []
                };

                localStorage.setItem(`cached_profile_${finalUser.id}`, JSON.stringify(finalUser));
                setCurrentUser(finalUser);
                setUserId(finalUser.id);

                // Initialize activeSubject
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

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out (4s limit). Forcing app load.");
                setLoading(false);
            }
        }, 4000);

        // Flag to prevent redundant fetches during initial load
        let initialLoadDone = false;

        // Initial session check
        const initSession = async () => {
            try {
                // Try to restore session from Supabase locally first (very fast)
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error("Session init error:", error);

                if (session?.user) {
                    setUserId(session.user.id);

                    // INSTANT CACHE LOAD
                    const cached = localStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            setCurrentUser(parsed);
                            setLoading(false); // Stop loading spinner ASAP
                            // console.log("Perfil carregado do cache!");
                        } catch (e) {
                            console.error("Erro ao ler cache:", e);
                        }
                    }

                    // Background refresh
                    fetchProfile(session.user.id);
                    initialLoadDone = true;
                }
            } catch (err) {
                console.error("Unexpected auth error:", err);
            } finally {
                if (mounted) setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);

                // If we don't have a user yet, try to load from cache immediately
                if (!currentUser) {
                    const cached = localStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try {
                            setCurrentUser(JSON.parse(cached));
                            // If we loaded from cache, we can stop the initial loading spinner
                            setLoading(false);
                        } catch (e) { }
                    }
                }

                // Only fetch if it's not the initial redundant call or if it's a specific event
                if (!initialLoadDone || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    fetchProfile(session.user.id);
                    initialLoadDone = true;
                }

                // Handle password recovery redirection
                if (event === 'PASSWORD_RECOVERY') {
                    window.location.hash = '/reset-password';
                }
            } else {
                setCurrentUser(null);
                setUserId(null);
                // Clear cache on sign out? Maybe not, keep for next time login?
                // Actually better to clear to avoid showing previous user data
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
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        // System Dark Mode Detection
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = (e: MediaQueryListEvent | MediaQueryList) => {
            const isDark = e.matches;
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        // Initial check
        updateTheme(darkModeMediaQuery);

        // Listener for changes
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
                    // Update local state instantly
                    setCurrentUser(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            name: newProfile.name,
                            subject: newProfile.subject,
                            subjects: newProfile.subjects || [],
                            photoUrl: newProfile.photo_url
                        };
                    });

                    // Also update activeSubject if needed? 
                    // Usually we don't force activeSubject change unless user initiated. 
                    // But if subject list changed, maybe?
                    // For now, syncing the "Primary Subject" (currentUser.subject) is enough.
                    // The 'activeSubject' state is session-based (localStorage).
                }
            )
            .subscribe();

        setProfileChannel(channel);

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);



    const login = useCallback(async (email: string, password: string) => {
        setLoading(true); // Prevent redirect race condition
        // Helper for Raw Fetch Login (Fallback)
        const rawLogin = async () => {
            // console.log("Tentando login via Raw Fetch...");
            const supabaseUrl = (supabase as any).supabaseUrl;
            const supabaseKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

            const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error_description || errData.msg || 'Erro no login via HTTP');
            }

            const data = await response.json();

            // Manually set session in Supabase client to sync state
            const { error: sessionError } = await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: data.refresh_token
            });

            if (sessionError) throw sessionError;
            return { user: data.user, session: data };
        };

        try {
            // HIGH PERFORMANCE PATH: Direct HTTP Fetch for Token
            // Bypasses SDK internal overhead during the critical token hand-off
            let authResult;
            try {
                authResult = await rawLogin();
            } catch (rawErr: any) {
                // Propagate credential errors
                if (rawErr.message === 'Email not confirmed' || rawErr.message === 'Invalid login credentials') {
                    throw rawErr;
                }

                // Fallback to standard SDK for generic/network errors
                console.warn("Raw Login failed, trying SDK fallback:", rawErr.message);
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                authResult = { user: data.user, session: data.session };
            }

            if (authResult?.user) {
                // Instant shell loading from cache
                const cached = localStorage.getItem(`cached_profile_${authResult.user.id}`);
                if (cached) {
                    try {
                        setCurrentUser(JSON.parse(cached));
                        setLoading(false);
                    } catch (e) { }
                }

                // Ensure profile is fetched (ALWAYS in background to not block navigation)
                fetchProfile(authResult.user.id);

                return { success: true };
            }

            return { success: false, error: 'Erro ao autenticar.' };

        } catch (e: any) {
            console.error("Login final failed:", e);
            let msg = e.message;
            if (msg === 'Email not confirmed') msg = 'Por favor, confirme seu e-mail para entrar.';
            if (msg === 'Invalid login credentials' || msg === 'Erro no login via HTTP') msg = 'E-mail ou senha inválidos.';
            if (msg.includes('timed out')) msg = 'Tempo esgotado. Verifique sua conexão.';

            setLoading(false);
            return { success: false, error: msg };
        }
    }, [currentUser]);

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
                        subjects
                    }
                }
            });

            if (error) {
                if (error.message.includes("already registered")) {
                    return { success: false, error: "Este e-mail já está cadastrado." };
                }
                if (error.status === 429 || error.message.includes("security purposes")) {
                    return { success: false, error: "Muitas tentativas. Aguarde um minuto antes de tentar novamente." };
                }
                console.error("Registration error:", error.message);
                return { success: false, error: error.message };
            }

            if (data.user) {
                // Background seeding
                seedUserData(data.user.id);

                // Local backup removed


                return { success: true };
            }

            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            console.error("Registration error:", e);
            return { success: false, error: e.message || "Erro ao realizar o cadastro." };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // 1. Tenta logout no Supabase
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Erro no signOut (ignorado):", error);
        } finally {
            // 2. LIMPEZA TOTAL (Nuclear Option)
            // Garante que não sobra lixo de sessão antiga causando loop
            setCurrentUser(null);
            setUserId(null);

            localStorage.clear(); // Limpa tokens antigos
            sessionStorage.clear();

            // 3. Força recarregamento para estado limpo
            window.location.href = '/';
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!userId) {
            console.error("Update profile failed: No userId found");
            return false;
        }

        // console.log("Starting profile update for user:", userId);
        // console.log("Update payload:", JSON.stringify(data, null, 2));

        try {
            // 1. Update Auth User if password is provided
            if (data.password) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: data.password
                });
                if (authError) throw authError;
            }

            // 2. Map frontend fields to DB columns
            const profileUpdate: any = {};
            if (Object.prototype.hasOwnProperty.call(data, 'name')) profileUpdate.name = data.name;
            if (Object.prototype.hasOwnProperty.call(data, 'subject')) profileUpdate.subject = data.subject;
            if (Object.prototype.hasOwnProperty.call(data, 'photoUrl')) profileUpdate.photo_url = data.photoUrl;
            if (Object.prototype.hasOwnProperty.call(data, 'subjects')) profileUpdate.subjects = data.subjects;
            if (Object.prototype.hasOwnProperty.call(data, 'email')) profileUpdate.email = data.email;

            // console.log("Supabase profile payload:", JSON.stringify(profileUpdate, null, 2));

            // Only update profiles if there's something to update
            if (Object.keys(profileUpdate).length > 0) {
                const { error } = await supabase
                    .from('profiles')
                    .update(profileUpdate)
                    .eq('id', userId);

                if (error) throw error;
            }

            // 3. Update local state
            // Merge existing data with new data, omitting the password field from state
            const { password, ...cleanData } = data;
            const newState = currentUser ? { ...currentUser, ...cleanData } : null;
            if (newState) {
                // Ensure ID is present if it was somehow lost or if currentUser was null (though flow prevents that)
                if (!newState.id) newState.id = userId;
                setCurrentUser(newState as User);

                // Local backup removed

            }

            return true;
        } catch (e: any) {
            console.error("Update profile failed", e);
            alert(`Erro ao atualizar perfil: ${e.message || 'Erro desconhecido'}`);
            return false;
        }
    }, [userId, currentUser]);

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
            console.error("Update password failed:", e);
            return { success: false, error: e.message || "Erro ao atualizar senha." };
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
