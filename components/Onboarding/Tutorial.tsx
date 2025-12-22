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

    useEffect(() => {
        if (!currentUser) return;

        const key = `${TUTORIAL_KEY}_${currentUser.id}`;
        const completed = localStorage.getItem(key);

        // For testing purposes, we ignore the completed check
        // if (!completed) {
        // Delay slightly to ensure UI is ready
        const timer = setTimeout(() => setRun(true), 1500); // Increased delay slightly
        return () => clearTimeout(timer);
        // }
    }, [currentUser]);

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

            // since particles fall down, start a bit higher than random
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
        {
            target: 'aside', // Sidebar
            content: 'Aqui é o seu menu de comando! Navegue entre Planejamentos, Atividades, Alunos e muito mais.',
            placement: 'right',
        },
        {
            target: '[data-tour="class-selector"]', // Need to add this to layout
            content: 'Selecione a Série e Turma que você está trabalhando agora. Tudo muda dinamicamente!',
            placement: 'bottom',
        },
        {
            target: '[data-tour="dashboard-kpi"]', // Need to add to dashboard
            content: 'Acompanhe métricas vitais da sua turma em tempo real.',
            placement: 'bottom',
        },
        {
            target: 'body',
            content: (
                <div className="text-center">
                    <div className="text-4xl mb-4">🚀</div>
                    <h3 className="font-bold text-lg mb-2">Tudo pronto!</h3>
                    <p>Você está no comando. Bom trabalho, professor!</p>
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
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm relative overflow-hidden"
        >
            {/* Gradient Border Helper */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`} />

            <div className="relative z-10">
                {step.title && <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">{step.title}</h3>}
                <div className="mb-6 leading-relaxed text-slate-600 dark:text-slate-300">
                    {step.content}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full transition-all ${i === index ? `bg-${theme.primaryColor} w-4` : 'bg-slate-200 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {index > 0 && (
                            <button {...backProps} className="text-sm font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-3 py-1">
                                Voltar
                            </button>
                        )}
                        <button
                            {...primaryProps}
                            className={`px-5 py-2 rounded-xl bg-${theme.primaryColor} text-white font-bold shadow-lg shadow-${theme.primaryColor}/30 hover:shadow-xl hover:scale-105 transition-all text-sm`}
                        >
                            {index === steps.length - 1 ? 'Vamos lá!' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Background Blob decoration */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-${theme.primaryColor}/10 rounded-full blur-2xl`} />
        </div>
    );

    return (
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
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                }
            }}
        />
    );
};
