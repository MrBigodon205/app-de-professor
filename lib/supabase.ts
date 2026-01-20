import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        persistSession: true,
        autoRefreshToken: false, // DISABLE TO FIX LOCKUP
        detectSessionInUrl: false, // PREVENT HASH ROUTER CONFLICT
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: { 'x-application-name': 'prof-acerta-plus' }
    }
});
