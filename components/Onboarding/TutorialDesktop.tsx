import React, { useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import confetti from 'canvas-confetti';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';

interface TutorialProps {
    onComplete: () => void;
}

export const TutorialDesktop: React.FC<TutorialProps> = ({ onComplete }) => {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const [run, setRun] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);

    const startTour = () => {
        setShowWelcome(false);
        setTimeout(() => setRun(true), 500);
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            setRun(false);
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
        <div {...tooltipProps} className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 max-w-sm relative overflow-hidden ring-1 ring-black/5">
            <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`} />
            <div className="relative z-10 pt-2">
                <div className="mb-6 leading-relaxed text-slate-600 dark:text-slate-300">{step.content}</div>
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? `bg-${theme.primaryColor} w-6` : 'bg-slate-200 dark:bg-slate-700 w-1.5'}`} />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {index > 0 && (
                            <button {...backProps} className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2">Voltar</button>
                        )}
                        <button {...primaryProps} className={`px-6 py-2.5 rounded-xl bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold shadow-lg hover:scale-105 transition-all text-xs uppercase`}>
                            {index === steps.length - 1 ? 'Concluir' : 'Próximo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {showWelcome && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-12 max-w-lg w-full text-center relative overflow-hidden animate-in zoom-in-95">
                        <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor}`}></div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Olá, {currentUser?.name?.split(' ')[0]}!</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-8">Vamos fazer um tour rápido pela versão Desktop?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={startTour} className={`w-full py-4 rounded-xl bg-${theme.primaryColor} text-white font-bold text-lg shadow-xl hover:scale-105 transition-all`}>Começar</button>
                            <button onClick={() => { setShowWelcome(false); onComplete(); }} className="text-slate-400 hover:text-slate-600 text-sm">Pular Tour</button>
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
                floaterProps={{ disableAnimation: true }}
                styles={{
                    options: {
                        zIndex: 10000,
                        primaryColor: theme.primaryColor,
                        textColor: '#334155',
                        overlayColor: 'rgba(15, 23, 42, 0.85)',
                    }
                }}
            />
        </>
    );
};
