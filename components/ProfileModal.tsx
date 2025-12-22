import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'profile' | 'security';

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateProfile, logout } = useAuth();
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [subject, setSubject] = useState('');
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
            if (currentUser) {
                setName(currentUser.name);
                setEmail(currentUser.email);
                setSubject(currentUser.subject || 'Matemática');
                setPassword('');
                setConfirmPassword('');
            }
        }
    }, [isOpen, currentUser]);

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('school_subjects')
                .select('name')
                .order('name');

            if (data) {
                setAvailableSubjects(data.map(s => s.name));
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setAvailableSubjects(['Matemática', 'Português', 'História', 'Geografia', 'Ciências']);
        }
    };

    if (!isOpen || !currentUser) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB.');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            await updateProfile({ photoUrl: base64String });
            setUploading(false);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSaveProfile = async () => {
        if (!name.trim() || !email.trim() || !subject) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        setLoading(true);
        const success = await updateProfile({ name, email, subject });
        setLoading(false);

        if (success) {
            alert('Perfil atualizado com sucesso!');
            // Optional: window.location.reload() if theme changes need deep refresh
            window.location.reload();
        } else {
            alert('Erro ao atualizar perfil.');
        }
    };

    const handleUpdatePassword = async () => {
        if (!password) return;
        if (password !== confirmPassword) {
            alert('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        const success = await updateProfile({ password });
        setLoading(false);

        if (success) {
            alert('Senha alterada com sucesso!');
            setPassword('');
            setConfirmPassword('');
        } else {
            alert('Erro ao alterar senha.');
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] md:h-auto md:max-h-[80vh]">

                {/* Close Button Mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:hidden p-2 bg-slate-100 rounded-full z-10"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {/* Sidebar (Left) */}
                <div className={`w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 shrink-0`}>

                    {/* Avatar Upload */}
                    <div className="relative group mb-4">
                        <div
                            className="size-32 rounded-full border-4 border-white dark:border-slate-700 shadow-xl bg-cover bg-center bg-slate-200 dark:bg-slate-700"
                            style={{ backgroundImage: currentUser.photoUrl ? `url(${currentUser.photoUrl})` : undefined }}
                        >
                            {!currentUser.photoUrl && (
                                <div className={`size-full flex items-center justify-center text-4xl font-bold text-${theme.primaryColor} bg-white dark:bg-slate-800`}>
                                    {currentUser.name.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all hover:scale-110 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">
                                {uploading ? 'sync' : 'photo_camera'}
                            </span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    </div>

                    <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center leading-tight mb-1">
                        {currentUser.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mb-6 text-center">{currentUser.email}</p>

                    <nav className="w-full space-y-2">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile'
                                    ? `bg-white dark:bg-slate-700 shadow-sm text-${theme.primaryColor}`
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">person</span>
                            Dados Pessoais
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security'
                                    ? `bg-white dark:bg-slate-700 shadow-sm text-${theme.primaryColor}`
                                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined">lock</span>
                            Segurança
                        </button>
                    </nav>

                    <div className="mt-auto pt-6 w-full">
                        <button
                            onClick={() => { logout(); onClose(); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 transition-all"
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Sair da Conta
                        </button>
                    </div>
                </div>

                {/* Main Content (Right) */}
                <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                    <div className="max-w-xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {activeTab === 'profile' ? 'Editar Perfil' : 'Segurança'}
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    {activeTab === 'profile' ? 'Gerencie suas informações pessoais' : 'Atualize sua senha de acesso'}
                                </p>
                            </div>
                            <button onClick={onClose} className="hidden md:flex size-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nome Completo</label>
                                        <input
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-700 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Email</label>
                                        <input
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-700 dark:text-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Disciplina Principal</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {availableSubjects.map(subj => (
                                                <button
                                                    key={subj}
                                                    onClick={() => setSubject(subj)}
                                                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all truncate ${subject === subj
                                                            ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor} text-${theme.primaryColor}`
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {subj}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {loading && <span className="material-symbols-outlined animate-spin text-lg">refresh</span>}
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Digite a nova senha"
                                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-700 dark:text-white transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Confirmar Senha</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/50 outline-none font-bold text-slate-700 dark:text-white transition-all"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                                    <button
                                        onClick={handleUpdatePassword}
                                        disabled={loading || !password}
                                        className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        Atualizar Senha
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
