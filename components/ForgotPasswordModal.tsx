import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const result = await resetPassword(email);
        if (result.success) {
            setSuccess(true);
        } else {
            setError(result.error || 'Erro ao processar solicitação.');
        }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-8 lg:p-10"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-6 group transition-all">
                            <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Recuperar Senha</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {success
                                ? 'Enviamos as instruções para o seu e-mail corporativo. Verifique sua caixa de entrada.'
                                : 'Insira seu e-mail para receber um link de redefinição de senha.'}
                        </p>
                    </div>

                    {!success ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-[20px]">error</span>
                                    {error}
                                </motion.div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                                <input
                                    className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-display"
                                    type="email"
                                    placeholder="exemplo@escola.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <div className="flex justify-end pr-1 mt-1">
                                    <a
                                        href="https://wa.me/557187599246/?text=Ol%C3%A1!%20Esqueci%20meu%20e-mail%20de%20acesso%20ao%20sistema%20Prof.%20Acerta%2B.%20Poderia%20me%20ajudar%3F"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-widest"
                                    >
                                        Esqueci meu e-mail
                                    </a>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full relative group overflow-hidden h-14 rounded-2xl"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 transition-all group-hover:scale-105" />
                                    <div className="relative h-full flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                                        {isSubmitting ? (
                                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : (
                                            <>
                                                Enviar Link
                                                <span className="material-symbols-outlined font-normal">send</span>
                                            </>
                                        )}
                                    </div>
                                </motion.button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full h-12 flex items-center justify-center text-slate-500 hover:text-white text-sm font-bold transition-colors"
                                >
                                    Voltar para o login
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="pt-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full relative group overflow-hidden h-14 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all"
                            >
                                <div className="relative h-full flex items-center justify-center gap-3 text-emerald-400 font-bold uppercase tracking-widest text-sm">
                                    Entendi, fechar
                                    <span className="material-symbols-outlined font-normal">verified</span>
                                </div>
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
