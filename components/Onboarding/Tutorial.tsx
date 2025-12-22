import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import confetti from 'canvas-confetti';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';

const TUTORIAL_KEY = 'tutorial_completed_v1';

export const Tutorial: React.FC = () => {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const [run, setRun] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (!currentUser) return;

        const key = `${TUTORIAL_KEY}_${currentUser.id}`;
        const completed = localStorage.getItem(key);

        // FOR TESTING: Always show if requested, otherwise check 'completed'
        // if (!completed) {
        // Delay slightly to ensure UI is ready
        const timer = setTimeout(() => setShowWelcome(true), 1000);
        return () => clearTimeout(timer);
        // }
    }, [currentUser]);

    const startTour = () => {
        setShowWelcome(false);
        setRun(true);
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;

        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            setRun(false);
            if (currentUser) {
                console.log("Tutorial concluído. Salvando estado para:", currentUser.id);
                localStorage.setItem(`${TUTORIAL_KEY}_${currentUser.id}`, 'true');
            }
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

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Flash of light
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.inset = '0';
        flash.style.backgroundColor = 'white';
        flash.style.zIndex = '100000';
        flash.style.transition = 'opacity 1s ease-out';
        flash.style.opacity = '1';
        flash.style.pointerEvents = 'none';
        document.body.appendChild(flash);

        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 1000);
        }, 100);
    };

    const steps: Step[] = [
        {
            target: 'body',
            content: (
                <div className="text-center p-2">
                    <div className="text-4xl mb-4">👋</div>
                    <h2 className={`text-2xl font-bold text-${theme.primaryColor} mb-2`}>
                        Olá, {currentUser?.name?.split(' ')[0]}!
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                        Bem-vindo ao <strong>Prof. Acerta+</strong>!
                        <br />Vamos fazer um tour rápido para você dominar tudo por aqui?
                    </p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        // Desktop Sidebar Step
        {
            target: 'aside',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">Comando Central</h3>
                    <p>Aqui você navega por <strong>Planejamentos</strong>, <strong>Atividades</strong> e seus <strong>Alunos</strong>.</p>
                </div>
            ),
            placement: 'right',
            disableBeacon: true,
        },
        // Mobile Menu Step (Fallback if sidebar hidden)
        {
            target: '[data-tour="mobile-menu"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">Menu Principal</h3>
                    <p>Toque aqui para acessar todas as funcionalidades em seu celular.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="class-selector"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">O Coração da Aula</h3>
                    <p>Selecione a <strong>Série</strong> e <strong>Turma</strong> aqui. Tudo o que você vê na tela muda automaticamente para a turma escolhida.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: '[data-tour="dashboard-kpi"]',
            content: (
                <div>
                    <h3 className="text-xl font-bold mb-2">Visão de Águia</h3>
                    <p>Métricas vitais: Presença, Notas e Ocorrências em tempo real.</p>
                </div>
            ),
            placement: 'bottom',
        },
        {
            target: 'body',
            content: (
                <div className="text-center">
                    <div className="text-5xl mb-4 animate-bounce">🚀</div>
                    <h3 className="font-bold text-2xl mb-2 text-slate-800 dark:text-white">Tudo Pronto!</h3>
                    <p className="text-slate-600 dark:text-slate-300">Você está no comando agora. Transforme a educação!</p>
                </div>
            ),
            placement: 'center',
        }
    ];

    const CustomTooltip = ({
        continuous,
        index,
        step,
        backProps,
        closeProps,
        primaryProps,
        tooltipProps,
    }: TooltipRenderProps) => (
        <div
            {...tooltipProps}
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 max-w-sm relative overflow-hidden ring-1 ring-black/5"
        >
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`} />

            <div className="relative z-10 pt-2">
                <div className="mb-6 leading-relaxed text-slate-600 dark:text-slate-300">
                    {step.content}
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? `bg-${theme.primaryColor} w-6 shadow-sm shadow-${theme.primaryColor}/50` : 'bg-slate-200 dark:bg-slate-700 w-1.5'}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {index > 0 && (
                            <button {...backProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-2 transition-colors">
                                Voltar
                            </button>
                        )}
                        <button
                            {...primaryProps}
                            className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/30 hover:shadow-xl hover:scale-105 transition-all text-xs tracking-wide uppercase`}
                        >
                            {index === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>
            {/* Glossy reflection effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full pointer-events-none"></div>
        </div>
    );

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Simple check for dark mode class on html element
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDark);
        };

        checkDarkMode();

        // Optional: Listen for class changes if needed, but for now init check is fine
        // or use MutationObserver if strict reactivity is needed
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            {/* Full Screen Welcome Modal */}
            {showWelcome && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500"></div>

                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-8 md:p-12 max-w-lg w-full text-center overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-white/10 ring-1 ring-black/5">
                        {/* Background Shapes */}
                        <div className={`absolute -top-20 -right-20 w-64 h-64 bg-${theme.primaryColor}/10 rounded-full blur-3xl`}></div>
                        <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-${theme.secondaryColor}/10 rounded-full blur-3xl`}></div>

                        <div className="relative z-10">
                            <div className="text-6xl mb-6 animate-bounce">👋</div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                                Olá, <span className={`text-${theme.primaryColor}`}>{currentUser?.name?.split(' ')[0]}</span>!
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                                Seja bem-vindo ao <strong>Prof. Acerta+</strong>.<br />
                                Preparamos uma experiência incrível para otimizar suas aulas. Vamos conhecer?
                            </p>

                            <button
                                onClick={startTour}
                                className={`w-full py-4 rounded-xl bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold text-lg shadow-xl shadow-${theme.primaryColor}/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                            >
                                Iniciar Jornada 🚀
                            </button>
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="mt-4 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium decoration-slate-300 underline-offset-4 hover:underline"
                            >
                                Pular introdução
                            </button>
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
                styles={{
                    options: {
                        zIndex: 10000,
                        arrowColor: isDarkMode ? '#0f172a' : '#ffffff',
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        overlayColor: 'rgba(15, 23, 42, 0.85)', // Darker, simpler overlay to make spotlight pop
                        primaryColor: '#10b981',
                        textColor: '#334155',
                        spotlightShadow: '0 0 15px rgba(255, 255, 255, 0.5)', // Glowing effect
                    },
                    spotlight: {
                        borderRadius: '16px',
                    },
                    beacon: {
                        display: 'none' // Disable default beacon, we auto-start
                    }
                }}
                floaterProps={{
                    hideArrow: false,
                    disableAnimation: false,
                }}
            />
        </>
    );
};
