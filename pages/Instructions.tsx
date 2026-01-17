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
            initial={false}
            className={`group card overflow-hidden border transition-all duration-300 ${isOpen
                ? `border-${theme.primaryColor}/30 bg-white dark:bg-slate-800 shadow-lg shadow-${theme.primaryColor}/5`
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
                        <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0 text-slate-600 dark:text-slate-300 space-y-6 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 mt-2 pt-6">
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
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 70,
                damping: 15
            }
        }
    };

    const Step = ({ number, title, text }: { number: number, title: string, text: React.ReactNode }) => (
        <div className="flex gap-4">
            <div className={`mt-1 size-6 rounded-full bg-${theme.primaryColor}/10 text-${theme.primaryColor} text-xs font-black flex items-center justify-center shrink-0 border border-${theme.primaryColor}/20 shadow-sm`}>
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

    return (
        <div className="min-h-full w-full pb-32 bg-slate-50/50 dark:bg-transparent">
            {/* Hero Section */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-white to-slate-100 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700`}>
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-${theme.primaryColor}/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 pointer-events-none`}></div>

                <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center text-center max-w-2xl mx-auto gap-6 bg-white/50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] backdrop-blur-sm border border-white/50 dark:border-white/5 shadow-xl"
                    >
                        <div className={`p-4 rounded-3xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white shadow-xl shadow-${theme.primaryColor}/20 mb-2 rotate-3 hover:rotate-6 transition-transform duration-300`}>
                            <span className="material-symbols-outlined text-5xl">menu_book</span>
                        </div>

                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                                Manual do Professor
                            </h1>
                            <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium">
                                Guia completo e detalhado de todas as funcionalidades.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="flex flex-col gap-4"
                >

                    {/* 1. GESTÃO DE TURMAS */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="classes"
                            title="Gestão de Turmas e Séries"
                            icon="school"
                            isOpen={openSection === 'classes'}
                            onToggle={() => toggleSection('classes')}
                        >
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30 mb-6">
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">info</span>
                                    Importante: Comece por aqui! Sem turmas criadas, você não consegue adicionar alunos.
                                </p>
                            </div>

                            {/* Illustration: Class Navigation */}
                            <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
                                <img
                                    src="/images/instruction_class_nav_real.png"
                                    alt="Navegação e Seleção de Turmas"
                                    className="w-full h-auto object-cover bg-slate-50 dark:bg-slate-900"
                                    loading="lazy"
                                />
                                <div className="p-2 text-center bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400">
                                    A barra superior é onde você cria e troca de turmas.
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h4 className={`font-bold text-${theme.primaryColor} mb-4 uppercase text-xs tracking-widest`}>Criando uma Série</h4>
                                    <div className="space-y-4">
                                        <Step number={1} title="Acessar Gerenciador" text={
                                            <span>No topo da tela (desktop) ou no menu "Contexto" (mobile), clique no botão que exibe o nome da série atual (ou "Selecione..."). Isso abre o painel <strong>Gerenciar Turmas</strong>.</span>
                                        } />
                                        <Step number={2} title="Nova Série" text={
                                            <span>No campo superior "Nova série...", digite o nome (ex: <i>6º Ano</i>, <i>3º Médio</i>) e pressione <strong>Enter</strong> ou clique em "ADICIONAR".</span>
                                        } />
                                        <Step number={3} title="Adicionar Turmas (A, B, C...)" text={
                                            <span>Com a série criada e selecionada, clique no botão pontilhado <strong>"NOVA"</strong> na lista de turmas. O sistema cria automaticamente A, B, C em sequência.</span>
                                        } />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className={`font-bold text-${theme.primaryColor} mb-4 uppercase text-xs tracking-widest`}>Alternando Entre Turmas</h4>
                                        <p className="text-sm mb-2">
                                            O app funciona com o conceito de <strong>Contexto Ativo</strong>.
                                        </p>
                                        <ul className="text-xs sm:text-sm space-y-2 list-disc pl-4 marker:text-slate-300">
                                            <li>Tudo que você vê na tela (alunos, notas, planos) refere-se à série selecionada no topo.</li>
                                            <li>Basta clicar na "pílula" da turma (ex: "A", "B") no topo para trocar instantaneamente.</li>
                                        </ul>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-widest mb-2">Excluir Séries ou Turmas</h4>
                                        <p className="text-xs text-slate-500">
                                            <strong>Série:</strong> Clique no ícone de lixeira vermelha ao lado do nome da série. <i>Cuidado: Isso apaga TODOS os alunos e notas daquela série.</i><br />
                                            <strong>Turma:</strong> Passe o mouse sobre a letra da turma (ex: "A") e clique no "X" vermelho que aparece.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                    {/* 2. GESTÃO DE ALUNOS */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="students"
                            title="Gestão de Alunos (Cadastro e Importação)"
                            icon="groups"
                            isOpen={openSection === 'students'}
                            onToggle={() => toggleSection('students')}
                        >
                            <p className="mb-6">
                                Acesse a aba <strong>Alunos</strong> no menu. Certifique-se de ter selecionado a turma correta no topo da tela.
                            </p>

                            {/* Illustration: Student Actions */}
                            <div className="mb-8 rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto">
                                <img
                                    src="/images/instruction_students_real.png"
                                    alt="Botões de Ação de Alunos"
                                    className="w-full h-auto object-cover bg-slate-50 dark:bg-slate-900"
                                    loading="lazy"
                                />
                                <div className="p-2 text-center bg-slate-50 dark:bg-slate-900/50 text-[10px] text-slate-400">
                                    Use os botões no topo da lista para cadastrar ou importar.
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500">person_add</span> Cadastro Manual
                                    </h4>
                                    <div className="space-y-3">
                                        <Step number={1} title="Novo Aluno" text="Clique no botão 'Novo Aluno'." />
                                        <Step number={2} title="Nome" text="Digite o nome completo. O sistema gera automaticamente as iniciais e a cor do avatar." />
                                        <Step number={3} title="Número" text="O número da chamada é sugerido automaticamente com base no último aluno (ex: se o último é 15, o novo será 16)." />
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-purple-500">playlist_add</span> Importação em Massa (Recomendado)
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs mb-3">
                                            Ideal para início de ano. Você pode copiar a lista do Excel/Word e colar aqui.
                                        </p>
                                        <Step number={1} title="Copiar & Colar" text={
                                            <span>Clique em <strong>"Importar em Massa"</strong>. Cole a lista de nomes (um por linha) na caixa de texto.</span>
                                        } />
                                        <Step number={2} title="Processamento Inteligente" text={
                                            <span>O sistema verifica se o nome já existe na turma. Se existir, ele atualiza o número. Se não, cria um novo cadastro.</span>
                                        } />
                                    </div>
                                </div>
                            </div>

                            <h4 className={`font-bold text-${theme.primaryColor} mb-3 uppercase text-xs tracking-widest`}>Edição e Transferência</h4>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="card p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="font-bold text-xs block mb-1">Editar Nome</span>
                                    <p className="text-[10px] text-slate-500">Clique no ícone de lápis na linha do aluno. Altere o nome e confirme no "check" verde.</p>
                                </div>
                                <div className="card p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="font-bold text-xs block mb-1">Transferir</span>
                                    <p className="text-[10px] text-slate-500">Use o ícone de setas (move_up) para mover um aluno para outra turma (ex: do 6A para o 6B). As notas são preservadas.</p>
                                </div>
                                <div className="card p-4 border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <span className="font-bold text-xs block mb-1">Excluir</span>
                                    <p className="text-[10px] text-slate-500">Use a lixeira para remover o aluno. Atenção: isso apaga histórico de notas e faltas.</p>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                    {/* 3. PLANEJAMENTO */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="planning"
                            title="Planejamento e BNCC"
                            icon="calendar_month"
                            isOpen={openSection === 'planning'}
                            onToggle={() => toggleSection('planning')}
                        >
                            <p className="mb-4">
                                Substitua seu caderno físico. Seus planos ficam salvos na nuvem e organizados por número de aula.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <h4 className={`font-bold text-${theme.primaryColor} mb-2 uppercase text-xs tracking-widest`}>Passo a Passo</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm pl-2 marker:font-bold marker:text-slate-400">
                                        <li>Vá para a aba <strong>Planejamento</strong>.</li>
                                        <li>Clique em <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">Nova Aula +</span>.</li>
                                        <li><strong>Conteúdo:</strong> O que será ensinado (ex: "Equações de 1º Grau").</li>
                                        <li><strong>Metodologia:</strong> Como será ensinado (ex: "Aula expositiva com resolução de exercícios").</li>
                                        <li><strong>BNCC:</strong> Comece a digitar o código (ex: "EF05") e selecione na lista suspensa para preencher automaticamente a descrição da habilidade.</li>
                                    </ol>
                                </div>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                    <h5 className="font-bold text-blue-700 dark:text-blue-300 text-sm mb-2">Funcionalidades Extras</h5>
                                    <ul className="grid sm:grid-cols-2 gap-4 text-xs text-blue-800 dark:text-blue-200">
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">content_copy</span>
                                            <span><strong>Clonar:</strong> Use o botão de copiar para replicar uma aula de uma turma para outra (ex: do 6A para o 6B).</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            <span><strong>Editar:</strong> Clique em qualquer card de aula para alterar o texto.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                    {/* 4. ATIVIDADES E NOTAS */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="grades"
                            title="Atividades, Notas e Pesos"
                            icon="assignment"
                            isOpen={openSection === 'grades'}
                            onToggle={() => toggleSection('grades')}
                        >
                            <div className="mb-8">
                                <h4 className={`font-bold text-${theme.primaryColor} mb-3 uppercase text-xs tracking-widest`}>Ciclo de Avaliação</h4>

                                {/* Illustration: Activities Flow */}
                                <div className="mb-6 rounded-xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800">
                                    <img
                                        src="/images/instruction_activities_real.png"
                                        alt="Fluxo de Criação de Atividades"
                                        className="w-full h-auto object-cover bg-white dark:bg-slate-900"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                                    <div className="space-y-6">
                                        <div className="relative pl-10">
                                            <div className={`absolute left-0 top-0 size-6 rounded-full bg-${theme.primaryColor} text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-${theme.primaryColor}/30`}>1</div>
                                            <h5 className="font-bold text-sm mb-1">Criar a Atividade</h5>
                                            <p className="text-xs text-slate-500">
                                                Vá em <strong>Atividades</strong> e clique em "Nova". Defina:<br />
                                                - <strong>Valor Máximo:</strong> Quanto vale (ex: 10,0).<br />
                                                - <strong>Data:</strong> Quando foi aplicada.<br />
                                                - <strong>Tipo:</strong> Prova, Trabalho ou Conceito (apenas para organização).
                                            </p>
                                        </div>
                                        <div className="relative pl-10">
                                            <div className={`absolute left-0 top-0 size-6 rounded-full bg-white dark:bg-slate-800 border-2 border-${theme.primaryColor} text-${theme.primaryColor} flex items-center justify-center text-xs font-bold`}>2</div>
                                            <h5 className="font-bold text-sm mb-1">Lançar as Notas</h5>
                                            <p className="text-xs text-slate-500">
                                                Na lista de alunos que aparece, digite a nota de cada um. O sistema salva automaticamente ao sair do campo (auto-save).
                                                <br /><i>Nota: Se você digitar um valor maior que o máximo, o sistema avisa.</i>
                                            </p>
                                        </div>
                                        <div className="relative pl-10">
                                            <div className={`absolute left-0 top-0 size-6 rounded-full bg-white dark:bg-slate-800 border-2 border-${theme.primaryColor} text-${theme.primaryColor} flex items-center justify-center text-xs font-bold`}>3</div>
                                            <h5 className="font-bold text-sm mb-1">Conferir Médias</h5>
                                            <p className="text-xs text-slate-500">
                                                Vá para a aba <strong>Notas</strong>. Lá você vê a soma de todas as atividades da unidade.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                    <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Cálculo de Pesos</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                        O sistema calcula a média anual baseada em <strong>Média Ponderada</strong> ou <strong>Soma Simples</strong>, dependendo da configuração da sua escola.
                                    </p>
                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400">
                                        (N1 + N2 + N3) ÷ 3<br />
                                        <span className="text-slate-400 dark:text-slate-600 italic">// Exemplo de média simples</span>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-2">Unidades (Bimestre/Trimestre)</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        No topo da tela de Notas/Atividades, você vê botões "1, 2, 3...". Use-os para mudar o período letivo vigente. As notas da Unidade 1 não se misturam com as da Unidade 2.
                                    </p>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                    {/* 5. FREQUÊNCIA E CHAMADA */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="attendance"
                            title="Frequência e Chamada Rápida"
                            icon="co_present"
                            isOpen={openSection === 'attendance'}
                            onToggle={() => toggleSection('attendance')}
                        >
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-sm mb-4">
                                        O módulo de frequência foi desenhado para ser usado em sala, pelo celular, em menos de 10 segundos.
                                    </p>
                                    <h4 className={`font-bold text-${theme.primaryColor} mb-2 uppercase text-xs tracking-widest`}>Fluxo de Chamada</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-2 marker:font-bold marker:text-slate-400">
                                        <li>Vá para a aba <strong>Frequência</strong>.</li>
                                        <li>Verifique se a <strong>Data</strong> no topo está correta.</li>
                                        <li>Clique no botão verde <strong>"Presença Geral"</strong> (canto superior direito). Isso marca 'P' para todos.</li>
                                        <li>Consulte quem faltou e clique no botão 'P' ao lado do nome para mudar para 'F' (Falta) ou 'J' (Falta Justificada).</li>
                                    </ol>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-3">Sessão "Relâmpago"</h5>

                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">P</div>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Presença (Conta como comparecimento)</span>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="size-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">F</div>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Falta (Reduz a % de frequência)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">J</div>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">Justificada (Não afeta a porcentagem)</span>
                                    </div>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                    {/* 6. DICAS DE ORGANIZAÇÃO & ROTINA */}
                    <motion.div variants={itemVariants}>
                        <InstructionSection
                            id="organization"
                            title="Dicas de Organização & Rotina"
                            icon="lightbulb"
                            isOpen={openSection === 'organization'}
                            onToggle={() => toggleSection('organization')}
                        >
                            <div className="space-y-6">
                                <p className="text-sm">
                                    O <strong>Prof. Acerta+</strong> foi desenhado não apenas para lançar dados, mas para te ajudar a ganhar tempo. Aqui estão algumas sugestões de fluxo de trabalho:
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 p-2 bg-${theme.primaryColor}/10 rounded-bl-2xl text-${theme.primaryColor}`}>
                                            <span className="material-symbols-outlined">timer</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3 pr-8">No Início da Aula (5 min)</h4>
                                        <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                                            <li className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-sm mt-0.5 text-emerald-500">check_circle</span>
                                                <span>Abra a aba <strong>Frequência</strong> e faça a "Chamada Relâmpago" (Presença Geral + Ajustes).</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-sm mt-0.5 text-blue-500">check_circle</span>
                                                <span>Se houver lição de casa para checar, use a aba <strong>Atividades</strong> → crie uma atividade "Visto no Caderno" (valor 1,0 ou Conceito) e lance rapidamente enquanto circula pela sala.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                                        <div className={`absolute top-0 right-0 p-2 bg-${theme.primaryColor}/10 rounded-bl-2xl text-${theme.primaryColor}`}>
                                            <span className="material-symbols-outlined">weekend</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-3 pr-8">No Final da Semana (20 min)</h4>
                                        <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
                                            <li className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-sm mt-0.5 text-purple-500">check_circle</span>
                                                <span>Vá em <strong>Planejamento</strong>. Use a tarde de sexta-feira para criar os cards das aulas da próxima semana. Lembre-se de usar o código BNCC para facilitar.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-sm mt-0.5 text-amber-500">check_circle</span>
                                                <span>Verifique a aba <strong>Dashboard</strong> para ver se alguma turma está com média de frequência caindo muito e anote para falar com a coordenação.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <h4 className={`font-bold text-${theme.primaryColor} mb-4 uppercase text-xs tracking-widest`}>O Que Você Pode Fazer?</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-indigo-500">picture_as_pdf</span>
                                            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Gerar Relatórios</span>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-pink-500">psychology</span>
                                            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Análise Pedagógica</span>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-teal-500">history_edu</span>
                                            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Histórico Escolar</span>
                                        </div>
                                        <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                            <span className="material-symbols-outlined text-2xl mb-2 text-orange-500">warning</span>
                                            <span className="block text-[10px] font-bold text-slate-600 dark:text-slate-300">Registrar Ocorrências</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </InstructionSection>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    );
};
