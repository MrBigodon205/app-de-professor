import React, { useMemo } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { useTutorial } from '../../contexts/TutorialContext';
import { useTheme } from '../../hooks/useTheme';
import confetti from 'canvas-confetti';
import { desktopSteps, mobilePortraitSteps, mobileLandscapeSteps, CustomStep } from './TutorialSteps';

export const TutorialRunner: React.FC = () => {
    const { isActive, stopTutorial, currentStepIndex, setStepIndex, deviceMode } = useTutorial();
    const theme = useTheme();

    // Interaction Listener logic
    React.useEffect(() => {
        if (!isActive) return;

        const currentStep = steps[currentStepIndex] as CustomStep;
        if (!currentStep?.interactiveAction) return;

        const { type, target } = currentStep.interactiveAction;

        // Use a small delay to ensure DOM is ready after step change
        const timer = setTimeout(() => {
            const element = document.querySelector(target);
            if (!element) {
                console.warn(`Tutorial target not found: ${target}`);
                return;
            }

            // Explicitly scroll the element into view and center it
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const handler = () => {
                // Short delay for the UI to update from the user action
                setTimeout(() => {
                    const nextIndex = currentStepIndex + 1;
                    if (nextIndex < steps.length) {
                        setStepIndex(nextIndex);
                    }
                }, 400);
            };

            element.addEventListener(type, handler);
            return () => element.removeEventListener(type, handler);
        }, 500);

        return () => clearTimeout(timer);
    }, [isActive, currentStepIndex]);

    // Global Scroll Lock Cleanup
    // Global Scroll Lock Cleanup
    React.useEffect(() => {
        // When tutorial is inactive, proactively restore scroll
        if (!isActive) {
            document.body.style.overflow = 'unset';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.overflow = 'unset';
                mainContent.style.overflowY = 'auto'; // Restoration of original state
            }
        }

        // Cleanup on component unmount
        return () => {
            document.body.style.overflow = 'unset';
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.overflow = 'unset';
                mainContent.style.overflowY = 'auto';
            }
        };
    }, [isActive]);

    // Select the correct steps based on device mode
    const steps = useMemo(() => {
        switch (deviceMode) {
            case 'mobile_portrait':
                return mobilePortraitSteps;
            case 'mobile_landscape':
                return mobileLandscapeSteps;
            case 'desktop':
            default:
                return desktopSteps;
        }
    }, [deviceMode]);

    // Helper to map tailwind classes to hex for Joyride internal styles
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
        return colors[colorClass] || '#4f46e5';
    };

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, action, index } = data;

        // Handle Finish and Skip
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
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

        // Handle Navigation (Next / Prev)
        if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
            const isPrev = action === ACTIONS.PREV;
            const nextIndex = isPrev ? index - 1 : index + 1;

            if (nextIndex >= 0 && nextIndex < steps.length) {
                setStepIndex(nextIndex);
            }
        }

        // Handle manual close (if user clicks the overlay or ESC if enabled)
        if (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER) {
            stopTutorial();
        }
    };

    const CustomTooltip = ({
        index,
        step,
        backProps,
        primaryProps,
        tooltipProps,
    }: any) => {
        const isLastStep = index === steps.length - 1;

        return (
            <div {...tooltipProps} className="bg-white dark:bg-slate-800 rounded-[40px] shadow-2xl p-10 w-full max-w-[640px] border border-slate-100 dark:border-slate-700 relative overflow-hidden font-sans z-[1000] animate-in zoom-in-95 duration-500">
                {/* Premium Gradient Header */}
                <div className={`absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-${theme.primaryColor} via-indigo-400 to-${theme.primaryColor} bg-[length:200%_auto] animate-gradient-x`}></div>

                {/* Step Header */}
                {step.title && (
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Guia do Professor</span>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                {step.title}
                            </h4>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-black text-slate-500">{index + 1} <span className="text-slate-300 mx-1">/</span> {steps.length}</span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-10 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {step.content}
                </div>

                {/* Action Bar */}
                <div className="flex justify-between items-center gap-6 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => stopTutorial()}
                        className="group text-slate-400 hover:text-rose-500 text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-base group-hover:rotate-90 transition-transform">close</span>
                        Pular Guia
                    </button>

                    <div className="flex gap-4">
                        {index > 0 && (
                            <button
                                {...backProps}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setStepIndex(index - 1);
                                }}
                                className="px-6 py-4 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-xs uppercase tracking-widest active:scale-95"
                            >
                                Voltar
                            </button>
                        )}

                        {/* Hide next button if interaction is strictly required */}
                        {(!step.interactiveAction || index === 0) ? (
                            <button
                                {...primaryProps}
                                onClick={(e) => {
                                    if (isLastStep) {
                                        e.preventDefault();
                                        confetti({
                                            particleCount: 200,
                                            spread: 100,
                                            origin: { y: 0.6 },
                                            colors: ['#4F46E5', '#10B981', '#F59E0B']
                                        });
                                        stopTutorial();
                                    } else if (primaryProps.onClick) {
                                        primaryProps.onClick(e);
                                    }
                                }}
                                className={`px-10 py-4 rounded-2xl bg-${theme.primaryColor} text-white font-black shadow-xl shadow-${theme.primaryColor}/30 hover:shadow-2xl hover:shadow-${theme.primaryColor}/40 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-3`}
                            >
                                {isLastStep ? 'Começar Agora' : 'Próximo'}
                                <span className="material-symbols-outlined text-lg">{isLastStep ? 'rocket_launch' : 'arrow_forward'}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 shadow-inner rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse">
                                <span className="material-symbols-outlined text-amber-500 text-lg">touch_app</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aguardando sua ação...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar at the absolute bottom */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-slate-900">
                    <div
                        className={`h-full bg-gradient-to-r from-${theme.primaryColor} to-${theme.secondaryColor} transition-all duration-700 ease-out`}
                        style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>
        );
    };

    return (
        <Joyride
            steps={steps}
            run={isActive}
            stepIndex={currentStepIndex}
            continuous
            showSkipButton={false} // Handled in CustomTooltip
            showProgress={false} // Handled in CustomTooltip
            disableScrolling={false}
            disableScrollParentFix={false}
            disableOverlay={false}
            disableOverlayClose
            disableCloseOnEsc
            tooltipComponent={CustomTooltip}
            callback={handleJoyrideCallback}
            floaterProps={{
                disableAnimation: false,
                options: {
                    preventOverflow: {
                        boundariesElement: 'window',
                    },
                },
            }}
            styles={{
                options: {
                    zIndex: 9999,
                    primaryColor: getHexColor(theme.primaryColor),
                    overlayColor: 'rgba(15, 23, 42, 0.85)',
                },
                spotlight: {
                    borderRadius: 24,
                }
            }}
            spotlightClicks={true}
        />
    );
};
