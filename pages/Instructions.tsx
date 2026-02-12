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
                ? 'theme-border-primary bg-white dark:bg-slate-800 shadow-xl theme-shadow-primary'
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
                            ? 'theme-gradient-to-br text-white shadow-lg theme-shadow-primary scale-110'
                            : 'theme-bg-soft theme-text-primary dark:bg-slate-700 dark:text-slate-300'
                        }
           `}>
                        <span className="material-symbols-outlined text-2xl sm:text-3xl font-bold">{icon}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <h3 className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${isOpen ? 'theme-text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
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
                        ? 'theme-bg-soft theme-border-soft theme-text-primary rotate-180'
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
                        <div className="px-6 pb-8 sm:px-8 sm:pb-10 pt-0 text-slate-600 dark:text-slate-300 space-y-8 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 mt-2 pt-8">
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
    // const { startTutorial } = useTutorial(); // Removed
    const [openSection, setOpenSection] = useState<string | null>('classes');

    const toggleSection = (id: string) => {
        setOpenSection(active => active === id ? null : id);
        const element = document.getElementById(id);
        if (element) {
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    const Step = ({ number, title, text, icon }: { number: number, title: string, text: React.ReactNode, icon?: string }) => (
        <div className="flex gap-4 group/step relative">
            <div className="mt-1 size-8 rounded-2xl theme-bg-soft theme-text-primary text-sm font-black flex items-center justify-center shrink-0 theme-border-soft shadow-sm group-hover/step:scale-110 transition-transform z-10 bg-white dark:bg-slate-800">
                {icon ? <span className="material-symbols-outlined text-lg">{icon}</span> : number}
            </div>
            {/* Connecting Line */}
            <div className="absolute top-9 left-4 bottom-[-20px] w-px bg-slate-200 dark:bg-slate-700 group-last/step:hidden"></div>

            <div className="pb-6">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                    {title}
                </h5>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {text}
                </div>
            </div>
        </div>
    );

    const TipCard = ({ type = 'info', children }: { type?: 'info' | 'warning' | 'pro', children: React.ReactNode }) => {
        const colors = {
            info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-300', icon: 'info' },
            warning: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30', text: 'text-amber-700 dark:text-amber-300', icon: 'lightbulb' },
            pro: { bg: 'theme-bg-soft', border: 'theme-border-soft', text: 'theme-text-primary', icon: 'verified' }
        };
        const c = colors[type];

        return (
            <div className={`p-4 rounded-xl border ${c.bg} ${c.border} flex gap-3 text-sm`}>
                <span className={`material-symbols-outlined ${c.text} shrink-0`}>{c.icon}</span>
                <div className={`text-slate-600 dark:text-slate-300`}>{children}</div>
            </div>
        );
    };

    const QuickAction = ({ icon, label, target }: { icon: string, label: string, target: string }) => (
        <button
            onClick={() => toggleSection(target)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 group"
        >
            <div className="size-12 rounded-xl theme-bg-soft theme-text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                {label}
            </span>
        </button>
    );

    const IconInline = ({ icon }: { icon: string }) => (
        <span className="inline-flex align-middle justify-center items-center bg-slate-100 dark:bg-slate-700 rounded-md p-0.5 mx-1">
            <span className="material-symbols-outlined text-[14px] text-slate-600 dark:text-slate-300">{icon}</span>
        </span>
    );

    return (
        <div className="min-h-full w-full pb-6 bg-slate-50/50 dark:bg-transparent">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] theme-radial-primary rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center max-w-2xl mx-auto gap-6 bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-xl"
                    >
                        <div className="p-4 rounded-3xl theme-gradient-to-br text-white shadow-xl theme-shadow-primary mb-2 rotate-3">
                            <span className="material-symbols-outlined text-5xl">auto_stories</span>
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                Manual do Professor
                            </h1>

                            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
                                Guia completo para dominar o <strong>Prof. Acerta+</strong>
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
                    <QuickAction icon="assignment" label="Notas" target="grades" />
                    <QuickAction icon="calendar_month" label="Planos" target="planning" />
                </div>

                <div className="flex flex-col gap-6">

                    {/* 0. NAVEGAÇÃO */}
                    <InstructionSection
                        id="navigation"
                        title="0. Navegação e Menus"
                        icon="explore"
                        isOpen={openSection === 'navigation'}
                        onToggle={() => toggleSection('navigation')}
                    >
                        <div className="space-y-6">
                            <TipCard type="info">
                                <strong>Nova Navegação Móvel:</strong> Agora tudo fica no menu lateral. Toque no botão de menu (três risquinhos) no topo esquerdo para acessar todas as funções.
                            </TipCard>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">menu</span>
                                        Menu Lateral
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        É aqui que você encontra todas as páginas do app. No computador ele fica sempre visível, e no celular ele abre ao tocar no ícone de menu.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center gap-2"><IconInline icon="dashboard" /> <strong>Início:</strong> Visão geral do dia.</li>
                                        <li className="flex items-center gap-2"><IconInline icon="calendar_month" /> <strong>Planejamento:</strong> Seus planos de aula.</li>
                                        <li className="flex items-center gap-2"><IconInline icon="assignment" /> <strong>Atividades:</strong> Cadastro de provas/trabalhos.</li>
                                        <li className="flex items-center gap-2"><IconInline icon="grade" /> <strong>Notas:</strong> Lançamento de notas.</li>
                                    </ul>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <h4 className="font-bold mb-2 text-xs uppercase tracking-widest text-slate-500">Dica de Produtividade</h4>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                        Use o <strong>Seletor de Turmas</strong> no topo (as pílulas arredondadas) para trocar de turma rapidamente sem sair da tela que você está.
                                    </p>
                                    <div className="mt-4 flex justify-center">
                                        <div className="flex gap-1 p-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm scale-90">
                                            <div className="px-3 py-1 rounded-full text-white text-[10px] font-bold theme-bg-primary">6º A</div>
                                            <div className="px-3 py-1 rounded-full text-slate-400 text-[10px] font-bold">6º B</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 1. SEU PRIMEIRO PASSO */}
                    <InstructionSection
                        id="classes"
                        title="1. Primeiros Passos: Criando Turmas"
                        icon="rocket_launch"
                        isOpen={openSection === 'classes'}
                        onToggle={() => toggleSection('classes')}
                    >
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 mb-4">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 justify-center">
                                <span className="material-symbols-outlined text-lg">warning</span>
                                O aplicativo só funciona após você criar sua primeira Série e Turma.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <Step number={1} title="Acesse o Menu Turmas" text={<span>Toque no botão <IconInline icon="school" /> <strong>Turmas</strong> (ou no topo da tela) para abrir o gerenciador.</span>} />
                                <Step number={2} title="Adicione uma Série" text={<span>Clique no botão <IconInline icon="add" /> <strong>NOVA SÉRIE</strong> e digite o nome (ex: <em>6º Ano, 3º Médio</em>).</span>} />
                                <Step number={3} title="Gere as Turmas" text={<span>Dentro da série, clique em <IconInline icon="add" /> <strong>NOVA</strong> para criar automaticamente as turmas A, B, C...</span>} />
                                <Step number={4} title="Navegue entre elas" text="Use as pílulas arredondadas no topo de qualquer tela para trocar de turma instantaneamente." />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                                <div className="text-[10px] font-black uppercase text-slate-400">Exemplo de Navegação</div>
                                <div className="flex gap-2 p-2 bg-white dark:bg-black/40 rounded-full border border-slate-200 dark:border-slate-700">
                                    <div className="px-4 py-1.5 rounded-full text-white text-xs font-bold shadow-sm theme-bg-primary">6º Ano A</div>
                                    <div className="px-4 py-1.5 rounded-full text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800">B</div>
                                    <div className="px-4 py-1.5 rounded-full text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800">C</div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 2. CADASTRO DE ALUNOS */}
                    <InstructionSection
                        id="students"
                        title="2. Cadastro e Importação de Alunos"
                        icon="groups"
                        isOpen={openSection === 'students'}
                        onToggle={() => toggleSection('students')}
                    >
                        <TipCard type="pro">
                            <strong>Dica Ninja:</strong> Você não precisa cadastrar um por um! Copie a lista do Excel/Word e cole de uma vez.
                        </TipCard>

                        <div className="space-y-4">
                            <h4 className="font-bold text-slate-900 dark:text-white">Como fazer a Importação em Massa:</h4>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Step number={1} title="Vá em Alunos" text={<span>No menu lateral, clique em <IconInline icon="groups" /> <strong>Alunos</strong>.</span>} />
                                    <Step number={2} title="Importação" text={<span>Clique no botão <IconInline icon="playlist_add" /> <strong>IMPORTAR EM MASSA</strong> no topo direito.</span>} />
                                    <Step number={3} title="Cole a Lista" text="Cole os nomes (um por linha) na caixa de texto. O app remove números e pontuação automaticamente." />
                                </div>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-xs font-mono text-slate-500 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 right-0 bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 font-bold border-b border-emerald-200 text-[10px] uppercase">Lista Colada</div>
                                    <div className="mt-6 space-y-1 opacity-70">
                                        <p>1. ANA CLARA SILVA</p>
                                        <p>2. BRUNO MENDES</p>
                                        <p>3. CARLOS EDUARDO</p>
                                    </div>
                                    <div className="mt-4 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-center">
                                        3 Alunos Identificados!
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 3. ATIVIDADES E NOTAS */}
                    <InstructionSection
                        id="grades"
                        title="3. Atividades e Diário de Classe"
                        icon="assignment"
                        isOpen={openSection === 'grades'}
                        onToggle={() => toggleSection('grades')}
                    >
                        <p className="text-sm">
                            O sistema de notas é dividido por <strong>Unidades</strong>. As notas são salvas automaticamente enquanto você digita.
                        </p>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3"><span className="material-symbols-outlined">add_task</span></div>
                                <h4 className="font-bold text-sm mb-1">Passo 1: Criar</h4>
                                <p className="text-xs text-slate-500">Vá em <IconInline icon="history_edu" /> <strong>Atividades</strong> e crie uma nova tarefa. Defina o nome, data e peso.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="size-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3"><span className="material-symbols-outlined">edit_note</span></div>
                                <h4 className="font-bold text-sm mb-1">Passo 2: Lançar</h4>
                                <p className="text-xs text-slate-500">Vá em <IconInline icon="star" /> <strong>Notas</strong>. Digite o valor direto na tabela. O cálculo da média é instantâneo.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <div className="size-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3"><span className="material-symbols-outlined">functions</span></div>
                                <h4 className="font-bold text-sm mb-1">Passo 3: Média</h4>
                                <p className="text-xs text-slate-500">O sistema soma (Nota x Peso) de todas as atividades e divide pelos pesos totais.</p>
                            </div>
                        </div>

                        <TipCard type="warning">
                            <strong>Importante:</strong> Se um aluno faltou na prova, deixe a nota <strong>em branco</strong>. Se você colocar zero, entrará no cálculo da média.
                        </TipCard>
                    </InstructionSection>

                    {/* 4. PLANEJAMENTO */}
                    <InstructionSection
                        id="planning"
                        title="4. Planejamento de Aulas & BNCC"
                        icon="calendar_month"
                        isOpen={openSection === 'planning'}
                        onToggle={() => toggleSection('planning')}
                    >
                        <div className="flex flex-col gap-6">
                            <div>
                                <h4 className="font-bold mb-2">Editor Completo</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    No menu <IconInline icon="calendar_month" /> <strong>Planejamento</strong>, você pode criar roteiros detalhados.
                                </p>
                                <ul className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check</span> Anexar arquivos (PDF, Word, Imagens)</li>
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check</span> Definir objetivos e metodologia</li>
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check</span> Clonar aulas para outras turmas</li>
                                    <li className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500">check</span> Exportar para PDF formatado</li>
                                </ul>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl relative overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700">
                                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500">auto_awesome</span>
                                            Automação BNCC
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                                            Não perca tempo copiando textos da Base Nacional. Apenas digite o código e o sistema preenche para você.
                                        </p>
                                        <div className="bg-slate-100 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs flex gap-3 items-center">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-400/10 px-2 py-0.5 rounded">EF05MA01</span>
                                            <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                                            <span className="text-slate-500 dark:text-slate-300 truncate">Ler, escrever e ordenar números naturais...</span>
                                        </div>
                                    </div>
                                    <div className="size-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 text-white">
                                        <span className="material-symbols-outlined text-3xl">smart_toy</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 5. FREQUÊNCIA VELOZ */}
                    <InstructionSection
                        id="attendance"
                        title="5. Chamada e Frequência"
                        icon="co_present"
                        isOpen={openSection === 'attendance'}
                        onToggle={() => toggleSection('attendance')}
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h4 className="font-bold">A Lógica da "Presença Geral"</h4>
                                <p className="text-sm">
                                    A forma mais rápida de fazer chamada é assumir que todos vieram e marcar apenas quem faltou.
                                </p>
                                <div className="space-y-2">
                                    <Step number={1} title="Toque no Botão Verde" text={<span>O botão <strong>PRESENÇA GERAL</strong> marca <span className="text-emerald-500 font-bold">P</span> para todos os alunos da lista.</span>} />
                                    <Step number={2} title="Marque as Faltas" text={<span>Toque nos alunos que faltaram. O status muda para <span className="text-rose-500 font-bold">F</span> (Falta).</span>} />
                                    <Step number={3} title="Justificativa (Opcional)" text={<span>Toque mais uma vez para mudar para <span className="text-amber-500 font-bold">J</span> (Justificado).</span>} />
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 flex justify-center">
                                <div className="p-4 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-700 w-48 text-center space-y-2">
                                    <div className="flex justify-center gap-2">
                                        <div className="size-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">P</div>
                                        <div className="size-8 rounded bg-rose-100 text-rose-600 flex items-center justify-center font-bold">F</div>
                                        <div className="size-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center font-bold">J</div>
                                    </div>
                                    <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-2">Status Cíclicos</div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 6. DASHBOARD */}
                    <InstructionSection
                        id="dashboard"
                        title="Bônus: Entendendo o Dashboard"
                        icon="dashboard"
                        isOpen={openSection === 'dashboard'}
                        onToggle={() => toggleSection('dashboard')}
                    >
                        <p className="text-sm mb-6">
                            A tela inicial <IconInline icon="dashboard" /> <strong>Início</strong> é o seu centro de comando. Ela muda dependendo da turma que você selecionou no topo.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <TipCard type="info">
                                <strong>Agenda e Planos:</strong> Mostra o que você tem planejado para hoje e amanhã. Clicar no card leva direto para o planejamento da aula.
                            </TipCard>
                            <TipCard type="warning">
                                <strong>Alertas de Ocorrências:</strong> Mostra os últimos problemas comportamentais registrados na turma selecionada.
                            </TipCard>
                        </div>
                    </InstructionSection>

                </div>
            </div>
        </div>
    );
};
