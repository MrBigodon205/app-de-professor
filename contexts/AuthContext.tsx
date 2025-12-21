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
        try {
            // 1. Try Fetch from Supabase
            const { data: sbData, error: sbError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            // 2. Try Fetch from Local
            const localUser = await getLocalUser(uid);

            let finalUser: User | null = null;

            if (sbData) {
                // Case A: Supabase has data (Primary Source)
                finalUser = {
                    id: sbData.id,
                    name: sbData.name,
                    email: sbData.email,
                    photoUrl: sbData.photo_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&h=200&auto=format&fit=crop',
                    subject: sbData.subject || '',
                    subjects: sbData.subjects || []
                };

                // Sync Supabase -> Local (Backup)
                saveLocalUser(finalUser);

            } else if (localUser) {
                // Case B: Supabase Missing/Error, but Local exists (Restore/Sync Up)
                console.log("User missing in Supabase, restoring from Local...");
                finalUser = localUser;

                // Push to Supabase
                const { error: upsertError } = await supabase.from('profiles').upsert({
                    id: localUser.id,
                    name: localUser.name,
                    email: localUser.email,
                    subject: localUser.subject,
                    subjects: localUser.subjects,
                    photo_url: localUser.photoUrl
                });

                if (upsertError) console.error("Failed to restore user to Supabase:", upsertError);
            }

            if (finalUser) {
                setCurrentUser(finalUser);
                setUserId(finalUser.id);
            } else if (sbError && retryCount < 2) {
                // Retry only if absolutely nothing found
                setTimeout(() => fetchProfile(uid, retryCount + 1), 1000);
            }

        } catch (err: any) {
            console.error(`Fetch profile error (attempt ${retryCount + 1}):`, err.message);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth check timed out, forcing app load.");
                setLoading(false);
            }
        }, 5000);

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
        try {
            // 1. Try to sign in with a 20s timeout
            const { data, error } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                20000,
                "Login request"
            );

            if (error) {
                if (error.message === 'Email not confirmed') {
                    return { success: false, error: 'Por favor, confirme seu e-mail para entrar.' };
                }
                if (error.message === 'Invalid login credentials') {
                    return { success: false, error: 'E-mail ou senha inválidos.' };
                }
                console.error("Login error:", error.message);
                return { success: false, error: error.message };
            }

            if (data.user) {
                // 2. Fetch profile with a 5s timeout per attempt (fetchProfile manages its own retries, but we want to cap the total wait)
                // We wrap the await to ensure 'Processando' doesn't hang forever if fetching takes too long
                try {
                    await withTimeout(fetchProfile(data.user.id), 8000, "Profile fetch");
                } catch (profileErr) {
                    console.warn("Profile fetch took too long, proceeding anyway...", profileErr);
                    // We allow login to succeed even if profile is slow/failed, app will try to fetch later or show partial data
                }
                return { success: true };
            }
            return { success: false, error: 'Erro desconhecido ao entrar.' };
        } catch (e: any) {
            console.error("Login crash:", e);
            if (e.message.includes("timed out")) {
                return { success: false, error: 'O servidor demorou para responder. Verifique sua conexão.' };
            }
            return { success: false, error: e.message || 'Erro ao conectar ao servidor.' };
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
        await supabase.auth.signOut();
        setCurrentUser(null);
        setUserId(null);
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
