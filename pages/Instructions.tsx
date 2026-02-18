
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS } from '../constants/motion';
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            id={id}
            className={`group card overflow-hidden border transition-colors duration-200 ${isOpen
                ? 'theme-border-primary bg-white dark:bg-slate-800 shadow-sm theme-shadow-primary'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                } rounded-3xl`}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 sm:p-8 text-left transition-colors tap-highlight-transparent"
            >
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`
             size-12 sm:size-14 rounded-2xl flex items-center justify-center transition-colors duration-200
             ${isOpen
                            ? 'theme-gradient-to-br text-white shadow-sm theme-shadow-primary transform-gpu'
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
                <motion.div
                    className={`
            size-10 rounded-full flex items-center justify-center border transition-colors duration-200
            ${isOpen
                            ? 'theme-bg-soft theme-border-soft theme-text-primary'
                            : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-400'
                        }
          `}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                    <span className="material-symbols-outlined font-bold">expand_more</span>
                </motion.div>
            </button>

            <motion.div
                initial={false}
                animate={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr"
                }}
                transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                }}
                className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out"
                style={{ willChange: 'grid-template-rows' }}
            >
                <div className="min-h-0">
                    <div className="px-6 pb-8 sm:px-8 sm:pb-10 pt-2">
                        {/* Separator Line */}
                        <div className="w-full h-px bg-slate-100 dark:bg-slate-700/50 mb-6" />

                        <div className="text-slate-600 dark:text-slate-300 space-y-8 leading-relaxed">
                            {children}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const Instructions: React.FC = () => {
    const theme = useTheme();
    // const { startTutorial } = useTutorial(); // Removed
    const [openSection, setOpenSection] = useState<string | null>('setup');

    const toggleSection = (id: string) => {
        const isOpening = openSection !== id;
        setOpenSection(active => active === id ? null : id);

        if (isOpening) {
            const element = document.getElementById(id);
            if (element) {
                // Wait for the open animation (250ms) to finish so we scroll to the correct final position
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
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
        <motion.div
            className="min-h-full w-full pb-6 bg-transparent"
            variants={VARIANTS.staggerContainer}
            initial="initial"
            animate="animate"
        >
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/20 dark:border-white/5">
                <div className="hidden sm:block absolute top-0 right-0 w-[500px] h-[500px] theme-radial-primary rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-50"></div>

                <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10">
                    <motion.div
                        variants={VARIANTS.scale}
                        className="flex flex-col items-center text-center max-w-2xl mx-auto gap-6 bg-white/90 dark:bg-slate-900/90 sm:bg-white/50 sm:dark:bg-slate-900/50 p-8 rounded-[2.5rem] sm:backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-xl"
                    >
                        <div className="p-4 rounded-3xl theme-gradient-to-br text-white shadow-xl theme-shadow-primary mb-2 rotate-3">
                            <span className="material-symbols-outlined text-5xl">auto_stories</span>
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                Guia Definitivo
                            </h1>

                            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
                                Domine todas as funcionalidades do <strong>Prof. Acerta+</strong>
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-20">
                {/* Fast Navigation */}
                <motion.div variants={VARIANTS.fadeUp} className="-mt-8 mb-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <QuickAction icon="rocket_launch" label="Início" target="setup" />
                    <QuickAction icon="groups" label="Alunos" target="students" />
                    <QuickAction icon="assignment" label="Notas" target="academic" />
                    <QuickAction icon="calendar_month" label="Planos" target="planning" />
                </motion.div>

                <div className="flex flex-col gap-6">

                    {/* 1. SETUP INICIAL */}
                    <InstructionSection
                        id="setup"
                        title="1. Configuração Inicial (Turmas e Disciplinas)"
                        icon="rocket_launch"
                        isOpen={openSection === 'setup'}
                        onToggle={() => toggleSection('setup')}
                    >
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 mb-4">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2 justify-center">
                                <span className="material-symbols-outlined text-lg">warning</span>
                                Passo Obrigatório: O aplicativo precisa saber suas Turmas e Disciplinas para funcionar.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Step number={1} title="Criar Séries" text={<span>Vá em <IconInline icon="school" /> <strong>Turmas</strong>. Clique em <strong>NOVA SÉRIE</strong> e digite o nome (ex: 6º Ano).</span>} />
                                <Step number={2} title="Gerar Turmas" text={<span>Dentro da série, clique em <strong>NOVA</strong> para criar as turmas (A, B, C...).</span>} />
                                <Step number={3} title="Configurar Disciplinas" text={<span>**MUITO IMPORTANTE:** Clique no ícone de engrenagem <IconInline icon="settings" /> na Série ou na Turma para definir quais matérias você leciona (ex: Matemática, História).</span>} />
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                                <div className="text-center">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Seletor de Turma</div>
                                    <p className="text-xs text-slate-500 mb-2">Use as pílulas no topo do app para navegar:</p>
                                    <div className="flex gap-2 justify-center">
                                        <div className="px-3 py-1 rounded-full text-white text-xs font-bold theme-bg-primary shadow-lg">6º Ano A</div>
                                        <div className="px-3 py-1 rounded-full text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">6º Ano B</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 2. GESTÃO DE ALUNOS */}
                    <InstructionSection
                        id="students"
                        title="2. Gestão de Alunos (Cadastro Rápido)"
                        icon="groups"
                        isOpen={openSection === 'students'}
                        onToggle={() => toggleSection('students')}
                    >
                        <TipCard type="pro">
                            <strong>Importação Inteligente:</strong> Não cadastre um por um! Copie sua lista do Excel/Word e use a importação em massa.
                        </TipCard>
                        <div className="space-y-4 pt-4">
                            <h4 className="font-bold">Como importar sua lista:</h4>
                            <Step number={1} title="Acesse a Tela de Alunos" text={<span>No menu lateral, vá em <IconInline icon="groups" /> <strong>Alunos</strong>.</span>} />
                            <Step number={2} title="Abra o Importador" text={<span>Clique no botão <IconInline icon="playlist_add" /> <strong>IMPORTAR EM MASSA</strong> (canto superior direito).</span>} />
                            <Step number={3} title="Cole e Salve" text="Cole a lista de nomes (um por linha) na caixa de texto. O sistema remove números e formata tudo automaticamente." />
                        </div>
                    </InstructionSection>

                    {/* 3. ROTINA DIÁRIA */}
                    <InstructionSection
                        id="routine"
                        title="3. Rotina Diária: Chamada e Ocorrências"
                        icon="notifications_active"
                        isOpen={openSection === 'routine'}
                        onToggle={() => toggleSection('routine')}
                    >
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2"><IconInline icon="co_present" /> Chamada Inteligente</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Não perca tempo chamando quem já veio. Use a lógica da "Presença Geral".
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><span className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">1</span> Clique em <strong>PRESENÇA GERAL</strong> (Botão Verde).</li>
                                    <li className="flex items-center gap-2"><span className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">2</span> Toque apenas nos alunos que faltaram para mudar para <strong className="text-rose-500">F</strong>.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2"><IconInline icon="warning" /> Ocorrências</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Registre comportamentos importantes (positivos ou negativos) para o conselho de classe.
                                </p>
                                <Step number={1} title="Registre" text={<span>Em <IconInline icon="warning" /> <strong>Ocorrências</strong>, selecione o aluno e descreva o fato.</span>} />
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 4. ACADÊMICO */}
                    <InstructionSection
                        id="academic"
                        title="4. Acadêmico: Atividades e Notas"
                        icon="assignment"
                        isOpen={openSection === 'academic'}
                        onToggle={() => toggleSection('academic')}
                    >
                        <p className="text-sm mb-4">
                            O sistema calcula médias automaticamente baseado nos pesos que você definir.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-sm mb-1 text-blue-600">1. Criar Atividade</h4>
                                <p className="text-xs text-slate-500">Em <IconInline icon="assignment" /> <strong>Atividades</strong>, crie provas ou trabalhos e defina quanto valem (peso).</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-sm mb-1 text-indigo-600">2. Lançar Notas</h4>
                                <p className="text-xs text-slate-500">Em <IconInline icon="grade" /> <strong>Notas</strong>, digite os valores na planilha. O salvamento é automático.</p>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-sm mb-1 text-emerald-600">3. Resultado</h4>
                                <p className="text-xs text-slate-500">A coluna "Média" é atualizada em tempo real conforme você digita.</p>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 5. PLANEJAMENTO */}
                    <InstructionSection
                        id="planning"
                        title="5. Planejamento com BNCC"
                        icon="calendar_month"
                        isOpen={openSection === 'planning'}
                        onToggle={() => toggleSection('planning')}
                    >
                        <div className="flex flex-col gap-6">
                            <TipCard type="pro">
                                <strong>Automação BNCC:</strong> Digite apenas o código (ex: EF05MA01) e o sistema preenche a habilidade completa para você.
                            </TipCard>
                            <div className="space-y-2">
                                <Step number={1} title="Novo Plano" text={<span>Vá em <IconInline icon="calendar_month" /> <strong>Planejamento</strong> e selecione uma data.</span>} />
                                <Step number={2} title="Editor Rico" text="Use o editor para criar roteiros detalhados, formatar texto e adicionar listas." />
                                <Step number={3} title="Anexos" text="Adicione PDFs ou imagens de atividades para ter tudo à mão na hora da aula." />
                                <Step number={4} title="PDF" text="Exporte seu planejamento semanal formatado para entregar à coordenação." />
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 6. RELATÓRIOS */}
                    <InstructionSection
                        id="reports"
                        title="6. Relatórios e Análises"
                        icon="description"
                        isOpen={openSection === 'reports'}
                        onToggle={() => toggleSection('reports')}
                    >
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold mb-2">Perfil do Aluno</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Toque no nome de qualquer aluno (em qualquer lista) para abrir o <strong>Perfil Completo</strong>. Lá você vê:
                                </p>
                                <ul className="mt-2 text-xs space-y-1 text-slate-500">
                                    <li>• Gráfico de desempenho no ano.</li>
                                    <li>• Histórico de presença completo.</li>
                                    <li>• Lista de todas as ocorrências.</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold mb-2">Relatórios da Turma</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Em <IconInline icon="description" /> <strong>Relatórios</strong>, você gera documentos oficiais:
                                </p>
                                <ul className="mt-2 text-xs space-y-1 text-slate-500">
                                    <li>• Boletim da Turma (Mapão).</li>
                                    <li>• Diário de Classe (Lista de Chamada).</li>
                                    <li>• Ficha Individual do Aluno.</li>
                                </ul>
                            </div>
                        </div>
                    </InstructionSection>

                    {/* 7. CONTA */}
                    <InstructionSection
                        id="account"
                        title="7. Sua Conta e Escolas"
                        icon="account_circle"
                        isOpen={openSection === 'account'}
                        onToggle={() => toggleSection('account')}
                    >
                        <div className="space-y-4">
                            <Step number={1} title="Trocar de Escola" text="Se você trabalha em mais de uma escola, clique na sua foto de perfil no topo da barra lateral e use o seletor de escolas." />
                            <Step number={2} title="Modo Escuro" text={<span>Prefere trabalhar à noite? Ative o tema escuro clicando no ícone <IconInline icon="dark_mode" /> no menu lateral.</span>} />
                            <Step number={3} title="Sair" text="Para fazer logoff, clique na sua foto de perfil e selecione 'Sair'." />
                        </div>
                    </InstructionSection>

                </div>
            </div>
        </motion.div>
    );
};
