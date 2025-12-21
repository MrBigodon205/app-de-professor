import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { Subject } from '../types';

export const TeacherProfile: React.FC = () => {
    const { currentUser, updateProfile } = useAuth();
    const theme = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [isEditingPhoto, setIsEditingPhoto] = useState(false);
    const [mainSubject, setMainSubject] = useState('');
    const [secondarySubjects, setSecondarySubjects] = useState<string[]>([]);
    const [newSubject, setNewSubject] = useState('');
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setEmail(currentUser.email);
            setPhotoUrl(currentUser.photoUrl || '');
            setMainSubject(currentUser.subject || '');
            setSecondarySubjects(currentUser.subjects || []);
        }
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!name || !email) {
            setMessage({ type: 'error', text: 'Nome e Email são obrigatórios.' });
            return;
        }

        const data: any = {
            name,
            email,
            photoUrl,
            subject: mainSubject as Subject || '',
            subjects: secondarySubjects
        };
        if (password) data.password = password;

        const success = await updateProfile(data);
        if (success) {
            setMessage({ type: 'success', text: 'Dados atualizados com sucesso!' });
            setIsEditingPhoto(false);
            setPassword(''); // Clear password field after success
        } else {
            setMessage({ type: 'error', text: 'Erro ao atualizar dados.' });
        }

        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddSubject = async () => {
        if (!newSubject) return;

        if (secondarySubjects.includes(newSubject)) {
            setMessage({ type: 'error', text: 'Disciplina já adicionada.' });
            return;
        }

        const updatedSubjects = [...secondarySubjects, newSubject];
        const success = await updateProfile({ subjects: updatedSubjects });

        if (success) {
            setSecondarySubjects(updatedSubjects);
            setNewSubject('');
            setIsAddingSubject(false);
            setMessage({ type: 'success', text: 'Disciplina secundária adicionada!' });
        } else {
            setMessage({ type: 'error', text: 'Erro ao adicionar disciplina.' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    const handleRemoveSubject = async (subjectToRemove: string) => {
        if (!confirm(`Deseja remover ${subjectToRemove}?`)) return;

        const updatedSubjects = secondarySubjects.filter(s => s !== subjectToRemove);
        const success = await updateProfile({ subjects: updatedSubjects });

        if (success) {
            setSecondarySubjects(updatedSubjects);
            setMessage({ type: 'success', text: 'Disciplina removida!' });
        } else {
            setMessage({ type: 'error', text: 'Erro ao remover disciplina.' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    if (!currentUser) return (
        <div className="flex h-full items-center justify-center p-10">
            <div className="flex flex-col items-center gap-3">
                <div className={`size-8 rounded-full border-4 border-${theme.primaryColor} border-t-transparent animate-spin`}></div>
                <span className="text-slate-500 font-medium">Carregando perfil...</span>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <nav className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <span className={`hover:text-${theme.primaryColor} transition-colors cursor-pointer`}>Acerta+</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className={`hover:text-${theme.primaryColor} transition-colors cursor-pointer`}>Configurações</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className={`text-${theme.primaryColor}`}>Meu Perfil</span>
                </nav>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Meu Perfil</h1>
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-base md:text-lg">Gerencie suas informações e preferências.</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                    : 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'}`}>
                    <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column - ID Card */}
                <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800 group">
                        <div className={`h-40 bg-gradient-to-br ${theme.bgGradient} relative rounded-t-[32px] md:rounded-t-[40px] overflow-hidden z-0`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 transform translate-x-4 -translate-y-4 transition-transform group-hover:scale-110 duration-700">
                                <span className="material-symbols-outlined text-[120px] text-white">{theme.icon}</span>
                            </div>
                        </div>

                        <div className="px-8 pb-10 -mt-24 relative z-20 flex flex-col items-center">
                            <div className="relative group mb-6">
                                <div className="size-48 rounded-full border-8 border-white dark:border-slate-800 shadow-2xl overflow-hidden group-hover:scale-105 transition-all bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=200&h=200&auto=format&fit=crop';
                                            }}
                                        />
                                    ) : (
                                        <span className="text-slate-400 font-black text-6xl">
                                            {currentUser.name.substring(0, 2).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                                    className={`absolute -bottom-2 -right-2 bg-${theme.primaryColor} text-white size-10 rounded-2xl shadow-lg border-4 border-white dark:border-slate-900 flex items-center justify-center group-hover:scale-110 transition-transform h-10 w-10`}
                                >
                                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                                </button>
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1">{currentUser.name}</h2>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-6 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">Professor Titular</p>

                            <div className="w-full space-y-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email</label>
                                    <p className="text-slate-700 dark:text-slate-200 font-bold truncate">{currentUser.email}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Especialidade</label>
                                    <p className={`text-${theme.primaryColor} font-black flex items-center gap-2`}>
                                        <span className="material-symbols-outlined text-[18px]">{theme.icon}</span>
                                        {mainSubject || 'Não Definida'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isEditingPhoto && (
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] shadow-lg border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">URL da Foto de Perfil</label>
                            <div className="flex flex-col gap-3">
                                <input
                                    className={`w-full h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all px-4 text-sm font-medium`}
                                    type="text"
                                    placeholder="https://sua-foto.com/perfil.jpg"
                                    value={photoUrl}
                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditingPhoto(false)} className="flex-1 h-10 rounded-xl text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs uppercase">Cancelar</button>
                                    <button onClick={handleSaveProfile} className={`flex-1 h-10 rounded-xl bg-${theme.primaryColor} text-white font-black shadow-lg shadow-${theme.primaryColor}/20 transition-all text-xs uppercase`}>Confirmar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Forms */}
                <div className="lg:col-span-8 flex flex-col gap-8 pb-10">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`size-12 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                <span className="material-symbols-outlined">badge</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Configurações Gerais</h3>
                                <p className="text-slate-500 font-medium">Atualize seu nome e senha de acesso.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                                <div className="relative group">
                                    <input
                                        className={`w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all pl-12 pr-4 font-bold text-slate-700 dark:text-white`}
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400">person</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha (Opcional)</label>
                                <div className="relative group">
                                    <input
                                        className={`w-full h-14 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-black focus:ring-4 focus:ring-${theme.primaryColor}/10 focus:border-${theme.primaryColor} transition-all pl-12 pr-4 font-bold text-slate-700 dark:text-white`}
                                        type="password"
                                        placeholder="Min. 6 caracteres"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <span className="material-symbols-outlined absolute left-4 top-4 text-slate-400">lock</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSaveProfile}
                                className={`flex items-center gap-3 bg-${theme.primaryColor} hover:opacity-90 text-white font-black h-14 px-8 rounded-2xl shadow-xl shadow-${theme.primaryColor}/20 transition-all active:scale-95 uppercase tracking-widest text-xs`}>
                                <span className="material-symbols-outlined">save</span>
                                Salvar Mudanças
                            </button>
                        </div>
                    </div>

                    {/* Disciplines Management Redesign */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-8">
                            <div className={`size-12 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                <span className="material-symbols-outlined">auto_stories</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Gestão de Disciplinas</h3>
                                <p className="text-slate-500 font-medium">Selecione as disciplinas que você leciona. A primeira define o tema do app.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                'Português', 'Matemática', 'Ciências', 'História', 'Geografia',
                                'Inglês', 'Artes', 'Educação Física', 'Ensino Religioso',
                                'Filosofia', 'Física', 'Química', 'Literatura', 'Redação', 'Projeto de Vida'
                            ].map(subject => {
                                const isSelected = mainSubject === subject || secondarySubjects.includes(subject);
                                const isMain = mainSubject === subject;

                                return (
                                    <button
                                        key={subject}
                                        onClick={() => {
                                            if (isMain) {
                                                // If it's main, removing it requires picking another main or leaving it empty
                                                setMainSubject('');
                                            } else if (secondarySubjects.includes(subject)) {
                                                setSecondarySubjects(prev => prev.filter(s => s !== subject));
                                            } else {
                                                if (!mainSubject) {
                                                    setMainSubject(subject);
                                                } else {
                                                    setSecondarySubjects(prev => [...prev, subject]);
                                                }
                                            }
                                        }}
                                        className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${isSelected
                                                ? `bg-white dark:bg-slate-800 border-${theme.primaryColor} shadow-md`
                                                : 'bg-slate-50 dark:bg-slate-950 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-2">
                                            <span className={`material-symbols-outlined text-xl ${isSelected ? `text-${theme.primaryColor}` : 'text-slate-300'}`}>
                                                {isSelected ? 'check_circle' : 'circle'}
                                            </span>
                                            {isMain && (
                                                <span className={`text-[10px] font-black uppercase tracking-widest bg-${theme.primaryColor} text-white px-2 py-0.5 rounded-md shadow-sm`}>Tema</span>
                                            )}
                                        </div>
                                        <span className={`text-xs font-black ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                            {subject}
                                        </span>

                                        {!isMain && isSelected && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setMainSubject(subject);
                                                    setSecondarySubjects(prev => [...prev.filter(s => s !== subject), mainSubject].filter(Boolean));
                                                }}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-700 p-1 rounded-md text-[10px] font-black text-slate-500 hover:text-primary"
                                                title="Tornar Principal"
                                            >
                                                <span className="material-symbols-outlined text-sm">star</span>
                                            </button>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* App Appearance Preview */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative group">
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-${theme.primaryColor}/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl group-hover:from-${theme.primaryColor}/10 transition-colors duration-700`}></div>

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className={`size-12 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                                <span className="material-symbols-outlined">palette</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Identidade Visual</h3>
                                <p className="text-slate-500 font-medium">Customize como o sistema se adapta à sua disciplina.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6 relative z-10">
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Tema Atual</p>
                                        <p className={`text-xl font-black text-slate-900 dark:text-white`}>{theme.subject}</p>
                                    </div>
                                    <div className={`size-14 rounded-2xl bg-gradient-to-br ${theme.bgGradient} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                                        <span className="material-symbols-outlined text-3xl">{theme.icon}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-4 rounded-full bg-${theme.primaryColor}`}></div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Primária: <span className="font-mono text-slate-400">Tailwind {theme.primaryColor}</span></span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-4 rounded-full bg-${theme.secondaryColor}`}></div>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Secundária: <span className="font-mono text-slate-400">Tailwind {theme.secondaryColor}</span></span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <p className="text-xs italic text-slate-400 leading-relaxed">
                                            "O sistema ajusta automaticamente ícones, gradientes e tons baseado na sua disciplina principal para proporcionar uma experiência personalizada."
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const element = document.getElementById('subject-select');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                    element?.focus();
                                }}
                                className={`w-full h-14 rounded-2xl border-2 border-dashed border-${theme.primaryColor}/30 text-${theme.primaryColor} font-black text-xs uppercase tracking-widest hover:bg-${theme.primaryColor}/5 transition-all`}
                            >
                                Alterar Disciplina Principal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};