import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

interface SectionProps {
    id: string;
    title: string;
    icon: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const InstructionSection: React.FC<SectionProps> = ({ id, title, icon, isOpen, onToggle, children }) => {
    const theme = useTheme();

    return (
        <motion.div
            id={id}
            initial={false}
            className={`group card overflow-hidden border transition-all duration-300 ${isOpen
                ? `border-${theme.primaryColor}/30 bg-white dark:bg-slate-800 shadow-xl shadow-${theme.primaryColor}/5`
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                } rounded-3xl`}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors"
            >
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`
             size-12 sm:size-14 rounded-2xl flex items-center justify-center transition-all duration-300
             ${isOpen
                            ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white shadow-lg shadow-${theme.primaryColor}/20 scale-110`
                            : `bg-${theme.primaryColor}/5 text-${theme.primaryColor} dark:bg-slate-700 dark:text-slate-300 group-hover:bg-${theme.primaryColor}/10`
                        }
           `}>
                        <span className="material-symbols-outlined text-2xl sm:text-3xl font-bold">{icon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${isOpen ? `text-${theme.primaryColor}` : 'text-slate-700 dark:text-slate-200'}`}>
                            {title}
                        </h3>
                        {!isOpen && (
                            <span className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">
                                Toque para ver detalhes
                            </span>
                        )}
                    </div>
                </div>
                <div className={`
            size-10 rounded-full flex items-center justify-center border transition-all duration-300
            ${isOpen
                        ? `bg-${theme.primaryColor}/10 border-${theme.primaryColor}/20 text-${theme.primaryColor} rotate-180`
                        : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'
                    }
          `}>
                    <span className="material-symbols-outlined font-bold">expand_more</span>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        <div className="px-6 pb-8 sm:px-8 sm:pb-10 pt-0 text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 mt-2 pt-8">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const Instructions: React.FC = () => {
    const theme = useTheme();
    const [openSection, setOpenSection] = useState<string | null>('classes');

    const toggleSection = (id: string) => {
        setOpenSection(active => active === id ? null : id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const Step = ({ number, title, text }: { number: number, title: string, text: React.ReactNode }) => (
        <div className="flex gap-4 group/step">
            <div className={`mt-1 size-7 rounded-2xl bg-${theme.primaryColor}/10 text-${theme.primaryColor} text-xs font-black flex items-center justify-center shrink-0 border border-${theme.primaryColor}/20 shadow-sm group-hover/step:scale-110 transition-transform`}>
                {number}
            </div>
            <div>
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">{title}</h5>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {text}
                </div>
            </div>
        </div>
    );

    const QuickAction = ({ icon, label, target }: { icon: string, label: string, target: string }) => (
        <button
            onClick={() => toggleSection(target)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 group"
        >
            <div className={`size-12 rounded-xl bg-${theme.primaryColor}/5 text-${theme.primaryColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    );

    return (
        <div className="min-h-full w-full pb-32 bg-slate-50/50 dark:bg-transparent">
            {/* Hero Section */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700`}>
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-${theme.primaryColor}/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none`}></div>

                <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center max-w-2xl mx-auto gap-6 bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-xl"
                    >
                        <div className={`p-4 rounded-3xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white shadow-xl shadow-${theme.primaryColor}/20 mb-2 rotate-3`}>
                            <span className="material-symbols-outlined text-5xl">auto_stories</span>
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                Guia Interativo
                            </h1>
                            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
                                Domine as funcionalidades do Prof. Acerta+
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20">
                {/* Fast Navigation */}
                <div className="-mt-8 mb-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickAction icon="school" label="Turmas" target="classes" />
                    <QuickAction icon="groups" label="Alunos" target="students" />
                    <QuickAction icon="dashboard" label="Agenda" target="dashboard" />
                    <QuickAction icon="history_edu" label="Histórico" target="observations" />
                </div>

                <div className="flex flex-col gap-6">

                    {/* 1. GESTÃO DE TURMAS */}
                    <InstructionSection
                        id="classes"
                        title="Gestão de Turmas e Séries"
                        icon="school"
                        isOpen={openSection === 'classes'}
                        onToggle={() => toggleSection('classes')}
                    >
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 mb-8">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 text-center justify-center">
                                <span className="material-symbols-outlined text-lg">info</span>
                                Comece por aqui! Sem criar séries e turmas, o app fica vazio de alunos.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-6">
                                <h4 className={`font-black text-${theme.primaryColor} uppercase text-[10px] tracking-widest`}>Organização Central</h4>
                                <div className="space-y-4">
                                    <Step number={1} title="Criar Série" text="No painel 'Gerenciar Turmas', defina suas séries (ex: 6º, 7º, 8º Anos)." />
                                    <Step number={2} title="Expandir Letras" text="Gere automaticamente as turmas A, B, C clicando no botão 'NOVA'." />
                                    <Step number={3} title="Troca Rápida" text="Use as pílulas de navegação no topo para alternar entre as turmas." />
                                </div>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4 group">
                                <div className="flex gap-2 w-full justify-center">
                                    <div className={`p-2 px-4 rounded-xl bg-${theme.primaryColor} text-white text-xs font-bold shadow-lg shadow-${theme.primaryColor}/20`}>Turma A</div>
                                    <div className="p-2 px-4 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">Turma B</div>
                                    <div className="p-2 px-4 rounded-xl bg-white dark:bg-slate-800 text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">Turma C</div>
                                </div>
                                <div className="w-full aspect-video bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${theme.primaryColor} to-transparent`}></div>
                                    <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700 animate-pulse">groups</span>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 2. ALUNOS & IMPORTAÇÃO */}
                    <InstructionSection
                        id="students"
                        title="Alunos: Cadastro e Importação em Massa"
                        icon="groups"
                        isOpen={openSection === 'students'}
                        onToggle={() => toggleSection('students')}
                    >
                        <div className="grid md:grid-cols-2 gap-10 items-center">
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest mb-6">Velocidade no Lançamento</h4>
                                <div className="space-y-6">
                                    <Step number={1} title="Importar Lista" text="Copie os nomes de qualquer arquivo e cole em 'Importar em Massa'." />
                                    <Step number={2} title="Processamento" text="O app separa os nomes e gera os números de chamada na hora." />
                                    <Step number={3} title="Sincronização" text="Todos os dados acadêmicos são criados automaticamente para cada aluno." />
                                </div>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-sm text-white">content_paste</span>
                                    </div>
                                    <div className="h-2 w-full bg-indigo-500/20 rounded-full"></div>
                                </div>
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 shadow-sm animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                                            <div className="size-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[10px] flex items-center justify-center text-indigo-500 font-bold">{i}</div>
                                            <div className="h-1.5 w-2/3 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 3. DASHBOARD & AGENDA */}
                    <InstructionSection
                        id="dashboard"
                        title="Dashboard: Sua Agenda Inteligente"
                        icon="dashboard"
                        isOpen={openSection === 'dashboard'}
                        onToggle={() => toggleSection('dashboard')}
                    >
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4 shadow-inner">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Agenda Hoje</span>
                                    <span className={`text-[10px] font-bold text-${theme.primaryColor}`}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</span>
                                </div>
                                <div className={`p-4 bg-white dark:bg-slate-800 rounded-2xl border-l-4 border-${theme.primaryColor} shadow-md`}>
                                    <div className="text-xs font-bold mb-1">Avaliação de Matemática</div>
                                    <div className="text-[10px] text-slate-400">7º Ano A • Unidade 1</div>
                                </div>
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-l-4 border-emerald-500 shadow-md translate-x-4 opacity-80 scale-95">
                                    <div className="text-xs font-bold mb-1">Trabalho de Biologia</div>
                                    <div className="text-[10px] text-slate-400">8º Ano B • Unidade 1</div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h4 className={`font-black text-${theme.primaryColor} uppercase text-[10px] tracking-widest`}>Foco e Produtividade</h4>
                                <p className="text-sm">O Dashboard remove o ruído e mostra apenas o que é relevante para o seu dia:</p>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="size-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-xl">event_upcoming</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm block">Próximas Atividades</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Prazos de entrega e provas nos próximos dias.</span>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="size-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-xl">warning</span>
                                        </div>
                                        <div>
                                            <span className="font-bold text-sm block">Alertas Recentes</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Últimas ocorrências registradas na turma ativa.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 4. PLANEJAMENTO BNCC */}
                    <InstructionSection
                        id="planning"
                        title="Planejamento e Automação BNCC"
                        icon="calendar_month"
                        isOpen={openSection === 'planning'}
                        onToggle={() => toggleSection('planning')}
                    >
                        <div className="space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
                                <div className="space-y-4 flex-1">
                                    <h4 className="font-black text-emerald-600 uppercase text-[10px] tracking-widest text-center md:text-left">Inteligência Pedagógica</h4>
                                    <p className="text-sm text-center md:text-left">O sistema entende a BNCC. Digite o código e veja a mágica:</p>
                                    <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                                        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold shadow-sm">EF06MA01</div>
                                        <span className="material-symbols-outlined text-slate-300">double_arrow</span>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 italic bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 max-w-xs leading-tight">
                                            "Compreender e utilizar o sistema de numeração decimal..."
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="text-center w-24 bg-blue-500 text-white p-4 rounded-3xl shadow-lg hover:translate-y-[-4px] transition-transform">
                                        <span className="material-symbols-outlined text-2xl mb-1">file_download</span>
                                        <span className="block text-[8px] font-black uppercase tracking-wider">Exportar</span>
                                    </div>
                                    <div className="text-center w-24 bg-emerald-500 text-white p-4 rounded-3xl shadow-lg hover:translate-y-[-4px] transition-transform">
                                        <span className="material-symbols-outlined text-2xl mb-1">content_copy</span>
                                        <span className="block text-[8px] font-black uppercase tracking-wider">Clonar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 5. ATIVIDADES & NOTAS */}
                    <InstructionSection
                        id="grades"
                        title="Atividades, Notas e Unidades"
                        icon="assignment"
                        isOpen={openSection === 'grades'}
                        onToggle={() => toggleSection('grades')}
                    >
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 items-center">
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest mb-6 border-l-4 border-rose-500 pl-4">Boletim Dinâmico</h4>
                                <ul className="space-y-6 text-sm">
                                    <li className="flex items-start gap-4">
                                        <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/30">
                                            <span className="material-symbols-outlined text-lg">bolt</span>
                                        </div>
                                        <span><strong>Lançamento Veloz:</strong> As notas são salvas enquanto você digita. Não existe botão 'salvar'.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="size-8 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                                            <span className="material-symbols-outlined text-lg">functions</span>
                                        </div>
                                        <span><strong>Cálculos Automáticos:</strong> Médias e somatórios são calculados instantaneamente por Unidade.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6">
                                <div className="flex gap-3 justify-center">
                                    {[1, 2, 3].map(u => (
                                        <div key={u} className={`size-10 rounded-2xl flex items-center justify-center text-xs font-black border transition-all ${u === 1 ? `bg-${theme.primaryColor} text-white border-${theme.primaryColor} shadow-lg` : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-50'}`}>U{u}</div>
                                    ))}
                                </div>
                                <div className="w-full space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <span className="text-xs font-bold">Prova Trimestral</span>
                                        <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black">PESO 4</div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 opacity-60">
                                        <span className="text-xs font-bold">Atividade Casa</span>
                                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-lg text-[10px] font-black uppercase">Peso 1</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 6. OCORRÊNCIAS & HISTÓRICO */}
                    <InstructionSection
                        id="observations"
                        title="Ocorrências e Linha do Tempo"
                        icon="history_edu"
                        isOpen={openSection === 'observations'}
                        onToggle={() => toggleSection('observations')}
                    >
                        <div className="space-y-10">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6">
                                    <h4 className="font-black text-amber-600 uppercase text-[10px] tracking-widest pl-4 border-l-4 border-amber-500">Histórico de Turma</h4>
                                    <p className="text-sm">Veja todos os acontecimentos de forma cronológica, filtrando por aluno ou tipo de evento.</p>
                                    <div className="p-5 bg-amber-50 dark:bg-amber-900/20 rounded-3xl border border-amber-100 dark:border-amber-800/20 relative overflow-hidden group">
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="size-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                                                <span className="material-symbols-outlined text-xl">delete_sweep</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-xs block truncate">Ação em Massa</span>
                                                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">Selecione vários registros e limpe o histórico com um clique.</p>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl translate-x-8 -translate-y-8"></div>
                                    </div>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
                                    <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Linha do Tempo Turma B</div>
                                    <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                                        <div className="relative flex items-center gap-3">
                                            <div className="absolute -left-[30px] size-[10px] rounded-full bg-emerald-500 border-4 border-white dark:border-slate-800 z-10 transition-transform hover:scale-150"></div>
                                            <span className="material-symbols-outlined text-emerald-500 text-lg">star</span>
                                            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        </div>
                                        <div className="relative flex items-center gap-3">
                                            <div className="absolute -left-[30px] size-[10px] rounded-full bg-rose-500 border-4 border-white dark:border-slate-800 z-10 transition-transform hover:scale-150"></div>
                                            <span className="material-symbols-outlined text-rose-500 text-lg">smartphone</span>
                                            <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        </div>
                                        <div className="relative flex items-center gap-3">
                                            <div className="absolute -left-[30px] size-[10px] rounded-full bg-amber-500 border-4 border-white dark:border-slate-800 z-10 transition-transform hover:scale-150"></div>
                                            <span className="material-symbols-outlined text-amber-500 text-lg">inventory_2</span>
                                            <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 7. FREQUÊNCIA RELÂMPAGO */}
                    <InstructionSection
                        id="attendance"
                        title="Frequência Relâmpago"
                        icon="co_present"
                        isOpen={openSection === 'attendance'}
                        onToggle={() => toggleSection('attendance')}
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h4 className="font-black text-rose-500 uppercase text-[10px] tracking-widest pl-4 border-l-4 border-rose-500">A Chamada de 10 Segundos</h4>
                                <p className="text-sm">Esqueça as chamadas demoradas. Use a lógica reversa:</p>
                                <ul className="space-y-4">
                                    <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 items-center">
                                        <div className="h-8 px-3 w-max rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-[9px] shadow-md shrink-0">PRESENÇA GERAL</div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Um clique para marcar todos como presentes.</p>
                                    </li>
                                    <li className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex gap-2">
                                            <div className="size-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs opacity-50">F</div>
                                            <div className="size-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">J</div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Alternar faltas ou justificativas clicando no aluno.</p>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/30 flex justify-center items-center h-full aspect-square md:aspect-auto md:w-64">
                                <div className="relative">
                                    <div className="size-32 rounded-full border-8 border-white dark:border-slate-800 flex items-center justify-center bg-rose-500 shadow-2xl animate-pulse">
                                        <span className="material-symbols-outlined text-5xl text-white">timer</span>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-black shadow-lg">10s</div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 8. PERSONALIZAÇÃO */}
                    <InstructionSection
                        id="customization"
                        title="Cores, Temas e Identidade"
                        icon="palette"
                        isOpen={openSection === 'customization'}
                        onToggle={() => toggleSection('customization')}
                    >
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-10 items-center justify-between">
                                <div className="flex-1 space-y-4">
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest pl-4 border-l-4 border-slate-800 dark:border-white">Experiência Visual</h4>
                                    <p className="text-sm">O Prof. Acerta+ é dinâmico. Escolha o tema que melhor se adapta à sua luz ambiente:</p>
                                    <div className="flex gap-4">
                                        <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2 group hover:shadow-lg transition-all hover:-translate-y-1">
                                            <span className="material-symbols-outlined text-slate-900 bg-slate-100 p-2 rounded-xl">light_mode</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Modo Claro</span>
                                        </div>
                                        <div className="flex-1 p-4 bg-slate-900 rounded-2xl border border-slate-700 flex flex-col items-center gap-2 group hover:shadow-lg transition-all hover:-translate-y-1">
                                            <span className="material-symbols-outlined text-white bg-slate-800 p-2 rounded-xl">dark_mode</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Modo Escuro</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-10 bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6 relative overflow-hidden">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 z-10">Cores de Destaque</div>
                                    <div className="flex flex-wrap gap-3 justify-center z-10 relative">
                                        {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500'].map((color, i) => (
                                            <div key={i} className={`size-8 rounded-full ${color} shadow-lg ring-4 ring-white dark:ring-slate-800 transition-transform hover:scale-125 hover:z-20`} style={{ marginLeft: i > 0 ? '-8px' : '0' }}></div>
                                        ))}
                                    </div>
                                    <div className={`absolute -bottom-8 -right-8 size-40 bg-${theme.primaryColor}/5 rounded-full blur-3xl`}></div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>
                </div>
            </div>
        </div>
    );
};
