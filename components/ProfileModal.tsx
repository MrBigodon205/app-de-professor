import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { ImageCropperModal } from './ImageCropperModal';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Tab = 'profile' | 'security';

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, updateProfile, logout, updateActiveSubject } = useAuth();
    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Cropper State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
            if (currentUser) {
                setName(currentUser.name);
                setEmail(currentUser.email);
                setSubject(currentUser.subject || 'Matemática');
                setSelectedSubjects(currentUser.subjects || []);
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

        // Validate that it is an image
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem válido.');
            return;
        }

        // Use Object URL instead of FileReader (Base64) to save memory
        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
        setIsCropperOpen(true);

        // Reset input so same file can be selected again if needed
        e.target.value = '';
    };

    const handleUploadCroppedImage = async (blob: Blob) => {
        setUploading(true);
        try {
            // 1. Create a unique path
            const fileExt = 'jpeg'; // Cropper returns jpeg
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 2. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { contentType: 'image/jpeg' });

            if (uploadError) {
                throw uploadError;
            }

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 4. Update Profile with URL
            await updateProfile({ photoUrl: publicUrl });

            // Force refresh of image in UI if needed (React checks URL change usually)

        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem: ' + error.message);
        } finally {
            setUploading(false);
            setIsCropperOpen(false);
            setCropImageSrc(null);
        }
    };

    const handleSaveProfile = async () => {
        if (!name.trim() || !email.trim() || !subject) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        setLoading(true);
        // Ensure primary subject is included in selected subjects
        const finalSubjects = Array.from(new Set([...selectedSubjects, subject]));

        const success = await updateProfile({ name, email, subject: subject as any, subjects: finalSubjects });
        setLoading(false);

        if (success) {
            updateActiveSubject(subject);
            alert('Perfil atualizado com sucesso!');
        } else {
            alert('Erro ao atualizar perfil.');
        }
    };

    const toggleSubject = (subj: string) => {
        if (selectedSubjects.includes(subj)) {
            setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
        } else {
            setSelectedSubjects([...selectedSubjects, subj]);
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
        <>
            <div className={`fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200 ${isOpen ? '' : 'pointer-events-none opacity-0'}`}>
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                ></div>

                <div className="relative glass-card-premium w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-0 md:border border-white/20">

                    {/* HERO HEADER (Mobile Only) - Reduced Height */}
                    <div className="relative h-24 md:hidden shrink-0 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} opacity-90`}></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all z-20 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Sidebar / Mobile Header - Adaptive Layout */}
                    <div className="relative w-full md:w-80 bg-surface-section/50 backdrop-blur-xl p-4 md:p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 shrink-0 landscape:w-64">
                        {/* Decorative Gradient Blob (Desktop) */}
                        <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-${theme.primaryColor}/10 to-transparent pointer-events-none md:block hidden`}></div>

                        {/* Avatar Upload - Compact on Mobile */}
                        <div className="relative group mb-4 -mt-12 md:mt-4 z-10">
                            <div className="relative p-1 rounded-full bg-gradient-to-br from-white/50 to-white/10 backdrop-blur-md shadow-2xl shadow-black/20">
                                <div className="size-20 md:size-32 rounded-full overflow-hidden relative border-4 border-surface-card bg-surface-subtle">
                                    {currentUser.photoUrl ? (
                                        <img
                                            src={currentUser.photoUrl}
                                            alt={currentUser.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className={`size-full flex items-center justify-center text-3xl md:text-4xl font-bold bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white`}>
                                            {currentUser.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={`absolute bottom-0 right-0 p-2 md:p-3 rounded-full shadow-neon text-white hover:scale-110 active:scale-95 transition-all outline-none btn-premium bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`}
                            >
                                <span className="material-symbols-outlined text-base md:text-lg">
                                    {uploading ? 'sync' : 'photo_camera'}
                                </span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" title="Upload de foto de perfil" />
                        </div>

                        <div className="flex flex-col items-center z-10 w-full mb-4 md:mb-0">
                            <h2 className="text-xl md:text-2xl font-black text-text-primary text-center leading-tight mb-1 tracking-tight">
                                {currentUser.name}
                            </h2>
                            <p className="text-xs md:text-sm font-bold text-text-muted mb-4 md:mb-8 text-center bg-surface-subtle/50 px-3 py-1 rounded-full border border-white/5 truncate max-w-[200px]">
                                {currentUser.email}
                            </p>

                            {/* Mobile Tabs / Desktop Nav */}
                            <nav className="w-full grid grid-cols-2 md:flex md:flex-col gap-2 md:gap-3">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'profile'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-6 md:size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'profile' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-base md:text-lg">person</span>
                                    </div>
                                    <span className="text-sm md:text-base">Dados</span>
                                    {activeTab === 'profile' && <div className={`absolute bottom-0 md:bottom-auto md:right-0 md:top-0 md:h-full left-0 right-0 h-0.5 md:w-1 bg-${theme.primaryColor} rounded-full`}></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'security'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-6 md:size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'security' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-base md:text-lg">lock</span>
                                    </div>
                                    <span className="text-sm md:text-base">Segurança</span>
                                    {activeTab === 'security' && <div className={`absolute bottom-0 md:bottom-auto md:right-0 md:top-0 md:h-full left-0 right-0 h-0.5 md:w-1 bg-${theme.primaryColor} rounded-full`}></div>}
                                </button>
                            </nav>
                        </div>

                        <div className="mt-auto pt-4 md:pt-6 w-full z-10 hidden md:block">
                            <button
                                onClick={() => { logout(); onClose(); }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-red-500 hover:text-white bg-red-50/50 hover:bg-red-500 dark:bg-red-900/10 dark:hover:bg-red-600 transition-all active:scale-95 group"
                            >
                                <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">logout</span>
                                Sair da Conta
                            </button>
                        </div>
                    </div>

                    {/* Main Content (Right) - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-card/30 p-0 relative h-full">
                        {/* Desktop Close Button */}
                        <button
                            onClick={onClose}
                            className="hidden md:flex absolute top-6 right-6 size-10 items-center justify-center rounded-full bg-surface-subtle hover:bg-red-50 text-text-muted hover:text-red-500 transition-all z-20 shadow-sm border border-border-subtle group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">close</span>
                        </button>

                        <div className="p-4 md:p-10 max-w-2xl mx-auto md:min-h-full flex flex-col pb-20 md:pb-10">
                            <div className="mb-6 md:mb-8 mt-2 md:mt-0">
                                <h1 className="text-2xl md:text-3xl font-black text-text-primary mb-1 md:mb-2 tracking-tight">
                                    {activeTab === 'profile' ? 'Editar Perfil' : 'Segurança'}
                                </h1>
                                <p className="text-text-muted font-medium text-sm md:text-lg">
                                    {activeTab === 'profile' ? 'Suas informações.' : 'Proteção da conta.'}
                                </p>
                            </div>

                            {activeTab === 'profile' && (
                                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                    <div className="grid grid-cols-1 gap-5 md:gap-6">
                                        <div className="group">
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1 text-shadow-sm">Nome Completo</label>
                                            <input
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="Seu nome completo"
                                                title="Nome Completo"
                                                className="input-premium"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Email</label>
                                            <input
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="seu@email.com"
                                                title="Email"
                                                className="input-premium opacity-70"
                                                readOnly
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Disciplina Principal</label>
                                            <div className="relative">
                                                <select
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                    title="Disciplina Principal"
                                                    className="input-premium appearance-none cursor-pointer"
                                                >
                                                    {availableSubjects.map(subj => (
                                                        <option key={subj} value={subj}>{subj}</option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">expand_more</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-3 ml-1">Minhas Disciplinas</label>
                                            <div className="grid grid-cols-2 gap-2 md:gap-3 p-3 md:p-4 rounded-3xl bg-surface-subtle/30 border border-white/5">
                                                {availableSubjects.map(subj => {
                                                    const isSelected = selectedSubjects.includes(subj) || subject === subj;
                                                    const isMain = subject === subj;
                                                    return (
                                                        <button
                                                            key={subj}
                                                            onClick={() => toggleSubject(subj)}
                                                            className={`
                                                                relative px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-between group overflow-hidden
                                                                ${isSelected
                                                                    ? `bg-white dark:bg-white/10 text-${theme.primaryColor} shadow-lg ring-2 ring-${theme.primaryColor}/20`
                                                                    : 'bg-surface-card hover:bg-white dark:hover:bg-white/5 text-text-secondary hover:shadow-md'
                                                                }
                                                            `}
                                                        >
                                                            <span className="z-10 truncate mr-1">{subj}</span>
                                                            {isSelected && <span className="material-symbols-outlined text-xs md:text-sm z-10 shrink-0">check</span>}
                                                            {isMain && <div className={`absolute inset-0 bg-${theme.primaryColor}/5 z-0`}></div>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 md:pt-6 mt-6 md:mt-auto border-t border-border-default flex justify-end">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className={`btn-premium w-full md:w-auto px-8 py-3.5 md:py-4 flex items-center justify-center gap-3 text-sm shadow-neon hover:shadow-neon-lg`}
                                        >
                                            {loading ? (
                                                <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-lg">save</span>
                                            )}
                                            Salvar
                                        </button>
                                    </div>

                                    <div className="md:hidden pt-4 border-t border-border-default">
                                        <button
                                            onClick={() => { logout(); onClose(); }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-red-500 bg-red-50/50 dark:bg-red-900/10 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined">logout</span>
                                            Sair da Conta
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                    <div className="p-4 md:p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex items-start gap-3 md:gap-4">
                                        <span className="material-symbols-outlined text-amber-500 text-2xl md:text-3xl shrink-0">lock_reset</span>
                                        <div>
                                            <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-1 text-sm md:text-base">Alterar Senha</h3>
                                            <p className="text-xs text-amber-600/80 dark:text-amber-500 leading-relaxed">
                                                Use 6 caracteres ou mais.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-5 md:space-y-6">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Nova Senha</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="input-premium pl-10 md:pl-12"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-text-muted">key</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Confirmar</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="input-premium pl-10 md:pl-12"
                                                />
                                                <span className="material-symbols-outlined absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-text-muted">lock</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 md:pt-6 mt-auto border-t border-border-default flex justify-end">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={loading || !password}
                                            className={`btn-premium w-full md:w-auto px-8 py-3.5 md:py-4 flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:grayscale`}
                                        >
                                            <span className="material-symbols-outlined">security_update_good</span>
                                            Atualizar Senha
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CROPPER MODAL */}
            <ImageCropperModal
                isOpen={isCropperOpen}
                imageSrc={cropImageSrc}
                onClose={() => { setIsCropperOpen(false); setCropImageSrc(null); }}
                onCropComplete={handleUploadCroppedImage}
            />
        </>
    );
};
