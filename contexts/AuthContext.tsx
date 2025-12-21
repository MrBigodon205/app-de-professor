import React, { createContext, useContext, useState, useEffect } from 'react';
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
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const LOCAL_API_URL = 'http://localhost:3002/users';
    const IS_DEV = import.meta.env.DEV;

    const getLocalUser = async (id: string): Promise<User | null> => {
        if (!IS_DEV) return null;
        try {
            const res = await fetch(`${LOCAL_API_URL}/${id}`);
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Local server unavailable for get");
        }
        return null;
    };

    const saveLocalUser = async (user: User) => {
        if (!IS_DEV) return;
        try {
            const existing = await getLocalUser(user.id);
            const method = existing ? 'PUT' : 'POST';
            const url = existing ? `${LOCAL_API_URL}/${user.id}` : LOCAL_API_URL;

            // Ensure we don't lose the password if we are constructing the user from Supabase profile (which lacks password)
            let body = { ...user };
            if (existing && existing.password && !body.password) {
                body.password = existing.password;
            }

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (e) {
            console.warn("Local server unavailable for save");
        }
    };

    const fetchProfile = async (uid: string, retryCount = 0) => {
        // Raw Fetch Helper for Profile
        const rawProfileFetch = async () => {
            console.log("Tentando buscar perfil via Raw Fetch...");
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
            let sbData = null;
            let usedFallback = false;

            // 1. Try Standard Fetch (with timeout)
            try {
                const { data, error } = await withTimeout(
                    supabase.from('profiles').select('*').eq('id', uid).single(),
                    10000,
                    "Profile Fetch"
                );
                if (error) throw error;
                sbData = data;
            } catch (err: any) {
                console.warn("Falha no Profile Fetch padrão:", err.message);
                // 2. Fallback to Raw Fetch
                try {
                    sbData = await rawProfileFetch();
                    usedFallback = true;
                } catch (rawErr) {
                    console.error("Falha total no Profile Fetch:", rawErr);
                }
            }

            // 3. Construct User Object (Fail-Open)
            let finalUser: User | null = null;

            if (sbData) {
                finalUser = {
                    id: sbData.id,
                    name: sbData.name,
                    email: sbData.email,
                    photoUrl: sbData.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&h=200&auto=format&fit=crop',
                    subject: sbData.subject || '',
                    subjects: sbData.subjects || []
                };
                if (usedFallback) console.log("Perfil carregado via Fallback HTTP!");
                saveLocalUser(finalUser); // Sync backup
            } else {
                // EMERGENCY FALLBACK: Create Minimal User from Session Logic if available
                // We can't easily get session email here without passing it, but let's check local storage next
                const localUser = await getLocalUser(uid);
                if (localUser) {
                    console.log("Restaurando usuário do backup local...");
                    finalUser = localUser;
                } else {
                    // Last Resort: If we can't find profile, we might be stuck. 
                    // But usually, if login succeeded, we should at least let them in?
                    // Without a profile, the app might crash if it expects 'subjects'. 
                    // We will retry once more then give up.
                    if (retryCount < 2) {
                        setTimeout(() => fetchProfile(uid, retryCount + 1), 1000);
                        return;
                    }
                }
            }

            if (finalUser) {
                setCurrentUser(finalUser);
                setUserId(finalUser.id);
            }
        } catch (err: any) {
            console.error(`Critico: Erro no fetchProfile:`, err.message);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out (12s limit). Forcing app load.");
                setLoading(false);
            }
        }, 12000); // Increased from 5s to 12s for slow mobile networks

        // Initial session check
        const initSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) console.error("Session init error:", error);

                if (session?.user) {
                    await fetchProfile(session.user.id);
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setCurrentUser(null);
                setUserId(null);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    // Helper to race a promise against a timeout
    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
        return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms))
        ]);
    };

    const login = async (email: string, password: string) => {
        // Helper for Raw Fetch Login (Fallback)
        const rawLogin = async () => {
            console.log("Tentando login via Raw Fetch...");
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
            // 1. Try Standard Supabase Client Login (Timeout bumped to 30s)
            console.log("Tentando login padrão...");
            try {
                const { data, error } = await withTimeout(
                    supabase.auth.signInWithPassword({ email, password }),
                    30000,
                    "Login Padrão"
                );

                if (error) throw error;
                if (data.user) return { success: true };

            } catch (clientError: any) {
                console.warn("Falha no login padrão, ativando Fallback HTTP:", clientError.message);

                // If it's a CREDENTIAL error, don't retry (it's wrong password)
                if (clientError.message === 'Email not confirmed' ||
                    clientError.message === 'Invalid login credentials') {
                    throw clientError;
                }

                // 2. FALLBACK: Raw Fetch Login
                // Only runs if the client crashed vs network or timeout
                await rawLogin();
                return { success: true };
            }

            return { success: false, error: 'Erro desconhecido.' };

        } catch (e: any) {
            console.error("Login final failed:", e);
            let msg = e.message;
            if (msg === 'Email not confirmed') msg = 'Por favor, confirme seu e-mail para entrar.';
            if (msg === 'Invalid login credentials') msg = 'E-mail ou senha inválidos.';
            if (msg.includes('timed out')) msg = 'Tempo esgotado. Verifique sua conexão.';

            return { success: false, error: msg };
        }
    };

    const register = async (name: string, email: string, password: string, subject: Subject, subjects: Subject[] = []) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
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

                // Save to local DB immediately
                const newUser: User = {
                    id: data.user.id,
                    name,
                    email,
                    password,
                    subject,
                    subjects
                };
                saveLocalUser(newUser);

                return { success: true };
            }

            return { success: false, error: "Erro ao criar usuário." };
        } catch (e: any) {
            console.error("Registration error:", e);
            return { success: false, error: e.message || "Erro ao realizar o cadastro." };
        }
    };

    const logout = async () => {
        try {
            console.log("Executando Logout Seguro...");
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
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!userId) {
            console.error("Update profile failed: No userId found");
            return false;
        }

        console.log("Starting profile update for user:", userId);
        console.log("Update payload:", JSON.stringify(data, null, 2));

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

            console.log("Supabase profile payload:", JSON.stringify(profileUpdate, null, 2));

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

                // 4. Update Local DB (Backup/Sync)
                // We pass the FULL updated user object to saveLocalUser, including password if it was in the update data
                const userToSave = { ...newState, password: data.password || currentUser?.password };
                saveLocalUser(userToSave as User);
            }

            return true;
        } catch (e: any) {
            console.error("Update profile failed", e);
            alert(`Erro ao atualizar perfil: ${e.message || 'Erro desconhecido'}`);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ currentUser, userId, login, register, logout, updateProfile, loading }}>
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
