import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { SUBJECTS } from '../types';

interface PasswordSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    mandatory?: boolean;
}

export const PasswordSetupModal: React.FC<PasswordSetupModalProps> = ({ isOpen, onClose, mandatory = false }) => {
    const { currentUser, updatePassword, updateProfile, updateActiveSubject } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Determine what needs to be set
    const needsPassword = !currentUser?.isPasswordSet;
    const needsSubject = !currentUser?.subject;

    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setConfirmPassword('');
            setSelectedSubject('');
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    // AUTO-CLOSE: If requirements are met externally (e.g. background fetch updates profile), close the modal.
    useEffect(() => {
        if (isOpen && !needsPassword && !needsSubject) {
            // console.log("Requirements met externally. Closing modal.");
            onClose();
        }
    }, [isOpen, needsPassword, needsSubject, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // 1. Validate Password if needed
            if (needsPassword) {
                if (password.length < 6) {
                    throw new Error('A senha deve ter pelo menos 6 caracteres.');
                }
                if (password !== confirmPassword) {
                    throw new Error('As senhas não coincidem.');
                }
            }

            // 2. Validate Subject if needed
            if (needsSubject && !selectedSubject) {
                throw new Error('Selecione uma disciplina para continuar.');
            }

            // 3. Update Password
            if (needsPassword) {
                const passResult = await updatePassword(password);
                if (!passResult.success) {
                    // EDGE CASE: User has a password but isPasswordSet is false locally/in DB.
                    // If Supabase says "new password should be different from the old password", 
                    // it means the user DOES have a password. We treat this as success.
                    const isSamePasswordError =
                        passResult.error?.includes('same as the old') ||
                        passResult.error?.includes('diferente da senha antiga');

                    if (isSamePasswordError) {
                        // User has password, just needs flag update
                        // console.log("Password confirmed via 'same password' error. Updating flag.");
                    } else {
                        throw new Error(passResult.error || 'Erro ao definir senha.');
                    }
                }
            }

            // 4. Update Profile (Subject + Mark Password Set)
            // ...
            const updates: any = {};
            if (needsSubject) updates.subject = selectedSubject;
            if (needsPassword) updates.isPasswordSet = true;

            const profileResult = await updateProfile(updates);
            if (!profileResult) throw new Error('Erro ao atualizar perfil.');

            // NEW: Update theme immediately for "wow" factor
            if (needsSubject) {
                updateActiveSubject(selectedSubject);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Erro inesperado. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl ${mandatory ? 'cursor-not-allowed' : ''}`}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-surface-elevated w-full max-w-lg rounded-3xl p-8 shadow-2xl border border-border-default relative overflow-hidden ${mandatory ? 'cursor-default' : ''}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-secondary" />

                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-surface-section flex items-center justify-center mx-auto mb-4 border-4 border-surface-card shadow-neon">
                            <span className="material-symbols-outlined text-4xl text-primary animate-pulse">
                                {needsPassword && needsSubject ? 'admin_panel_settings' : (needsSubject ? 'school' : 'lock_reset')}
                            </span>
                        </div>
                        <h2 className="text-2xl font-black text-text-primary mb-2">
                            {success ? 'Tudo Pronto!' : 'Complete seu Perfil'}
                        </h2>
                        {!success && (
                            <p className="text-sm text-text-secondary font-medium max-w-xs mx-auto">
                                Para garantir sua segurança e personalizar sua experiência, precisamos de algumas informações finais.
                            </p>
                        )}
                    </div>

                    {success ? (
                        <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                                <span className="material-symbols-outlined text-4xl">check</span>
                            </div>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Perfil atualizado!</p>
                            <p className="text-xs text-slate-400 mt-2">Redirecionando...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Subject Selection Section */}
                            {needsSubject && (
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">subject</span>
                                        Sua Disciplina Principal
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                                        {SUBJECTS.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSelectedSubject(s)}
                                                className={`px-2 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${selectedSubject === s
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                                    : 'bg-surface-section border-transparent text-text-secondary hover:bg-surface-subtle'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Password Section */}
                            {needsPassword && (
                                <div className="space-y-4 pt-2 border-t border-border-default">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">key</span>
                                            Definir Senha de Acesso
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-surface-section border border-border-default rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                            placeholder="Mínimo 6 caracteres"
                                            required={needsPassword}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-surface-section border border-border-default rounded-xl px-4 py-3.5 text-text-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium"
                                            placeholder="Confirme sua senha"
                                            required={needsPassword}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 text-xs font-bold rounded-r-lg shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <span className="material-symbols-outlined">warning</span>
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                {!mandatory && (
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3.5 bg-surface-section text-text-secondary rounded-2xl font-bold hover:bg-surface-subtle transition-colors"
                                    >
                                        Pular
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> : 'Salvar e Continuar'}
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
