import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, KeyRound, ArrowRight } from 'lucide-react';

export const JoinInstitutionForm: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !code) return;
        setLoading(true);
        setError('');

        try {
            // 1. Validate Invite Code
            const { data: invite, error: inviteError } = await supabase
                .from('institution_invites')
                .select('*, institutions(name)')
                .eq('code', code)
                .is('used_by', null) // Must be unused
                .gt('expires_at', new Date().toISOString()) // Must not be expired
                .single();

            if (inviteError || !invite) {
                throw new Error('Código inválido ou expirado.');
            }

            // 2. Add Member to School
            const { error: memberError } = await supabase
                .from('institution_teachers')
                .insert({
                    institution_id: invite.institution_id,
                    user_id: currentUser.id,
                    role: 'teacher', // Default role for invites
                    status: 'active'
                });

            // If already member, handle gracefully?
            if (memberError && memberError.code !== '23505') { // 23505 = Unique Violation
                throw memberError;
            }

            // 3. Mark Code as Used
            // WARNING: RLS might block this if not careful. Ideally this is a stored procedure.
            // For now, assuming user can update if they have the code (or we rely on backend logic/trigger).
            // Actually, best practice for Phase 2 is to rely on RLS allowing update if code matches.
            // Let's try simple update.
            const { error: updateError } = await supabase
                .from('institution_invites')
                .update({
                    used_by: currentUser.id,
                    used_at: new Date().toISOString()
                })
                .eq('id', invite.id);

            if (updateError) console.warn("Could not mark invite used:", updateError);

            // 4. Success Redirect
            navigate(`/institution/${invite.institution_id}/dashboard`);

        } catch (err: any) {
            console.error('Join error:', err);
            setError(err.message || 'Erro ao entrar na instituição.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-transparent dark:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
                <KeyRound size={28} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entrar com Código</h1>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código de Convite (8 dígitos)
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={8}
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full p-3 text-center text-xl tracking-widest border border-gray-300 dark:border-white/10 rounded focus:ring-2 focus:ring-indigo-500 uppercase outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white"
                        placeholder="AB3X9K2M"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-md text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || code.length < 8}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 font-medium"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Entrar <ArrowRight size={16} /></>}
                </button>
            </form>
        </div>
    );
};
