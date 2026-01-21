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
                try {
                    profile = await withTimeout(rawProfileFetch(), 6000, "Raw Profile Fetch");
                } catch (rawErr) {
                    console.warn("Raw fetch also failed/timed out", rawErr);
                }
            }

            if (profile) {
                // AUTO-DETECT PASSWORD (LEGACY FIX)
                // If the user has 'email' in their providers logic, they HAVE a password.
                // We trust this over the DB flag for legacy users.
                let hasPasswordConfirmed = profile.is_password_set;

                if (authUser && !hasPasswordConfirmed) {
                    const providers = authUser.app_metadata?.providers || [];
                    if (providers.includes('email')) {
                        // console.log("Legacy user detected with Email provider. Forcing isPasswordSet=true.");
                        hasPasswordConfirmed = true;

                        // Self-healing: Update DB in background
                        supabase.from('profiles').update({ is_password_set: true }).eq('id', uid);
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

                // STABILIZATION: Only update state if data actually changed to prevent app-wide re-renders
                setCurrentUser(prev => {
                    if (prev && JSON.stringify(prev) === JSON.stringify(finalUser)) {
                        return prev;
                    }
                    return finalUser;
                });

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





    // Initial session check
    React.useLayoutEffect(() => {
        let mounted = true;
        let initialLoadDone = false;

        // Initial session check
        const initSession = async () => {
            try {
                // Try to restore session from Supabase locally first (very fast)
                let { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error("Session init error:", error);

                // OAUTH HASH CHECK - Delegated to Supabase Client (detectSessionInUrl: true)
                // We trust the SDK to handle the hash parsing now.
                // The previous manual logic has been removed to avoid conflicts.

                // FALLBACK: Se o SDK não achou a sessão, tentamos ler do localStorage manualmente

                // FALLBACK: Se o SDK não achou a sessão, tentamos ler do localStorage manualmente
                // (Já que salvamos manualmente no login para evitar travamento)
                if (!session) {
                    try {
                        const supabaseUrl = (supabase as any).supabaseUrl;
                        const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                        const storageKey = `sb-${projectRef}-auth-token`;
                        const raw = localStorage.getItem(storageKey);
                        if (raw) {
                            const parsed = JSON.parse(raw);
                            if (parsed.user && parsed.access_token) {
                                // console.log("Recuperando sessão manual...");
                                session = parsed;
                                // Opcional: Tentar setar sessao no SDK sem await para não travar?
                                // Melhor não. Deixa desincronizado. O que importa é o currentUser.
                            }
                        }
                    } catch (e) {
                        console.warn("Erro ao ler fallback session:", e);
                    }
                }

                if (session?.user) {
                    setUserId(session.user.id);

                    // INSTANT CACHE LOAD
                    const cached = localStorage.getItem(`cached_profile_${session.user.id}`);
                    if (cached) {
                        try {
                            const parsed = JSON.parse(cached);
                            setCurrentUser(parsed);
                        } catch (e) {
                            console.error("Erro ao ler cache:", e);
                        }
                    }

                    // CRITICAL: Await profile fetch
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
                // INTEGRITY CHECK:
                // If the URL contains an OAuth hash (access_token), we MUST NOT clear the loading state yet.
                // We must wait for Supabase `onAuthStateChange` to fire the SIGNED_IN event.
                // Otherwise, the router will mount, clear the hash, and the login will be lost.
                const hasAuthHash = window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('type=recovery'));

                if (mounted && !hasAuthHash) {
                    setLoading(false);
                } else if (hasAuthHash) {
                    console.log("[AUTH] Hash detected, holding loading state for Supabase processing...");
                    // Optional: Add a 'backup' timeout here in case Supabase fails to fire
                    setTimeout(() => {
                        if (mounted) setLoading(false);
                    }, 5000); // 5s grace period for Supabase to process hash
                }
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

                    // SOCIAL LOGIN POST-PROCESSING:
                    // Check if there are pending subjects from registration flow (Google Login)
                    const pendingSubs = localStorage.getItem('pending_subs');
                    if (pendingSubs && event === 'SIGNED_IN') {
                        try {
                            const subjects = JSON.parse(pendingSubs);
                            if (Array.isArray(subjects) && subjects.length > 0) {
                                // console.log("Applying pending subjects to new Google user...", subjects);
                                const mainSubject = subjects[0];

                                // Update profile immediately
                                await supabase.from('profiles').update({
                                    subject: mainSubject,
                                    subjects: subjects
                                }).eq('id', session.user.id);

                                // Clean up
                                localStorage.removeItem('pending_subs');
                            }
                        } catch (e) {
                            console.error("Error applying pending subjects:", e);
                        }
                    }

                    fetchProfile(session.user.id, session.user);
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
                            photoUrl: newProfile.photo_url,
                            isPasswordSet: newProfile.is_password_set
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

            // SESSÃO MANUAL (BYPASS DE TRAVAMENTO)
            // O comando setSession trava neste ambiente. Vamos fazer manualmente:
            // 1. Salvar no LocalStorage
            try {
                const projectRef = supabaseUrl.split('//')[1].split('.')[0];
                const storageKey = `sb-${projectRef}-auth-token`;
                localStorage.setItem(storageKey, JSON.stringify(data));
            } catch (e) {
                console.warn("Erro ao salvar token manual:", e);
            }

            // 2. Atualizar estado do Contexto manualmente
            // Isso engana a aplicação para achar que o onAuthStateChange disparou
            if (data.user) {
                setUserId(data.user.id);
                // AWAIT para garantir que o currentUser esteja preenchido antes de navegar
                await fetchProfile(data.user.id);
            }

            // Retorna sucesso imediato
            return { user: data.user, session: data };
        };

        try {
            // HIGH PERFORMANCE PATH: Direct HTTP Fetch for Token
            // Bypasses SDK internal overhead during the critical token hand-off
            let authResult;
            try {
                // Timeout logic for login matching the logout protection
                const loginPromise = async () => {
                    try {
                        return await rawLogin();
                    } catch (err) {
                        return err; // throw downstream
                    }
                };

                // Race against 10s timeout
                authResult = await Promise.race([
                    rawLogin(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Login timed out (10s)')), 10000))
                ]);

            } catch (rawErr: any) {
                // Propagate credential errors
                if (rawErr.message === 'Email not confirmed' || rawErr.message === 'Invalid login credentials') {
                    throw rawErr;
                }

                // Fallback to standard SDK for generic/network errors
                console.warn("Raw Login failed, trying SDK fallback:", rawErr.message);

                // WRAP SDK IN TIMEOUT TOO (Fix for infinite hanging on local/fallback)
                const { data, error } = await Promise.race([
                    supabase.auth.signInWithPassword({ email, password }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('SDK Login timed out (10s)')), 10000)) as Promise<any>
                ]);

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
                // Also, since this is a PASSWORD login, we can guarantee is_password_set is true.
                // We update this in the background to fix any legacy data issues.
                supabase.from('profiles').update({ is_password_set: true }).eq('id', authResult.user.id).then(() => {
                    fetchProfile(authResult.user.id);
                });

                return { success: true };
            }

            return { success: false, error: 'Erro ao autenticar.' };

        } catch (e: any) {
            console.error("Falha final no login:", e);
            let msg = e.message;
            if (msg === 'Email not confirmed') msg = 'Por favor, confirme seu e-mail para entrar.';
            if (msg === 'Invalid login credentials' || msg === 'Erro no login via HTTP') msg = 'Não encontramos uma conta com este e-mail ou a senha está incorreta.';
            if (msg.includes('expirou') || msg.includes('timed out')) msg = 'Tempo esgotado. Verifique sua conexão.';

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
                // Background seeding (Awaited to ensure classes exist on first load)
                await seedUserData(data.user.id);

                // FORCE UPDATE PROFILE to ensure metadata is synced
                // The trigger might miss proper mapping sometimes, so we enforce it here.
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        name: name,
                        subject: subject,
                        subjects: subjects,
                        is_password_set: true // Manual registration always sets a password
                    })
                    .eq('id', data.user.id);

                if (profileError) {
                    console.warn("Manual profile update failed:", profileError);
                    // We don't fail the registration here, as the user is created.
                }

                return { success: true };
            }

            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            console.error("Registration error:", e);
            return { success: false, error: e.message || "Erro ao realizar o cadastro." };
        }
    }, []);

    // completeRegistration moved below updateProfile

    const logout = useCallback(async () => {
        try {
            // 1. Tenta logout no Supabase com Race Condition (Timeout de 1s)
            // Se o servidor n ao responder em 1s, forçamos o logout local
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timed out')), 1000))
            ]);
        } catch (error) {
            console.warn("Logout upstream falhou ou demorou muito (prosseguindo localmente):", error);
        } finally {
            // 2. LIMPEZA TOTAL (Nuclear Option)
            // Garante que não sobra lixo de sessão antiga causando loop
            setCurrentUser(null);
            setUserId(null);

            // Limpa chaves específicas para evitar limpar preferências do usuário que não são de sessão
            localStorage.removeItem('sb-' + (import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '') + '-auth-token');
            localStorage.removeItem('supabase.auth.token'); // Nova chave explícita

            // Limpa caches de perfil
            const keys = Object.keys(localStorage);
            keys.forEach(k => {
                if (k.startsWith('cached_profile_') || k.startsWith('sb-') || k.startsWith('supabase.')) {
                    localStorage.removeItem(k);
                }
            });

            sessionStorage.clear();

            // 3. Força recarregamento para estado limpo
            window.location.href = '/';
        }
    }, []);

    const updateProfile = useCallback(async (data: Partial<User>) => {
        if (!userId) {
            console.error("Falha ao atualizar perfil: userId não encontrado");
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

                // FIX: If subject was updated, immediately reflect it in activeSubject
                // This ensures the dashboard updates instantly
                if (data.subject) {
                    setActiveSubject(data.subject);
                    localStorage.setItem('active_subject', data.subject);
                }

                // Local backup removed

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
