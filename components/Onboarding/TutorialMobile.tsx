import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import confetti from 'canvas-confetti';

interface TutorialProps {
    onComplete: () => void;
}

export const TutorialMobile: React.FC<TutorialProps> = ({ onComplete }) => {
    const theme = useTheme();
    const { currentUser } = useAuth();
    const [stepIndex, setStepIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(true);

    const steps = [
        {
            icon: 'waving_hand',
            title: `Olá, ${currentUser?.name?.split(' ')[0]}!`,
            desc: 'Bem-vindo ao Prof. Acerta+ Mobile. Tudo o que você precisa, na palma da mão.',
            color: 'amber'
        },
        {
            icon: 'menu',
            title: 'Menu de Navegação',
            desc: 'Toque no ícone de "Hambúrguer" no canto superior esquerdo para acessar suas Turmas, Planejamento e Alunos.',
            color: 'indigo'
        },
        {
            icon: 'swap_horiz',
            title: 'Troca Rápida de Turma',
            desc: 'No topo da tela ou no menu lateral, você pode mudar de turma rapidamente. Tudo atualiza na hora.',
            color: 'emerald'
        },
        {
            icon: 'rocket_launch',
            title: 'Tudo Pronto!',
            desc: 'Você já sabe o básico. Experimente criar um plano ou lançar uma nota agora mesmo.',
            color: 'rose'
        }
    ];

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsOpen(false);
        onComplete();
        const duration = 3000;
        const end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    };

    if (!isOpen) return null;

    const currentStep = steps[stepIndex];

    return (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300"></div>

            {/* Bottom Sheet Card */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 pb-12 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-full duration-500 overflow-hidden ring-1 ring-white/10">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${i <= stepIndex ? `bg-${theme.primaryColor}` : 'bg-slate-100 dark:bg-slate-800'}`}></div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex flex-col items-center text-center min-h-[280px]">
                    <div className={`size-24 rounded-3xl bg-${currentStep.color}-500/10 text-${currentStep.color}-500 flex items-center justify-center mb-6 shadow-xl shadow-${currentStep.color}-500/20 animate-in zoom-in spin-in-12 duration-500 key-${stepIndex}`}>
                        <span className="material-symbols-outlined text-5xl">{currentStep.icon}</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 key-title-${stepIndex}">
                        {currentStep.title}
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-500 key-desc-${stepIndex}">
                        {currentStep.desc}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-4 mt-4">
                    <button
                        onClick={handleNext}
                        className={`w-full h-14 rounded-2xl bg-${theme.primaryColor} text-white font-black text-lg uppercase tracking-widest shadow-xl shadow-${theme.primaryColor}/20 hover:scale-[1.02] active:scale-[0.98] transition-all`}
                    >
                        {stepIndex === steps.length - 1 ? 'Vamos lá!' : 'Próximo'}
                    </button>

                    {stepIndex === 0 && (
                        <button
                            onClick={handleComplete}
                            className="text-xs font-bold text-slate-400 uppercase tracking-widest py-2"
                        >
                            Pular Tutorial
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
