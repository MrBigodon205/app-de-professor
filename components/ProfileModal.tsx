import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateProfile, logout } = useAuth();
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subject, setSubject] = useState('');
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const { data, error } = await supabase
                .from('school_subjects')
                .select('name')
                .order('name');

            if (error) throw error;
            if (data) {
                setAvailableSubjects(data.map(s => s.name));
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            // Fallback defaults if fetch fails
            setAvailableSubjects([
                'Matemática', 'Português', 'História', 'Geografia', 'Ciências',
                'Física', 'Química', 'Biologia', 'Inglês', 'Artes', 'Educação Física'
            ]);
        }
    };

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setSubject(currentUser.subject || 'Matemática');
            // Don't pre-fill password for security/UX
            setPassword('');
        }
    }, [currentUser, isOpen]);

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
            const success = await updateProfile({ photoUrl: base64String });
            setUploading(false);
            if (!success) {
                alert('Erro ao atualizar a foto de perfil. Tente novamente.');
            }
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSaveProfile = async () => {
        if (!name.trim() || !email.trim() || !subject) {
            alert('Nome, Email e Disciplina são obrigatórios.');
            return;
        }

        setLoading(true);
        const updates: any = { name, email, subject };
        if (password.trim()) {
            updates.password = password;
        }

        const success = await updateProfile(updates);
        setLoading(false);

        if (success) {
            setIsEditing(false);
            alert('Perfil atualizado com sucesso! Algumas alterações exigem recarregar a página.');
            window.location.reload(); // Force reload to apply theme changes heavily
        } else {
            alert('Erro ao atualizar perfil.');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header Background */}
                <div className={`h-32 bg-gradient-to-r ${theme.bgGradient} relative shrink-0`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md z-10"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Profile Content */}
                <div className="px-6 md:px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="relative -mt-16 mb-6 flex flex-col items-center">
                        {/* Avatar */}
                        <div className="relative group">
                            <div
                                className="size-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-cover bg-center bg-slate-200"
                                style={{
                                    backgroundImage: currentUser.photoUrl
                                        ? `url(${currentUser.photoUrl})`
                                        : undefined
                                }}
                            >
                                {!currentUser.photoUrl && (
                                    <div className={`size-full flex items-center justify-center text-4xl font-bold text-${theme.primaryColor} bg-slate-100 dark:bg-slate-800`}>
                                        {currentUser.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={triggerFileInput}
                                disabled={uploading}
                                className="absolute bottom-1 right-1 p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 hover:scale-110 transition-transform disabled:opacity-50"
                                title="Alterar foto"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {uploading ? 'sync' : 'photo_camera'}
                                </span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        {!isEditing ? (
                            <div className="mt-4 text-center">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
                                <p className="text-slate-500 font-medium">{currentUser.email}</p>

                                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-${theme.primaryColor}/10 text-${theme.primaryColor} font-bold text-xs uppercase tracking-wide`}>
                                    <span className="material-symbols-outlined text-sm">{theme.icon}</span>
                                    {currentUser.subject}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-center">
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold uppercase">
                                    Editando Perfil
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {isEditing ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-medium"
                                    />
                                </div>

                                {/* Subject Selector */}
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2 ml-1">Disciplina Principal</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                        {availableSubjects.map(subj => (
                                            <button
                                                key={subj}
                                                onClick={() => setSubject(subj)}
                                                className={`p-2 rounded-lg text-xs font-bold transition-all border ${subject === subj
                                                    ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor} text-${theme.primaryColor}`
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                            >
                                                {subj}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 ml-1">Senha (Opcional)</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Nova senha..."
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-medium"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                        className="flex-1 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">save</span>}
                                        Salvar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Informações</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Disciplina Principal</span>
                                            <span className="font-bold text-slate-900 dark:text-white">{currentUser.subject}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">ID do Usuário</span>
                                            <span className="font-mono text-xs text-slate-400">{currentUser.id.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">edit</span>
                                        Editar Perfil
                                    </button>
                                    <button
                                        onClick={() => {
                                            logout();
                                            onClose();
                                        }}
                                        className="flex-1 py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">logout</span>
                                        Sair
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
