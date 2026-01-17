import React from 'react';
import { Step } from 'react-joyride';

export interface CustomStep extends Step {
    interactiveAction?: {
        type: 'click' | 'change' | 'input';
        target: string;
    };
    data?: {
        hideBackButton?: boolean;
    };
}

// Helper for icons in text
const Icon = ({ name, color = 'indigo-500' }: { name: string, color?: string }) => (
    <span className={`material-symbols-outlined text-lg align-middle mx-1 text-${color} font-bold`}>{name}</span>
);

// Enhanced Instructional Video with Caption
const TutorialVideo = ({ src, alt, caption, isMobile = false }: { src: string, alt: string, caption?: string, isMobile?: boolean }) => (
    <div className="space-y-3 mb-6">
        <div className={`relative w-full ${isMobile ? 'aspect-[9/16]' : 'aspect-video'} rounded-[24px] overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-md bg-slate-100 dark:bg-slate-900 ring-4 ring-indigo-500/10`}>
            <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[24px]"></div>
            <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                Guia Visual
            </div>
        </div>
        {caption && (
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center px-4">
                {caption}
            </p>
        )}
    </div>
);

const commonSteps: CustomStep[] = [
    // 1. DASHBOARD & HOME
    {
        target: 'body',
        placement: 'center',
        disableBeacon: true,
        title: '🌟 PASSO 1: Começando sua Jornada',
        content: (
            <div className="text-left space-y-6">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo do Painel Inicial"
                    caption="Sua 'Home' - Onde tudo começa"
                />
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed">
                        Bem-vindo ao seu novo assistente escolar! Esta tela inicial é como sua **mesa de professor organizada**.
                    </p>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2 uppercase tracking-wide">O que você vê aqui?</p>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="mt-1"><Icon name="schedule" color="indigo-500" /></div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">**Aula de Hoje:** O sistema te avisa qual sua próxima turma para você não precisar consultar papéis.</span>
                            </li>
                            <li className="flex gap-3">
                                <div className="mt-1"><Icon name="pie_chart" color="emerald-500" /></div>
                                <span className="text-sm text-slate-600 dark:text-slate-400">**Resumo Geral:** Veja quantos alunos você atende e o desempenho médio das suas turmas.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )
    },
    // 1.1 INTERACTIVE DASHBOARD
    {
        target: '#tutorial-dash-next-class',
        placement: 'bottom',
        title: '👉 Tente Você Mesmo!',
        content: 'Clique no card "Aula de Hoje" para ver os detalhes da sua próxima turma.',
        interactiveAction: { type: 'click', target: '#tutorial-dash-next-class' }
    },
    // 2. PLANNING LIST
    {
        target: '#tutorial-sidebar',
        placement: 'right',
        disableBeacon: true,
        title: '📑 PASSO 2: Sua Biblioteca de Aulas',
        content: (
            <div className="text-left space-y-5">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo da Lista de Planos"
                    caption="Organize seus ensinamentos"
                />
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-200">
                        No menu lateral, você acessa o **Planejamento** sempre que quiser preparar uma aula.
                    </p>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Ação Simples:</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Clique no item **Planejamento** agora para continuarmos nosso guia por lá.
                        </p>
                    </div>
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '[data-tour="nav-planning"]' }
    },
    // 3. PLANNING FORM (DETAILED)
    {
        target: '#tutorial-planning-new-btn',
        placement: 'left',
        disableBeacon: true,
        title: '💎 PASSO 3: Criando uma Aula',
        content: (
            <div className="text-left space-y-5">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo Criando Aula"
                    caption="Planejar nunca foi tão rápido"
                />
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                    Clique no botão **(+)** para abrir o formulário de nova aula e ver como a mágica da BNCC funciona.
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '#tutorial-planning-new-btn' }
    },
    // 3.1 BNCC FIELD
    {
        target: '#tutorial-planning-bncc-field',
        placement: 'top',
        title: '🧠 A Mágica da BNCC',
        content: 'Clique neste campo para pesquisar e selecionar as habilidades da BNCC. O sistema preenche os objetivos automaticamente!',
        interactiveAction: { type: 'click', target: '#tutorial-planning-bncc-field' }
    },
    // 4. ACTIVITIES
    {
        target: '#tutorial-sidebar li:nth-child(3)',
        placement: 'right',
        disableBeacon: true,
        title: '🏆 PASSO 4: Avaliando os Alunos',
        content: (
            <div className="text-left space-y-5">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo de Atividades"
                    caption="Crie provas, trabalhos e tarefas"
                />
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-200">
                        Na aba **Atividades**, você cria os "eventos" que valerão nota.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                        <p className="text-sm font-black text-amber-700 dark:text-amber-400 mb-2 underline">Explicação de PESO:</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            Se uma prova vale mais que um dever, dê um **Peso maior** para ela. Clique em Atividades agora para ver!
                        </p>
                    </div>
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '[data-tour="nav-activities"]' }
    },
    // 5. GRADES DIARY
    {
        target: '#tutorial-sidebar li:nth-child(4)',
        placement: 'right',
        disableBeacon: true,
        title: '📊 PASSO 5: O Diário de Notas Mágico',
        content: (
            <div className="text-left space-y-5">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo das Notas"
                    caption="Esqueça a calculadora"
                />
                <div className="space-y-4 text-slate-700 dark:text-slate-200">
                    <p className="text-base text-sm">Clique em **Notas** para ver como a mágica das médias acontece automaticamente.</p>
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '[data-tour="nav-grades"]' }
    },
    // 6. ATTENDANCE
    {
        target: '#tutorial-sidebar li:nth-child(5)',
        placement: 'right',
        disableBeacon: true,
        title: '⏱️ PASSO 6: Chamada em Segundos',
        content: (
            <div className="text-left space-y-5">
                <TutorialVideo
                    src="/tutorial/desktop_guide.png"
                    alt="Vídeo da Chamada"
                    caption="Rápido e sem papel"
                />
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-200 text-sm">
                        Clique em **Frequência** para ver como registrar quem veio à aula com apenas um toque.
                    </p>
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '[data-tour="nav-attendance"]' }
    },
    // 7. FINISH
    {
        target: 'body',
        placement: 'center',
        disableBeacon: true,
        title: '🎉 JORNADA CONCLUÍDA!',
        content: (
            <div className="text-center space-y-6 pt-2">
                <div className="size-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[36px] flex items-center justify-center mx-auto shadow-2xl relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-30 animate-pulse"></div>
                    <span className="material-symbols-outlined text-6xl text-white relative">rocket_launch</span>
                </div>
                <div className="space-y-2">
                    <p className="text-2xl font-black text-slate-900 dark:text-white">Você é um Especialista!</p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
                        O Prof. Acerta+ agora é sua principal ferramenta. Explore sem medo! Se esquecer de algo, este guia estará sempre aqui no menu.
                    </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Toque em "Finalizar" para começar a usar.</p>
                </div>
            </div>
        )
    }
];

// --- DESKTOP STEPS ---
export const desktopSteps: CustomStep[] = commonSteps;

// --- MOBILE PORTRAIT STEPS ---
export const mobilePortraitSteps: CustomStep[] = [
    {
        target: 'body',
        placement: 'center',
        disableBeacon: true,
        title: '📱 PASSO 1: Professor em Movimento',
        content: (
            <div className="text-left space-y-6">
                <TutorialVideo
                    src="/tutorial/mobile_guide.png"
                    alt="Guia Animado Mobile"
                    caption="Mobilidade Total"
                    isMobile
                />
                <div className="space-y-4">
                    <p className="text-slate-700 dark:text-slate-200 font-medium">
                        O Prof. Acerta+ funciona como um aplicativo direto no seu celular.
                    </p>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                            "Aproveite para planejar ou fazer a chamada em qualquer lugar, até na fila do banco!"
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        target: '#tutorial-mobile-nav',
        placement: 'top',
        disableBeacon: true,
        title: '🧭 Navegação sem Erro',
        content: (
            <div className="text-left space-y-6">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Os botões no rodapé são seu mapa. Toque em **Aulas** (ícone de livro) para irmos ao Planejamento.
                    </p>
                </div>
            </div>
        ),
        interactiveAction: { type: 'click', target: '#tutorial-mobile-nav-planning' }
    },
    ...commonSteps.slice(1)
];

// --- MOBILE LANDSCAPE STEPS (Zen Mode) ---
export const mobileLandscapeSteps: CustomStep[] = commonSteps;
