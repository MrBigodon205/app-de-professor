import React, { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useTutorial } from '../../contexts/TutorialContext';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';

// Extend Step interface to include our custom data
interface CustomStep extends Step {
    data?: {
        route?: string;
    };
}

export const TutorialDesktop: React.FC = () => {
    const { isActive, stopTutorial, currentStepIndex, setStepIndex } = useTutorial();
    const theme = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to map tailwind classes to hex for Joyride internal styles (Beacon/Overlay)
    const getHexColor = (colorClass: string) => {
        const colors: Record<string, string> = {
            'indigo-600': '#4f46e5',
            'blue-600': '#2563eb',
            'emerald-600': '#059669',
            'rose-600': '#e11d48',
            'amber-600': '#d97706',
            'violet-600': '#7c3aed',
            'cyan-600': '#0891b2',
            'pink-600': '#db2677',
            'orange-600': '#ea580c',
            'slate-900': '#0f172a',
        };
        // Default to indigo if match not found
        return colors[colorClass] || '#4f46e5';
    };

    // Define Steps with explicit routes
    const steps: CustomStep[] = [
        // --- DASHBOARD ---
        {
            content: (
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-800 mb-2">Bem-vindo ao Prof. Acerta+! 🚀</h2>
                    <p className="text-slate-600">Vamos fazer um tour completo para você dominar todas as ferramentas de gestão escolar.</p>
                </div>
            ),
            locale: { skip: 'Pular Tour', next: 'Começar' },
            placement: 'center',
            target: 'body',
            disableBeacon: true,
            data: { route: '/dashboard' }
        },
        {
            target: '[data-tour="dashboard-activities"]',
            content: 'Aqui você tem uma visão rápida das próximas atividades e planejamentos.',
            title: 'Resumo',
            placement: 'right',
            data: { route: '/dashboard' }
        },
        {
            target: '[data-tour="dashboard-occurrences"]',
            content: 'Acompanhe as ocorrências recentes dos seus alunos neste painel.',
            title: 'Ocorrências',
            placement: 'left',
            data: { route: '/dashboard' }
        },
        {
            target: '[data-tour="nav-planning"]',
            content: 'Vamos começar pelo Planejamento de Aulas.',
            title: 'Navegação',
            placement: 'right',
            data: { route: '/dashboard' } // Trigger nav after this
        },

        // --- PLANNING ---
        {
            target: '[data-tour="planning-sidebar"]',
            content: 'Gerencie suas aulas e planos aqui. Tudo organizado cronologicamente.',
            title: 'Aulas',
            placement: 'right',
            data: { route: '/planning' }
        },
        {
            target: '[data-tour="planning-new-btn"]',
            content: 'Crie novos planos de aula alinhados à BNCC com apenas um clique.',
            title: 'Novo Plano',
            placement: 'bottom',
            data: { route: '/planning' }
        },
        {
            target: '[data-tour="nav-activities"]',
            content: 'Agora vamos ver as Atividades Avaliativas.',
            title: 'Próximo',
            placement: 'right',
            data: { route: '/planning' }
        },

        // --- ACTIVITIES ---
        {
            target: '[data-tour="activities-sidebar"]',
            content: 'Liste suas provas, trabalhos e tarefas de casa.',
            title: 'Atividades',
            placement: 'right',
            data: { route: '/activities' }
        },
        {
            target: '[data-tour="activities-new-btn"]',
            content: 'Adicione novas avaliações e defina pesos e competências.',
            title: 'Criar',
            placement: 'bottom',
            data: { route: '/activities' }
        },
        {
            target: '[data-tour="nav-grades"]',
            content: 'Vamos para o Diário de Notas.',
            title: 'Notas',
            placement: 'right',
            data: { route: '/activities' }
        },

        // --- GRADES ---
        {
            target: '[data-tour="grades-units"]',
            content: 'Alterne entre unidades para lançar notas. O cálculo da média é automático!',
            title: 'Unidades',
            placement: 'bottom',
            data: { route: '/grades' }
        },
        {
            target: '[data-tour="grades-export"]',
            content: 'Gere PDFs do diário de classe prontos para imprimir.',
            title: 'Exportar',
            placement: 'left',
            data: { route: '/grades' }
        },
        {
            target: '[data-tour="nav-attendance"]',
            content: 'Veja como é fácil fazer a chamada.',
            title: 'Frequência',
            placement: 'right',
            data: { route: '/grades' }
        },

        // --- ATTENDANCE ---
        {
            target: '[data-tour="attendance-date"]',
            content: 'Escolha a data da aula. Pode ser retroativa!',
            title: 'Calendário',
            placement: 'bottom',
            data: { route: '/attendance' }
        },
        {
            target: '[data-tour="attendance-quick-actions"]',
            content: 'Dê presença ou falta coletiva para ganhar tempo.',
            title: 'Agilidade',
            placement: 'top',
            data: { route: '/attendance' }
        },
        {
            target: '[data-tour="nav-students"]',
            content: 'Gerencie sua lista de alunos.',
            title: 'Alunos',
            placement: 'right',
            data: { route: '/attendance' }
        },

        // --- STUDENTS ---
        {
            target: '[data-tour="students-import-btn"]',
            content: 'Importe sua lista de alunos de qualquer planilha.',
            title: 'Importar',
            placement: 'bottom',
            data: { route: '/students' }
        },
        {
            target: '[data-tour="students-add-btn"]',
            content: 'Ou cadastre manualmente se preferir.',
            title: 'Novo Aluno',
            placement: 'left',
            data: { route: '/students' }
        },
        {
            target: '[data-tour="nav-observations"]',
            content: 'Vamos registrar o comportamento dos alunos.',
            title: 'Observações',
            placement: 'right',
            data: { route: '/students' }
        },

        // --- OBSERVATIONS ---
        {
            target: '[data-tour="obs-student-list"]',
            content: 'Selecione um aluno para ver ou adicionar registros.',
            title: 'Seleção',
            placement: 'right',
            data: { route: '/observations' }
        },
        {
            target: '[data-tour="obs-form"]',
            content: 'Registre ocorrências, elogios ou anotações pedagógicas detalhadas.',
            title: 'Registro',
            placement: 'left',
            data: { route: '/observations' }
        },
        {
            target: '[data-tour="nav-reports"]',
            content: 'Por fim, os Relatórios Individuais.',
            title: 'Relatórios',
            placement: 'right',
            data: { route: '/observations' }
        },

        // --- REPORTS (Student Profile) ---
        {
            target: '[data-tour="reports-chart"]',
            content: 'Visualize a evolução acadêmica do aluno em gráficos claros.',
            title: 'Gráficos',
            placement: 'bottom',
            data: { route: '/reports' }
        },
        {
            target: '[data-tour="reports-export-btn"]',
            content: 'Baixe um dossiê completo do aluno em PDF, com notas, frequência e ocorrências.',
            title: 'Dossiê',
            placement: 'left',
            data: { route: '/reports' }
        },

        // --- FINISH ---
        {
            target: '[data-tour="user-profile-trigger"]',
            content: 'Acesse seu perfil para sair ou configurar sua conta.',
            title: 'Perfil',
            placement: 'left',
            data: { route: '/reports' } // Stay on reports or go somewhere else? Let's stay.
        },
        {
            target: 'body',
            content: (
                <div className="text-center">
                    <h2 className="text-xl font-black text-emerald-600 mb-2">Parabéns! 🎉</h2>
                    <p className="text-slate-600">Você completou o tour. Agora é só aproveitar o Prof. Acerta+ para transformar suas aulas!</p>
                </div>
            ),
            placement: 'center',
            title: 'Concluído',
            data: { route: '/dashboard' } // Return to dashboard for finale
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, action, index, lifecycle } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            if (status === STATUS.FINISHED) {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#4F46E5', '#10B981', '#F59E0B']
                });
            }
            stopTutorial();
            return;
        }

        if (type === EVENTS.STEP_AFTER || (action === ACTIONS.CLOSE && type === EVENTS.Step)) {
            const nextIndex = index + 1;

            if (nextIndex < steps.length) {
                const nextStep = steps[nextIndex];
                // Navigate if the next step requires a different route
                if (nextStep.data?.route && location.pathname !== nextStep.data.route) {
                    navigate(nextStep.data.route);
                }
                setStepIndex(nextIndex);
            }
        }
        // Handle Target Not Found (Auto-Recovery)
        else if (type === EVENTS.TARGET_NOT_FOUND) {
            console.warn(`Tutorial target not found for step ${index}. Skipping to next.`);
            const nextIndex = index + 1;
            if (nextIndex < steps.length) {
                const nextStep = steps[nextIndex];
                if (nextStep.data?.route && location.pathname !== nextStep.data.route) {
                    navigate(nextStep.data.route);
                }
                setStepIndex(nextIndex);
            }
        }
    };

    // Effect to ensure we are on the right page for the current step if page reloads or something
    useEffect(() => {
        if (isActive && steps[currentStepIndex]?.data?.route) {
            if (location.pathname !== steps[currentStepIndex].data!.route) {
                navigate(steps[currentStepIndex].data!.route as string);
            }
        }
    }, [currentStepIndex, isActive]); // Depend on index, not location, to avoid loops if nav fails

    const CustomTooltip = ({
        index,
        step,
        backProps,
        closeProps,
        primaryProps,
        tooltipProps,
    }: any) => (
        <div {...tooltipProps} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden font-sans">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-${theme.primaryColor}`}></div>
            {step.title && (
                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    {step.title}
                    {index > 0 && <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg uppercase tracking-wider">{index + 1}/{steps.length}</span>}
                </h4>
            )}
            <div className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-relaxed mb-8">
                {step.content}
            </div>
            <div className="flex justify-between items-center gap-4">
                <button {...closeProps} className="text-slate-400 hover:text-rose-500 text-[10px] font-black uppercase tracking-widest transition-colors">
                    Pular
                </button>
                <div className="flex gap-2">
                    {index > 0 && (
                        <button {...backProps} className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-wide">
                            Voltar
                        </button>
                    )}
                    <button {...primaryProps} className={`px-6 py-2.5 rounded-xl bg-${theme.primaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/20 hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wide`}>
                        {index === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <Joyride
            steps={steps}
            run={isActive}
            stepIndex={currentStepIndex}
            continuous
            showSkipButton
            showProgress
            disableOverlayClose
            disableCloseOnEsc
            tooltipComponent={CustomTooltip}
            callback={handleJoyrideCallback}
            floaterProps={{ disableAnimation: false }}
            spotlightPadding={4}
            styles={{
                options: {
                    zIndex: 9999,
                    primaryColor: getHexColor(theme.primaryColor),
                    overlayColor: 'rgba(15, 23, 42, 0.75)',
                }
            }}
        />
    );
};
