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



        // Read file as Data URL for cropper
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null);
            setIsCropperOpen(true);
        });
        reader.readAsDataURL(file);

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
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                ></div>

                <div className="relative glass-card-premium w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-auto md:max-h-[85vh] landscape:h-[95dvh] landscape:md:h-auto shadow-2xl border border-white/20">

                    {/* HERO HEADER (Mobile Only) */}
                    <div className="relative h-32 md:hidden shrink-0 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} opacity-90`}></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md transition-all z-20 shadow-lg"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    {/* Sidebar (Left) - Premium Design */}
                    <div className="relative w-full md:w-80 bg-surface-section/50 backdrop-blur-xl p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 shrink-0 landscape:p-4 landscape:w-64 landscape:md:w-80">
                        {/* Decorative Gradient Blob */}
                        <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-${theme.primaryColor}/10 to-transparent pointer-events-none md:block hidden`}></div>

                        {/* Avatar Upload - Floating Effect */}
                        <div className="relative group mb-6 -mt-16 md:mt-4 z-10">
                            <div className="relative p-1 rounded-full bg-gradient-to-br from-white/50 to-white/10 backdrop-blur-md shadow-2xl shadow-black/20">
                                <div className="size-32 rounded-full overflow-hidden relative border-4 border-surface-card bg-surface-subtle">
                                    {currentUser.photoUrl ? (
                                        <img
                                            src={currentUser.photoUrl}
                                            alt={currentUser.name}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className={`size-full flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white`}>
                                            {currentUser.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={`absolute bottom-1 right-1 p-3 rounded-full shadow-neon text-white hover:scale-110 active:scale-95 transition-all outline-none btn-premium bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {uploading ? 'sync' : 'photo_camera'}
                                </span>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" title="Upload de foto de perfil" />
                        </div>

                        <div className="flex flex-col items-center z-10 w-full">
                            <h2 className="text-2xl font-black text-text-primary text-center leading-tight mb-1 landscape:text-lg tracking-tight">
                                {currentUser.name}
                            </h2>
                            <p className="text-sm font-bold text-text-muted mb-8 text-center landscape:mb-4 bg-surface-subtle/50 px-3 py-1 rounded-full border border-white/5">
                                {currentUser.email}
                            </p>

                            <nav className="w-full space-y-3">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'profile'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'profile' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-lg">person</span>
                                    </div>
                                    Dados Pessoais
                                    {activeTab === 'profile' && <div className={`absolute right-0 top-0 bottom-0 w-1 bg-${theme.primaryColor} rounded-l-full`}></div>}
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'security'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'security' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-lg">lock</span>
                                    </div>
                                    Segurança
                                    {activeTab === 'security' && <div className={`absolute right-0 top-0 bottom-0 w-1 bg-${theme.primaryColor} rounded-l-full`}></div>}
                                </button>
                            </nav>
                        </div>

                        <div className="mt-auto pt-6 w-full z-10">
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
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-card/30 p-0 relative">
                        {/* Desktop Close Button */}
                        <button
                            onClick={onClose}
                            className="hidden md:flex absolute top-6 right-6 size-10 items-center justify-center rounded-full bg-surface-subtle hover:bg-red-50 text-text-muted hover:text-red-500 transition-all z-20 shadow-sm border border-border-subtle group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">close</span>
                        </button>

                        <div className="p-6 md:p-10 max-w-2xl mx-auto min-h-full flex flex-col">
                            <div className="mb-8">
                                <h1 className="text-3xl font-black text-text-primary mb-2 tracking-tight">
                                    {activeTab === 'profile' ? 'Editar Perfil' : 'Segurança e Acesso'}
                                </h1>
                                <p className="text-text-muted font-medium text-lg">
                                    {activeTab === 'profile' ? 'Gerencie suas informações e preferências.' : 'Mantenha sua conta protegida.'}
                                </p>
                            </div>

                            {activeTab === 'profile' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                    <div className="grid grid-cols-1 gap-6">
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
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-surface-subtle/30 border border-white/5">
                                                {availableSubjects.map(subj => {
                                                    const isSelected = selectedSubjects.includes(subj) || subject === subj;
                                                    const isMain = subject === subj;
                                                    return (
                                                        <button
                                                            key={subj}
                                                            onClick={() => toggleSubject(subj)}
                                                            className={`
                                                                relative px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-between group overflow-hidden
                                                                ${isSelected
                                                                    ? `bg-white dark:bg-white/10 text-${theme.primaryColor} shadow-lg ring-2 ring-${theme.primaryColor}/20`
                                                                    : 'bg-surface-card hover:bg-white dark:hover:bg-white/5 text-text-secondary hover:shadow-md'
                                                                }
                                                            `}
                                                        >
                                                            <span className="z-10">{subj}</span>
                                                            {isSelected && <span className="material-symbols-outlined text-sm z-10">check</span>}
                                                            {isMain && <div className={`absolute inset-0 bg-${theme.primaryColor}/5 z-0`}></div>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-auto border-t border-border-default flex justify-end">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className={`btn-premium px-8 py-4 flex items-center gap-3 text-sm shadow-neon hover:shadow-neon-lg`}
                                        >
                                            {loading ? (
                                                <span className="material-symbols-outlined animate-spin text-lg">refresh</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-lg">save</span>
                                            )}
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                    <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 flex items-start gap-4">
                                        <span className="material-symbols-outlined text-amber-500 text-3xl shrink-0">lock_reset</span>
                                        <div>
                                            <h3 className="font-bold text-amber-700 dark:text-amber-400 mb-1">Alterar Senha</h3>
                                            <p className="text-xs text-amber-600/80 dark:text-amber-500 leading-relaxed">
                                                Escolha uma senha forte com pelo menos 6 caracteres. Após a alteração, você precisará fazer login novamente em outros dispositivos.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Nova Senha</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="input-premium pl-12"
                                                />
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">key</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-text-muted mb-2 ml-1">Confirmar Senha</label>
                                            <div className="relative">
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    className="input-premium pl-12"
                                                />
                                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">lock</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-auto border-t border-border-default flex justify-end">
                                        <button
                                            onClick={handleUpdatePassword}
                                            disabled={loading || !password}
                                            className={`btn-premium px-8 py-4 flex items-center gap-3 text-sm disabled:opacity-50 disabled:grayscale`}
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
