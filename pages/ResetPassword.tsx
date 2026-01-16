import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useTheme } from '../hooks/useTheme';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error("Update password error:", err);
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 font-display bg-slate-950 overflow-hidden relative">
            {/* Background Pattern (Reused from Layout/Login) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/20 blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-[450px] glass-card-premium p-8 lg:p-10 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex bg-gradient-to-tr from-primary to-emerald-400 p-4 rounded-2xl mb-6 shadow-lg">
                        <span className="material-symbols-outlined text-white text-[40px]">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Nova Senha</h2>
                    <p className="text-slate-400 text-sm">Defina sua nova chave de acesso ao sistema.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">error</span>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        Senha atualizada com sucesso! Redirecionando...
                    </div>
                )}

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                            <div className="relative">
                                <input
                                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 pl-5 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                            <input
                                className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 transition-all group-hover:scale-105" />
                            <div className="relative h-14 flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                                {isSubmitting ? 'Processando...' : 'Redefinir Senha'}
                                {!isSubmitting && <span className="material-symbols-outlined font-normal">save</span>}
                            </div>
                        </motion.button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};
