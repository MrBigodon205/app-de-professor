import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { updatePassword } = useAuth();
    const theme = useTheme();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    React.useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                setError('Sessão de recuperação não encontrada. Por favor, solicite um novo e-mail.');
            }
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsSubmitting(true);
        const result = await updatePassword(password);

        if (result.success) {
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError(result.error || 'Erro ao atualizar senha.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 font-display bg-slate-950 overflow-hidden relative selection:bg-primary/30 selection:text-white">
            {/* Immersive Background (Same as Login) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] will-change-transform"
                />
                <motion.div
                    animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[100px] will-change-transform"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative z-10 w-full max-w-md glass-card-premium overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] p-8 lg:p-12"
            >
                <div className="flex flex-col items-center mb-10">
                    <div className="bg-gradient-to-tr from-primary to-emerald-400 p-4 rounded-2xl mb-6 shadow-xl shadow-primary/20 border border-white/10">
                        <span className="material-symbols-outlined text-white text-4xl">lock_open</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight text-center">
                        Nova Senha
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 text-center">
                        Defina sua nova chave de acesso para o sistema.
                    </p>
                </div>

                {checkingSession ? (
                    <div className="flex flex-col items-center py-10">
                        <svg className="animate-spin h-10 w-10 text-primary mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-400 text-sm">Validando sessão...</p>
                    </div>
                ) : success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-4"
                    >
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                                <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white">Senha Redefinida!</h3>
                        <p className="text-slate-400 text-sm">
                            Sua senha foi atualizada com sucesso. Redirecionando para o login...
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center gap-3"
                            >
                                <span className="material-symbols-outlined text-[20px]">error</span>
                                {error}
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                            <div className="relative group">
                                <input
                                    className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 pl-5 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
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

                        <div className="pt-4">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full relative group overflow-hidden h-14 rounded-2xl"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 transition-all group-hover:scale-105" />
                                <div className="relative h-full flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Processando...
                                        </span>
                                    ) : (
                                        <>
                                            Redefinir Senha
                                            <span className="material-symbols-outlined font-normal">save</span>
                                        </>
                                    )}
                                </div>
                            </motion.button>
                        </div>
                    </form>
                )}
            </motion.div>
        </div>
    );
};
