import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import confetti from 'canvas-confetti';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useClass } from '../../contexts/ClassContext';

interface TutorialProps {
    onComplete: () => void;
}

export const TutorialDesktop: React.FC<TutorialProps> = ({ onComplete }) => {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const { classes } = useClass();
    const [run, setRun] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    const createTestPlan = async () => {
        if (!currentUser || !classes || classes.length === 0) return;

        const targetSeries = classes[0]; // Use first available series
        const targetSection = targetSeries.sections.length > 0 ? targetSeries.sections[0] : 'A';
        const today = new Date().toISOString().split('T')[0];

        try {
            await supabase.from('plans').insert({
                user_id: currentUser.id,
                title: 'Planejamento Exemplo (Tutorial)',
                series_id: targetSeries.id,
                section: targetSection,
                start_date: today,
                end_date: today,
                description: '<p>Este é um planejamento criado automaticamente pelo tutorial para você testar! Tente editar ou excluir.</p>',
                objectives: 'Entender como funciona o Prof. Acerta+',
                bncc_codes: 'EM13LGG101',
                methodology: 'Investigação ativa',
                resources: 'Computador, Internet',
                assessment: 'Observação direta',
                subject: currentUser.subject || 'Geral'
            });
            // Force reload or just let realtime handle it? Realtime should handle it if set up.
            // But we might want to manually notify or use a toast? 
            // For now, Supabase realtime in Planning.tsx (if enabled) or manual refresh will pick it up.
            // Actually Planning.tsx doesn't have realtime subscription in the snippet I saw, only specific tables.
            // Let's assume the user will navigate there and it will fetch.
        } catch (error) {
            console.error("Erro ao criar plano teste", error);
        }
    };

    const createTestActivity = async () => {
        if (!currentUser || !classes || classes.length === 0) return;

        const targetSeries = classes[0];
        const targetSection = targetSeries.sections.length > 0 ? targetSeries.sections[0] : 'A';
        const today = new Date().toISOString().split('T')[0];

        try {
            await supabase.from('activities').insert({
                user_id: currentUser.id,
                title: 'Atividade Teste (Tutorial)',
                type: 'Prova',
                date: today,
                series_id: targetSeries.id,
                section: targetSection,
                description: '<p>Uma atividade de exemplo criada para você.</p>',
                value: 10.0,
                subject: currentUser.subject || 'Geral'
            });
        } catch (error) {
            console.error("Erro ao criar atividade teste", error);
        }
    };

    const cleanupTestData = async () => {
        if (!currentUser) return;
        try {
            await supabase.from('plans').delete().eq('user_id', currentUser.id).eq('title', 'Planejamento Exemplo (Tutorial)');
            await supabase.from('activities').delete().eq('user_id', currentUser.id).eq('title', 'Atividade Teste (Tutorial)');
        } catch (error) {
            console.error("Erro ao limpar dados de teste", error);
        }
    };

    const startTour = () => {
        setShowWelcome(false);
        setTimeout(() => setRun(true), 500);
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, index, type } = data;

        // Execute actions based on step index
        if (type === 'step:after') {
            if (index === 2) {
                createTestPlan();
            }
            if (index === 4) {
                createTestActivity();
            }
        }

        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            setRun(false);
            cleanupTestData();
            onComplete();
            if (status === STATUS.FINISHED) {
                triggerFireworks();
            }
        }
    };

    const triggerFireworks = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <div className="text-4xl mb-4">🖥️</div>
                    <h2 className={`text-2xl font-bold text-${theme.primaryColor} mb-2`}>
                        Bem-vindo ao Prof. Acerta+ (Desktop)!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                        Aproveite a tela grande para máxima produtividade.<br />Vou te mostrar os atalhos principais.
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '[data-tour="class-selector"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">1. Seletor de Turmas</h3>
                    <p>Controle total aqui em cima. Troque de turma e todo o painel atualiza instantaneamente.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: 'aside',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">2. Menu Lateral</h3>
                    <p>Navegue entre Planejamento, Atividades e Alunos com um clique. A barra lateral pode ser recolhida se precisar de espaço.</p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-tour="sidebar-planning"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">3. Planejamento Completo</h3>
                    <p className="mb-2">Gerei um <b>Planejamento de Exemplo</b> para você ver! ✨</p>
                    <p className="text-sm opacity-80">
                        No Prof. Acerta+, você consegue detalhar tudo: <b>Códigos da BNCC, Objetivos, Metodologia e até anexar arquivos.</b>
                    </p>
                    <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                        *Não se preocupe, apagarei este exemplo automaticamente ao final do tour!
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-tour="sidebar-activities"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">4. Atividades e Notas</h3>
                    <p className="mb-2">Também criei uma <b>Prova Teste</b> lá! 📝</p>
                    <p className="text-sm opacity-80">
                        Você pode criar provas variadas, definir peso, data e vincular à sua turma. O sistema calcula as médias sozinho!
                    </p>
                    <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                        *Também será limpo ao terminar.
                    </p>
                </div>
            ),
            placement: 'right',
        },
        {
            target: '[data-tour="theme-toggle"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">3. Modo Escuro</h3>
                    <p>Alterne entre temas Claro e Escuro para maior conforto visual durante o planejamento noturno.</p>
                </div>
            ),
            placement: 'left',
        },
        {
            target: 'body',
            content: (
                <div className="text-center">
                    <div className="text-4xl mb-4">🚀</div>
                    <h3 className="text-2xl font-bold mb-2">Pronto para começar!</h3>
                    <p>Explore as ferramentas e bom trabalho!</p>
                </div>
            ),
            placement: 'center',
        },
    ];

    const CustomTooltip = ({ index, step, backProps, primaryProps, tooltipProps }: TooltipRenderProps) => (
        <div {...tooltipProps} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-6 rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-700 max-w-sm relative overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-300">
            {/* Glossy Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none"></div>

            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`} />

            <div className="relative z-10 pt-2">
                <div className="mb-6 leading-relaxed text-slate-600 dark:text-slate-300 font-medium text-base">
                    {step.content}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ease-out ${i === index ? `bg-${theme.primaryColor} w-8 shadow-sm shadow-${theme.primaryColor}/50` : 'bg-slate-200 dark:bg-slate-700 w-1.5'}`} />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {index > 0 && (
                            <button {...backProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-2 transition-colors">Voltar</button>
                        )}
                        <button
                            {...primaryProps}
                            className={`group relative px-6 py-2.5 rounded-xl bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold shadow-lg hover:shadow-${theme.primaryColor}/40 hover:scale-105 active:scale-95 transition-all duration-300 text-xs uppercase tracking-wider overflow-hidden`}
                        >
                            <span className="relative z-10">{index === steps.length - 1 ? 'Concluir' : 'Próximo'}</span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {showWelcome && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 max-w-lg w-full text-center relative overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-white/20 dark:border-slate-700">
                        {/* Decorative Background */}
                        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-${theme.primaryColor}/10 rounded-full blur-3xl`}></div>
                        <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-${theme.secondaryColor}/10 rounded-full blur-3xl`}></div>

                        <div className="relative z-10">
                            <div className={`size-20 mx-auto bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} rounded-3xl flex items-center justify-center shadow-xl shadow-${theme.primaryColor}/30 mb-6 rotate-3 hover:rotate-6 transition-transform duration-500`}>
                                <span className="material-symbols-outlined text-4xl text-white">rocket_launch</span>
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                Olá, {currentUser?.name?.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg leading-relaxed">
                                O <b>Prof. Acerta+</b> está de cara nova! Vamos fazer um tour rápido para você dominar todas as ferramentas?
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={startTour}
                                    className={`w-full py-4 rounded-2xl bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold text-lg shadow-xl shadow-${theme.primaryColor}/25 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all duration-300`}
                                >
                                    Vamos lá! 🚀
                                </button>
                                <button
                                    onClick={() => { setShowWelcome(false); onComplete(); }}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium py-2 transition-colors"
                                >
                                    Pular Tour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <Joyride
                steps={steps}
                run={run}
                continuous
                showSkipButton
                showProgress
                disableOverlayClose
                tooltipComponent={CustomTooltip}
                callback={handleJoyrideCallback}
                floaterProps={{ disableAnimation: false }} // Enable generic animation, we handle modal anim in CSS
                styles={{
                    options: {
                        zIndex: 10000,
                        primaryColor: theme.primaryColor,
                        textColor: '#334155',
                        overlayColor: 'rgba(15, 23, 42, 0.6)', // Lighter, blurrier overlay
                    },
                    spotlight: {
                        borderRadius: '16px', // Softer spotlight
                    }
                }}
            />
        </>
    );
};
