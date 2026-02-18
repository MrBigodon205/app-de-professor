import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { ImageCropperModal } from './ImageCropperModal';
import { DynamicSelect } from './DynamicSelect';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS } from '../constants/motion';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: Tab;
}

type Tab = 'profile' | 'security' | 'schools';

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, defaultTab = 'profile' }) => {
    // ... hooks ...
    const { currentUser, updateProfile, logout, updateActiveSubject } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigate = (path: string) => {
        navigate(path);
        onClose();
    };

    const theme = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);

    // Reset tab on open
    useEffect(() => {
        if (isOpen) setActiveTab(defaultTab);
    }, [isOpen, defaultTab]);

    // ... existing interactions ...
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [schools, setSchools] = useState<any[]>([]);

    const fetchUserSchools = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('institution_teachers')
                .select(`
                    id,
                    role,
                    institution:institutions (id, name, owner_id)
                `)
                .eq('user_id', currentUser.id);

            if (error) throw error;
            setSchools(data || []);
        } catch (err) {
            console.error("Error fetching schools:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && (activeTab === 'schools' || activeTab === 'profile') && currentUser) {
            fetchUserSchools();
        }
    }, [isOpen, activeTab, currentUser]);

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

    if (!currentUser) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem válido.');
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setCropImageSrc(objectUrl);
        setIsCropperOpen(true);
        e.target.value = '';
    };

    const handleUploadCroppedImage = async (blob: Blob) => {
        setUploading(true);
        try {
            const fileExt = 'jpeg';
            const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, blob, { contentType: 'image/jpeg' });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await updateProfile({ photoUrl: publicUrl });
        } catch (error: any) {
            console.error('Error uploading:', error);
            alert('Erro ao fazer upload: ' + error.message);
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
        const finalSubjects = Array.from(new Set([...selectedSubjects, subject]));
        const success = await updateProfile({ name, email, subject: subject as any, subjects: finalSubjects });
        setLoading(false);
        if (success) {
            updateActiveSubject(subject);
            alert('Perfil atualizado!');
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
            alert('Senha alterada!');
            setPassword('');
            setConfirmPassword('');
        } else {
            alert('Erro ao alterar senha.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        variants={VARIANTS.scale}
                        initial="initial"
                        animate="animate"
                        exit="exit"

                        className="relative glass-card-premium w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-4xl overflow-hidden flex flex-col md:flex-row shadow-2xl border-0 md:border border-white/20"
                    >
                        {/* Sidebar */}
                        <div className="relative w-full md:w-80 bg-surface-section/50 backdrop-blur-xl p-4 md:p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10 shrink-0 landscape:w-64">
                            <nav className="w-full grid grid-cols-3 md:flex md:flex-col gap-2 md:gap-3">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-2 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'profile'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-6 md:size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'profile' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-base md:text-lg">person</span>
                                    </div>
                                    <span className="text-xs md:text-base hidden sm:inline">Dados</span>
                                    {activeTab === 'profile' && <div className={`absolute bottom-0 md:bottom-auto md:right-0 md:top-0 md:h-full left-0 right-0 h-0.5 md:w-1 bg-${theme.primaryColor} rounded-full`}></div>}
                                </button>

                                <button
                                    onClick={() => setActiveTab('schools')}
                                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-2 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'schools'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-6 md:size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'schools' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-base md:text-lg">school</span>
                                    </div>
                                    <span className="text-xs md:text-base hidden sm:inline">Escolas</span>
                                    {activeTab === 'schools' && <div className={`absolute bottom-0 md:bottom-auto md:right-0 md:top-0 md:h-full left-0 right-0 h-0.5 md:w-1 bg-${theme.primaryColor} rounded-full`}></div>}
                                </button>

                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-4 px-2 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-bold transition-all duration-300 relative group overflow-hidden ${activeTab === 'security'
                                        ? `bg-surface-elevated shadow-lg text-${theme.primaryColor} border border-white/20`
                                        : 'text-text-secondary hover:bg-surface-elevated/50 hover:text-text-primary'
                                        }`}
                                >
                                    <div className={`size-6 md:size-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'security' ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'bg-surface-subtle text-text-muted group-hover:bg-white group-hover:shadow-md'}`}>
                                        <span className="material-symbols-outlined text-base md:text-lg">lock</span>
                                    </div>
                                    <span className="text-xs md:text-base hidden sm:inline">Segurança</span>
                                    {activeTab === 'security' && <div className={`absolute bottom-0 md:bottom-auto md:right-0 md:top-0 md:h-full left-0 right-0 h-0.5 md:w-1 bg-${theme.primaryColor} rounded-full`}></div>}
                                </button>
                            </nav>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-surface-card/30 p-0 relative min-h-0">
                            <button onClick={onClose} className="flex absolute top-4 right-4 md:top-6 md:right-6 size-10 items-center justify-center rounded-full bg-surface-subtle hover:bg-red-50 text-text-muted hover:text-red-500 transition-all z-20 shadow-sm border border-border-subtle group">
                                <span className="material-symbols-outlined text-xl group-hover:rotate-90 transition-transform duration-300">close</span>
                            </button>

                            <div className="p-4 md:p-10 max-w-2xl mx-auto md:min-h-full flex flex-col pb-20 md:pb-10">
                                <div className="mb-6 md:mb-8 mt-2 md:mt-0">
                                    <h1 className="text-2xl md:text-3xl font-black text-text-primary mb-1 md:mb-2 tracking-tight">
                                        {activeTab === 'profile' ? 'Editar Perfil' : activeTab === 'schools' ? 'Minhas Escolas' : 'Segurança'}
                                    </h1>
                                    <p className="text-text-muted font-medium text-sm md:text-lg">
                                        {activeTab === 'profile' ? 'Suas informações.' : activeTab === 'schools' ? 'Gerencie suas instituições.' : 'Proteção da conta.'}
                                    </p>
                                </div>

                                {activeTab === 'profile' && (
                                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                        <div className="flex flex-col items-center mb-6 md:mb-8">
                                            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                                <div className={`size-24 md:size-32 rounded-full overflow-hidden border-4 border-surface-card shadow-2xl relative z-10 transition-transform duration-300 group-hover:scale-105`}>
                                                    {uploading ? (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
                                                            <span className="material-symbols-outlined animate-spin text-white/50 text-3xl">refresh</span>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={currentUser?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || '')}&background=random`}
                                                            alt="Profile"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                                                        <span className="material-symbols-outlined text-white text-3xl drop-shadow-lg scale-90 group-hover:scale-100 transition-transform">photo_camera</span>
                                                    </div>
                                                </div>
                                                <div className={`absolute -bottom-2 -right-2 size-8 md:size-10 bg-${theme.primaryColor} rounded-full flex items-center justify-center text-white shadow-lg border-2 border-surface-base z-20 group-hover:scale-110 transition-transform`}>
                                                    <span className="material-symbols-outlined text-sm md:text-base">edit</span>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                title="Carregar foto de perfil"
                                            />
                                            <p className="mt-3 text-xs md:text-sm text-text-muted font-medium bg-surface-subtle px-3 py-1 rounded-full border border-border-default">
                                                Toque para alterar a foto
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:gap-6">
                                            <div className="group">
                                                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 md:mb-2 ml-1 group-focus-within:text-primary transition-colors">Nome Completo</label>
                                                <div className="relative">
                                                    <motion.input
                                                        whileFocus={{ scale: 1.01 }}
                                                        transition={{ duration: 0.2 }}
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="input-premium !pl-12 md:!pl-14"
                                                        placeholder="Seu nome"
                                                        title="Nome Completo"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg md:text-xl group-focus-within:text-primary transition-colors">badge</span>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Email (Não editável)</label>
                                                <div className="relative opacity-70">
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        disabled
                                                        className="input-premium !pl-12 md:!pl-14 bg-surface-subtle cursor-not-allowed border-dashed"
                                                        title="Email"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg md:text-xl">mail</span>
                                                </div>
                                            </div>

                                            {currentUser?.account_type === 'institutional' ? (
                                                <div className="group animate-in fade-in zoom-in-95 duration-300">
                                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col items-center text-center gap-2">
                                                        <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-1">
                                                            <span className="material-symbols-outlined text-2xl">local_police</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest text-xs mb-1">Função</h3>
                                                            <p className="text-lg font-bold text-text-primary">Coordenador da Instituição</p>
                                                            {schools.length > 0 && (
                                                                <p className="text-sm font-medium text-text-muted mt-1">{schools[0].institution?.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="group relative z-50">
                                                        <DynamicSelect
                                                            label="Disciplina Principal"
                                                            value={subject}
                                                            onChange={(val: string) => setSubject(val)}
                                                            options={availableSubjects.map(s => ({ value: s, label: s, icon: 'menu_book' }))}
                                                            placeholder="Selecione sua disciplina"
                                                            className="w-full"
                                                        />
                                                    </div>

                                                    <div className="group">
                                                        <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 md:mb-2 ml-1">Disciplinas Adicionais</label>
                                                        <div className="flex flex-wrap gap-2 p-3 bg-surface-subtle/30 rounded-2xl border border-border-subtle hover:border-border-default transition-colors">
                                                            {availableSubjects.map((subj) => (
                                                                <button
                                                                    key={subj}
                                                                    type="button"
                                                                    onClick={() => toggleSubject(subj)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedSubjects.includes(subj)
                                                                        ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor} text-${theme.primaryColor} shadow-sm scale-105`
                                                                        : 'bg-surface-card border-border-default text-text-muted hover:border-text-muted/50 hover:bg-surface-elevated'
                                                                        }`}
                                                                >
                                                                    {subj}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] text-text-muted mt-2 ml-1">Selecione todas as matérias que você leciona para personalizar o conteúdo.</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="pt-4 md:pt-6 mt-6 md:mt-auto border-t border-border-default flex justify-end">
                                            <button onClick={handleSaveProfile} disabled={loading} className={`btn-premium w-full md:w-auto px-8 py-3.5 md:py-4 flex items-center justify-center gap-3 text-sm shadow-neon hover:shadow-neon-lg`}>
                                                {loading ? <span className="material-symbols-outlined animate-spin text-lg">refresh</span> : <span className="material-symbols-outlined text-lg">save</span>}
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'schools' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Espaço Ativo</h3>

                                            <div
                                                onClick={() => handleNavigate('/dashboard')}
                                                className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group overflow-hidden ${!location.pathname.startsWith('/institution/')
                                                    ? `border-primary bg-primary/5 shadow-lg shadow-primary/10`
                                                    : 'border-border-default bg-surface-card hover:border-primary/30 hover:bg-surface-elevated'
                                                    }`}
                                            >
                                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${!location.pathname.startsWith('/institution/')
                                                    ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30 scale-105'
                                                    : 'bg-surface-subtle text-text-muted group-hover:bg-primary/10 group-hover:text-primary'
                                                    }`}>
                                                    <span className="material-symbols-outlined text-xl">home</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-black text-text-primary block truncate">Minha Sala de Aula</span>
                                                    <span className="text-xs text-text-muted font-medium">Espaço pessoal do professor</span>
                                                </div>
                                                {!location.pathname.startsWith('/institution/') && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                                                        <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Ativo</span>
                                                    </div>
                                                )}
                                                {location.pathname.startsWith('/institution/') && (
                                                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">arrow_forward</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Minhas Escolas</h3>
                                            {loading ? (
                                                <div className="text-center p-6"><span className="material-symbols-outlined animate-spin text-2xl text-text-muted">refresh</span></div>
                                            ) : schools.length === 0 ? (
                                                <div className="text-center p-8 bg-surface-subtle/30 rounded-2xl border border-dashed border-text-muted/20">
                                                    <span className="material-symbols-outlined text-4xl text-text-muted/30 mb-2 block">corporate_fare</span>
                                                    <p className="text-text-muted text-sm font-medium">Nenhuma instituição vinculada.</p>
                                                    <p className="text-text-muted/60 text-xs mt-1">Crie ou participe de uma escola abaixo.</p>
                                                </div>
                                            ) : (
                                                schools.map((school) => {
                                                    const schoolId = school.institution?.id;
                                                    const isActive = location.pathname.startsWith(`/institution/${schoolId}`);
                                                    return (
                                                        <div
                                                            key={school.id}
                                                            onClick={() => handleNavigate(`/institution/${schoolId}/dashboard`)}
                                                            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group overflow-hidden ${isActive
                                                                ? `border-primary bg-primary/5 shadow-lg shadow-primary/10`
                                                                : 'border-border-default bg-surface-card hover:border-primary/30 hover:bg-surface-elevated'
                                                                }`}
                                                        >
                                                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive
                                                                ? 'bg-white dark:bg-slate-800 text-primary shadow-md border border-primary/20 scale-105'
                                                                : 'bg-surface-subtle text-text-muted group-hover:bg-primary/10 group-hover:text-primary'
                                                                }`}>
                                                                <span className="material-symbols-outlined text-xl">school</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <span className="font-black text-text-primary block truncate">{school.institution?.name}</span>
                                                                <span className="text-xs text-text-muted font-medium capitalize">
                                                                    {school.role === 'admin' ? '👑 Diretor' : school.role === 'coordinator' ? '🛡️ Coordenação' : '📚 Professor'}
                                                                </span>
                                                            </div>
                                                            {isActive ? (
                                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                                                                    <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                                                                    <span className="text-[10px] font-black uppercase tracking-wider">Ativo</span>
                                                                </div>
                                                            ) : (
                                                                <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors">arrow_forward</span>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <div className="pt-2">
                                            <div onClick={() => handleNavigate('/institution/join')} className="flex flex-col items-center justify-center p-5 rounded-2xl bg-surface-card border border-dashed border-border-default hover:border-secondary/50 hover:bg-secondary/5 transition-all group cursor-pointer">
                                                <span className="material-symbols-outlined text-2xl mb-1.5 text-secondary group-hover:scale-110 transition-transform">group_add</span>
                                                <span className="font-bold text-sm text-text-primary">Participar de uma Escola</span>
                                                <span className="text-[10px] text-text-muted mt-0.5">Entrar com código de convite</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'security' && (
                                    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-4 mb-6 md:mb-8">
                                            <span className="material-symbols-outlined text-yellow-500 text-2xl shrink-0">lock_reset</span>
                                            <div>
                                                <h3 className="font-bold text-yellow-500 text-sm mb-1">Alterar Senha de Acesso</h3>
                                                <p className="text-xs text-yellow-500/80 leading-relaxed">
                                                    Escolha uma senha forte. Após a alteração, você poderá precisar fazer login novamente.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-5 md:gap-6">
                                            <div className="group">
                                                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 md:mb-2 ml-1 group-focus-within:text-primary transition-colors">Nova Senha</label>
                                                <div className="relative">
                                                    <motion.input
                                                        whileFocus={{ scale: 1.01 }}
                                                        transition={{ duration: 0.2 }}
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="input-premium !pl-12 md:!pl-14"
                                                        placeholder="Digite a nova senha"
                                                        title="Nova Senha"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg md:text-xl group-focus-within:text-primary transition-colors">key</span>
                                                </div>
                                            </div>

                                            <div className="group">
                                                <label className="block text-xs font-black text-text-muted uppercase tracking-widest mb-1.5 md:mb-2 ml-1 group-focus-within:text-primary transition-colors">Confirmar Senha</label>
                                                <div className="relative">
                                                    <motion.input
                                                        whileFocus={{ scale: 1.01 }}
                                                        transition={{ duration: 0.2 }}
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="input-premium !pl-12 md:!pl-14"
                                                        placeholder="Repita a nova senha"
                                                        title="Confirmar Senha"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-text-muted text-lg md:text-xl group-focus-within:text-primary transition-colors">check_circle</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 md:pt-6 mt-auto border-t border-border-default flex justify-end">
                                            <button onClick={handleUpdatePassword} disabled={loading || !password} className={`btn-premium w-full md:w-auto px-8 py-3.5 md:py-4 flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:grayscale`}>
                                                <span className="material-symbols-outlined">security_update_good</span>
                                                Atualizar Senha
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            {/* CROPPER MODAL - Outside the AnimatePresence specific to the card to avoid conflicts, or handle appropriately */}
            {isCropperOpen && cropImageSrc && (
                <ImageCropperModal
                    isOpen={isCropperOpen}
                    imageSrc={cropImageSrc}
                    onCropComplete={handleUploadCroppedImage}
                    onClose={() => setIsCropperOpen(false)}
                />
            )}
        </AnimatePresence>
    );
};
