import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import logoSrc from '../assets/logo.svg';

import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';
import { PasswordSetupModal } from './PasswordSetupModal';

import { NotificationCenter } from './NotificationCenter';
import { AnimatedNavItem } from './AnimatedNavItem';
import { AnimatedButton } from './ui/AnimatedButton'; // New Primitive

import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';
import { useSchool } from '../institutional/contexts/SchoolContext';
import { DesktopTitleBar } from './DesktopTitleBar';


import { usePredictiveSync } from '../hooks/usePredictiveSync';
import { prefetchRoute } from '../utils/routeLoaders';


export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, activeSubject, updateActiveSubject } = useAuth();
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = theme;
  const { classes, activeSeries, selectedSeriesId, selectedSection, selectSeries, selectSection, removeClass: deleteSeries, addClass: addSeries, removeSection, addSection } = useClass();
  const { isCoordinator, currentSchool } = useSchool();
  const location = useLocation();

  // Active Predictive Sync
  usePredictiveSync();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileDefaultTab, setProfileDefaultTab] = useState<'profile' | 'schools' | 'security'>('profile');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);
  const [isPasswordSetupOpen, setIsPasswordSetupOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');




  useEffect(() => {
    // SECURITY CHECK:
    // If user is logged in but has no password (e.g., initial Google Login),
    // we allow them to stay but FORCE the password setup modal.
    if (currentUser) {
      if (!currentUser.isPasswordSet && !isPasswordSetupOpen) {
        setIsPasswordSetupOpen(true);
      } else if (currentUser.isPasswordSet && isPasswordSetupOpen) {
        // Close it if it was open but requirements were met elsewhere
        setIsPasswordSetupOpen(false);
      }
    }
  }, [currentUser, isPasswordSetupOpen]);

  // Bug Fix: Close mobile menu on resize to prevent "floating" sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(prev => prev ? false : prev);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const isInstitutionalRoute = location.pathname.startsWith('/institution/') && !location.pathname.startsWith('/institution/create') && !location.pathname.startsWith('/institution/join');
  const currentInstitutionId = isInstitutionalRoute ? location.pathname.split('/')[2] : null;

  // Check for "Unassigned Teacher" state
  const hasSubjects = currentUser?.subjects && currentUser.subjects.length > 0;
  const isRestrictedView = isInstitutionalRoute && !isCoordinator && !hasSubjects;

  const navItems = useMemo(() => {
    if (isRestrictedView) {
      return [
        { path: '/dashboard', label: 'Sair da Escola', icon: 'arrow_back', isSpecial: true },
      ];
    }

    if (isInstitutionalRoute && currentInstitutionId) {
      const items = [
        { path: `/institution/${currentInstitutionId}/dashboard`, label: 'Visão Geral', icon: 'dashboard' },
        // Coordinator Only
        ...(isCoordinator ? [{ path: `/institution/${currentInstitutionId}/teachers`, label: 'Professores', icon: 'groups' }] : []),

        { path: `/institution/${currentInstitutionId}/classes`, label: 'Turmas', icon: 'class' },
        { path: `/institution/${currentInstitutionId}/students`, label: 'Alunos', icon: 'school' },
        { path: `/institution/${currentInstitutionId}/schedule`, label: 'Horários', icon: 'schedule' },
        { path: `/institution/${currentInstitutionId}/grades`, label: 'Notas', icon: 'grade' },
        { path: `/institution/${currentInstitutionId}/student-attendance`, label: 'Frequência', icon: 'fact_check' },
        { path: `/institution/${currentInstitutionId}/occurrences`, label: 'Ocorrências', icon: 'campaign' },
        { path: `/institution/${currentInstitutionId}/plans`, label: 'Planejamentos', icon: 'edit_note' },
        { path: `/institution/${currentInstitutionId}/reports`, label: 'Pareceres', icon: 'description' },

        // Coordinator Only
        ...(isCoordinator ? [
          { path: `/institution/${currentInstitutionId}/checkins`, label: 'Registro GPS', icon: 'location_on' },
          { path: `/institution/${currentInstitutionId}/ai-reports`, label: 'Inteligência', icon: 'psychology' },
          { path: `/institution/${currentInstitutionId}/settings`, label: 'Configurações', icon: 'settings' }
        ] : []),

        { path: `/institution/${currentInstitutionId}/events`, label: 'Eventos', icon: 'event' },

        // Add divider or distinct styling for 'exit'
        { path: '/dashboard', label: 'Meu Painel', icon: 'arrow_back', isSpecial: true },
      ];
      return items;
    }

    // Regular teacher navigation with conditional institution access
    const baseItems = [
      { path: '/instructions', label: 'Manual de Uso', icon: 'menu_book', prefetchKey: 'instructions' },
      { path: '/dashboard', label: 'Início', icon: 'dashboard', prefetchKey: 'dashboard' },
      { path: '/timetable', label: 'Horário', icon: 'schedule', prefetchKey: 'timetable' },
      { path: '/planning', label: 'Planejamento', icon: 'calendar_month', prefetchKey: 'planning' },
      { path: '/activities', label: 'Atividades', icon: 'assignment', prefetchKey: 'activities' },
      { path: '/grades', label: 'Notas', icon: 'grade', prefetchKey: 'grades' },
      { path: '/attendance', label: 'Frequência', icon: 'co_present', prefetchKey: 'attendance' },
      { path: '/students', label: 'Alunos', icon: 'groups', prefetchKey: 'students' },
      { path: '/observations', label: 'Ocorrências', icon: 'warning', prefetchKey: 'observations' },
      { path: '/reports', label: 'Relatórios', icon: 'description', prefetchKey: 'reports' },
    ];

    // Add institution link for users with a school
    if (currentSchool?.id) {
      baseItems.push({
        path: `/institution/${currentSchool.id}/dashboard`,
        label: 'Minha Escola',
        icon: 'corporate_fare',
        prefetchKey: 'inst_dashboard'
      });
    }

    return baseItems;
  }, [location.pathname, currentInstitutionId, currentSchool?.id, isCoordinator]);

  // Calculate available subjects based on context
  const availableSubjects = useMemo(() => {
    if (isInstitutionalRoute) {
      // In Institution: Only show subjects derived from ASSIGNED CLASSES
      // classes is already filtered by institutionId in ClassContext
      const subjectsFromClasses = new Set(classes.map(c => c.subject).filter(Boolean));
      return Array.from(subjectsFromClasses) as string[];
    } else {
      // In Personal: Show global subjects
      return Array.from(new Set([currentUser?.subject, ...(currentUser?.subjects || [])])).filter(Boolean) as string[];
    }
  }, [isInstitutionalRoute, classes, currentUser]);

  const handleSelectSeries = (id: string) => {
    selectSeries(id);
    setIsSeriesDropdownOpen(false);
  };

  const handleDeleteSeries = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta série?')) {
      try {
        await deleteSeries(id);
      } catch (e: any) {
        alert('Erro ao excluir série: ' + e.message);
      }
    }
  };

  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) return;
    await addSeries(newSeriesName);
    setNewSeriesName('');
  };

  const handleSwitchSection = (section: string) => {
    selectSection(section);
  };

  const handleRemoveSectionOneClick = async (e: React.MouseEvent, section: string) => {
    e.stopPropagation();
    if (window.confirm(`Excluir turma ${section}?`)) {
      await removeSection(activeSeries!.id, section);
    }
  };

  const handleAddSectionOneClick = async () => {
    if (!activeSeries) return;
    const next = String.fromCharCode(activeSeries.sections.length > 0
      ? activeSeries.sections[activeSeries.sections.length - 1].charCodeAt(0) + 1
      : 65);
    await addSection(activeSeries.id, next);
  };


  return (
    <div className="fixed inset-0 w-full h-[100dvh] flex bg-transparent overflow-hidden selection:bg-primary/10 selection:text-primary">
      {window.electronAPI?.isElectron && <DesktopTitleBar />}

      {/* Background handled at App level for persistence */}



      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => { setIsProfileModalOpen(false); setProfileDefaultTab('profile'); }}
        defaultTab={profileDefaultTab}
      />

      <PasswordSetupModal
        isOpen={isPasswordSetupOpen}
        onClose={() => setIsPasswordSetupOpen(false)}
        mandatory={currentUser ? (!currentUser.isPasswordSet || !currentUser.subject) : false}
      />



      <ClassManager
        isOpen={isClassSelectorOpen}
        onClose={() => setIsClassSelectorOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-50 h-[100dvh] transition-[width,border-color] duration-200 ease-out flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0 w-full bg-black/60 lg:bg-transparent' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-0 lg:border-transparent' : 'lg:w-72 lg:border-border-default'}
          lg:bg-slate-50/90 dark:bg-slate-900/60 lg:backdrop-blur-md lg:border-r lg:border-primary/10 dark:lg:border-primary/20 lg:shadow-[5px_0_30px_-10px_rgba(var(--primary-rgb),0.1)]
        `}
      >
        {/* NEW: External Floating Sidebar Toggle - Tied to Sidebar Width */}
        <button
          onClick={toggleSidebar}
          style={{
            transform: isSidebarCollapsed ? "rotate(0deg)" : "rotate(180deg)"
          }}
          className="hidden lg:flex absolute top-4 left-[calc(100%+1rem)] z-[60] items-center justify-center size-11 rounded-full bg-surface-elevated border-2 border-primary/20 text-text-muted hover:text-primary shadow-2xl hover:shadow-primary/30 backdrop-blur-xl active:scale-90 transition-all duration-200 ease-out"
          title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          <span className="material-symbols-outlined text-2xl block font-black leading-none">chevron_right</span>
        </button>

        {/* Internal Wrapper to maintain overflow-hidden for content */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          <div className={`flex flex-col h-full justify-between transition-opacity duration-200 relative ${isMobileMenuOpen ? 'bg-white dark:bg-[#0f172a] shadow-2xl border-r border-border-default w-[85vw] max-w-[320px]' : 'bg-transparent w-full'}`}>



            {/* Mobile Header with Divider */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-border-default bg-surface-subtle/30 backdrop-blur-sm shrink-0">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-text-primary hover:bg-surface-subtle transition-colors rounded-full active:scale-95"
                aria-label="Fechar Menu"
              >
                <span className="material-symbols-outlined text-3xl font-bold">close</span>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 landscape:p-2 flex flex-col gap-4 landscape:gap-2 overflow-x-hidden">

              {/* BRANDING WITH STRONG NEON PULSE */}
              <div className={`relative px-2 py-4 landscape:py-2 border-b border-border-default mb-2 shrink-0 min-w-[17rem]`}>
                <>
                  <div
                    className="flex-1 flex items-center justify-between gap-2 p-2 rounded-xl transition-all group min-w-0 pr-0"
                  >
                    <div
                      className="flex-1 flex items-center gap-3 p-2 rounded-xl bg-surface-elevated/50 backdrop-blur-sm border border-primary/10 mb-2 shadow-[0_0_15px_-3px_rgba(var(--primary-rgb),0.15)]"
                      title="Menu Principal"
                    >
                      <div
                        className={`size-12 rounded-xl flex items-center justify-center shrink-0 relative animate-neon-pulse-box ${isInstitutionalRoute ? 'bg-white' : 'bg-transparent'}`}
                      >
                        {isInstitutionalRoute ? (
                          currentSchool?.logo_url ? (
                            <img src={currentSchool.logo_url} alt={currentSchool.name} className="size-full object-cover animate-neon-pulse-logo" />
                          ) : (
                            <span className="material-symbols-outlined text-primary text-2xl drop-shadow-lg animate-neon-pulse-logo">school</span>
                          )
                        ) : (
                          <img src={logoSrc} alt="Acerta+" className="size-full object-contain filter drop-shadow-md animate-neon-pulse-logo" />
                        )}
                      </div>
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest truncate w-full text-left opacity-90">
                          {isInstitutionalRoute ? 'Gestão Escolar' : 'Minha Sala'}
                        </span>
                        <span
                          className="text-xl font-black text-text-primary truncate w-full text-left leading-none tracking-tight animate-neon-pulse-text"
                        >
                          {isInstitutionalRoute ? (currentSchool?.name || 'Escola') : 'Prof. Acerta+'}
                        </span>
                      </div>
                    </div>


                  </div>




                </>
              </div>

              <div className="lg:hidden landscape:hidden flex flex-col gap-2 mb-2 p-3 bg-surface-section rounded-2xl border border-border-default shrink-0 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}>
                  <div className="size-10 rounded-full bg-surface-subtle overflow-hidden shrink-0 border-2 border-primary/50 shadow-neon">
                    {currentUser?.photoUrl ? (
                      <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-sm font-bold`}>
                        {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isInstitutionalRoute ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold truncate text-text-primary group-hover:text-primary transition-colors">
                        {currentSchool?.name || 'Carregando...'}
                      </span>

                      {/* Coordinator Badge */}
                      {isCoordinator && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-500 fill-current">local_police</span>
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                            Coordenador
                          </span>
                        </div>
                      )}

                      {!isCoordinator && (
                        <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
                          Painel {currentSchool?.name ? `da ${currentSchool.name}` : 'Institucional'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary shadow-black/5 dark:shadow-black/50 drop-shadow-sm">{currentUser?.name?.split(' ')[0]}</span>
                      <span className="text-[9px] uppercase tracking-widest text-primary font-mono">Meu Perfil</span>
                    </div>
                  )}
                  <span className="material-symbols-outlined text-text-muted ml-auto bg-surface-subtle rounded-full p-1 text-[16px]">settings</span>
                </div>
              </div>

              <div className="lg:hidden landscape:hidden px-3 mb-2 shrink-0">
                <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block px-1 font-mono">Matéria Atual</label>
                <div className="bg-surface-section rounded-xl border border-border-default overflow-hidden backdrop-blur-md shadow-sm">
                  <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="w-full flex items-center justify-between p-3 hover:bg-surface-subtle transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-primary shadow-neon"></span>
                      <span className="font-bold text-sm text-text-primary">{activeSubject}</span>
                    </div>
                    <span className={`material-symbols-outlined text-text-muted transition-transform duration-200 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                  </button>

                  {/* Mobile Subject List Accordion */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubjectDropdownOpen ? 'max-h-60 border-t border-border-subtle' : 'max-h-0'}`}>
                    <div className="bg-surface-subtle/30 p-1">
                      {availableSubjects.length > 0 ? (
                        availableSubjects.map((subj: string) => (
                          <button
                            key={subj}
                            onClick={() => {
                              updateActiveSubject(subj);
                              setIsSubjectDropdownOpen(false);
                              setIsMobileMenuOpen(false); // Optional: close menu on selection
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${activeSubject === subj ? `bg-primary/10 text-primary` : 'text-text-secondary hover:bg-surface-subtle'}`}
                          >
                            <span className={`size-1.5 rounded-full ${activeSubject === subj ? 'bg-primary' : 'bg-transparent border border-text-muted'}`}></span>
                            {subj}
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-text-muted">
                          Nenhuma disciplina atribuída.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex flex-col gap-2 landscape:gap-1 mt-2">
                {navItems.map((item) => (
                  <AnimatedNavItem
                    key={item.path}
                    path={item.path}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive(item.path)}
                    isCollapsed={false}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onMouseEnter={() => (item as any).prefetchKey && prefetchRoute((item as any).prefetchKey)}
                    // @ts-ignore - Adding prop dynamically
                    isSpecial={item.isSpecial}
                  />
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-border-default flex flex-col gap-2">
              <button onClick={theme.toggleTheme} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-surface-subtle hover:text-amber-500 transition-all active:scale-95 hover:scale-[1.01] group border border-transparent hover:border-border-default min-w-[240px]`}>
                <span className="material-symbols-outlined text-[24px] font-medium transition-transform duration-500 lg:group-hover:rotate-[180deg]">{theme.isDarkMode ? 'light_mode' : 'dark_mode'}</span>
                <span className="text-sm font-medium animate-in fade-in duration-300">Alternar Tema</span>
              </button>
              <button onClick={logout} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/20 border border-transparent transition-all active:scale-95 hover:scale-[1.01] group min-w-[240px]`}>
                <span className="material-symbols-outlined text-[24px] font-medium transition-transform group-hover:-translate-x-1">logout</span>
                <span className="text-sm font-medium animate-in fade-in duration-300">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>


      {/* Sidebar Toggle Button - Fixed Position Toggle - ONLY when Collapsed */}


      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full relative z-10 transition-[margin] duration-200 ease-out
          ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-72'}
        `}
      >
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[55] lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <header
          className={`flex flex-col md:flex-row items-center justify-between mx-1 md:mx-3 mt-1 mb-1 rounded-2xl px-2 py-0.5 md:px-3 md:py-0.5 z-[40] shrink-0 gap-1 md:gap-2 sticky top-1 min-h-[36px] md:min-h-[38px]
            bg-white/95 dark:bg-slate-900/80 backdrop-blur-md
            border border-primary/10 dark:border-primary/20 shadow-lg shadow-primary/5 dark:shadow-primary/10
            lg:px-6
          `}
        >
          {/* Main Flex Container - Single Row on Mobile */}
          <div className="flex w-full items-center justify-between gap-x-2 gap-y-0">

            {/* 1. LEFT: Menu & Context */}
            <div className={`flex items-center gap-2 md:gap-3 shrink-0 lg:w-auto relative z-50 transition-all duration-200 ease-out lg:pl-28`}>
              <button
                className="lg:hidden flex items-center justify-center p-2 rounded-xl bg-surface-subtle border border-border-default text-text-primary hover:text-primary transition-colors shrink-0 shadow-sm active:scale-95 touch-manipulation"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Abrir Menu"
              >
                <span className="material-symbols-outlined text-2xl font-black">menu</span>
              </button>

              {/* CONTEXT SWITCHER */}
              <button
                onClick={() => { setProfileDefaultTab('schools'); setIsProfileModalOpen(true); }}
                className="flex items-center gap-2 md:gap-3 group hover:bg-surface-subtle/50 px-2 py-1 rounded-xl transition-colors -ml-1"
                title="Alternar contexto"
              >
                <div className={`size-8 md:size-9 rounded-lg flex items-center justify-center shadow-sm shrink-0 overflow-visible transition-transform group-hover:scale-105 animate-neon-pulse-box ${isInstitutionalRoute ? 'bg-white border border-border-default' : 'bg-transparent'}`}>
                  {isInstitutionalRoute ? (
                    currentSchool?.logo_url ? (
                      <img src={currentSchool.logo_url} alt={currentSchool.name} className="size-full object-cover animate-neon-pulse-logo" />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-xl animate-neon-pulse-logo font-black">school</span>
                    )
                  ) : (
                    <img src={logoSrc} alt="Acerta+" className="size-full object-contain animate-neon-pulse-logo" />
                  )}
                </div>
                <div className="flex flex-col items-start leading-tight max-w-[100px] md:max-w-xs">
                  <span className="hidden lg:block text-[9px] md:text-[10px] font-bold text-text-muted uppercase tracking-wider truncate w-full text-left group-hover:text-primary transition-colors">
                    {isInstitutionalRoute ? 'Gestão' : 'Minha Sala'}
                  </span>
                  <span className="text-xs md:text-sm font-black text-text-primary truncate w-full text-left leading-none animate-neon-pulse-text">
                    {isInstitutionalRoute ? (currentSchool?.name || 'Escola') : 'Prof. Acerta+'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-text-muted text-xs group-hover:text-primary transition-colors font-black">expand_more</span>
              </button>
            </div>

            {/* 2. CENTER: Series + Classes (Now visible on Tablet MD+) */}
            {!isCoordinator && (
              <div className="hidden md:flex flex-wrap items-center justify-center gap-2 flex-1 order-3 md:order-2 w-full md:w-auto mt-2 md:mt-0 min-w-[150px] lg:min-w-[200px]">
                <button
                  onClick={() => setIsClassSelectorOpen(true)}
                  className="flex items-center gap-2 pl-1.5 pr-2 lg:pr-3 py-1.5 rounded-xl bg-surface-card/50 hover:bg-surface-card/80 transition-all duration-300 border border-border-default hover:border-primary/30 shadow-sm active:scale-95 backdrop-blur-sm shrink-0"
                  title="Gerenciar Turmas"
                >
                  <div className={`size-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20`}>
                    <span className="material-symbols-outlined text-base font-black">{theme.icon}</span>
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest leading-none font-mono">Série</span>
                    <div className="flex items-center gap-0.5">
                      <span className="font-black text-sm text-text-primary tracking-tight leading-none">{activeSeries?.name || 'Selecione...'}</span>
                      <span className="material-symbols-outlined text-text-muted text-[10px]">expand_more</span>
                    </div>
                  </div>
                </button>

                <div className="h-6 w-px bg-border-default mx-1 hidden sm:block shrink-0"></div>

                <div className="flex items-center gap-2 flex-wrap justify-center">
                  {activeSeries?.sections.map(sec => (
                    <button key={sec} onClick={() => handleSwitchSection(sec)} className={`min-w-[2.5rem] h-8 px-3 rounded-lg font-bold text-xs transition-colors shrink-0 ${selectedSection === sec ? `bg-primary text-white shadow-neon` : 'bg-surface-card/50 border border-border-default text-text-secondary hover:bg-surface-subtle'}`}>
                      {sec}
                    </button>
                  ))}
                  {activeSeries && (
                    <button onClick={handleAddSectionOneClick} className={`size-8 rounded-lg flex items-center justify-center border border-dashed border-text-muted/50 text-text-muted hover:border-primary hover:text-white hover:bg-primary transition-colors shrink-0`} title="Nova Turma">
                      <span className="material-symbols-outlined text-sm font-black">add</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 3. RIGHT: Subject + Profile */}
            <div className="flex items-center justify-end gap-3 md:gap-4 shrink-0 ml-auto bg-transparent md:bg-surface-subtle/40 p-0 md:p-2 rounded-2xl order-2 md:order-3">
              {!isCoordinator && (
                <button
                  onClick={() => setIsClassSelectorOpen(true)}
                  className="md:hidden flex items-center gap-2 bg-white dark:bg-slate-800/80 px-3 h-10 rounded-xl border border-border-default active:scale-95 transition-all shadow-sm group hover:border-primary/40"
                >
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-0.5 group-hover:text-primary transition-colors">Série</span>
                    <span className="text-xs font-black text-text-primary capitalize flex items-center gap-1.5">
                      {activeSeries?.name || '?'}
                      <span className="bg-primary/10 text-primary border border-primary/20 px-1.5 rounded text-[10px] uppercase">{selectedSection}</span>
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-text-muted transition-transform group-hover:rotate-180 font-black">expand_more</span>
                </button>
              )}

              {currentUser && (
                <div className="relative shrink-0 hidden md:block">
                  {isCoordinator ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 select-none cursor-default">
                      <span className="material-symbols-outlined text-[16px]">local_police</span>
                      <span>Coordenador Pedagógico</span>
                    </div>
                  ) : (
                    <>
                      {availableSubjects.length > 0 && (
                        <>
                          <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="flex items-center gap-2 md:gap-3 px-3 md:px-4 h-9 md:h-10 rounded-xl text-sm font-bold text-text-secondary hover:bg-surface-subtle hover:text-primary transition-all border border-border-default bg-surface-card shadow-sm overflow-hidden group">
                            <span className={`size-2 md:size-2.5 rounded-full bg-primary shadow-neon shrink-0 animate-pulse`}></span>
                            <span className="inline-block max-w-[80px] md:max-w-[150px] lg:max-w-[200px] truncate">{activeSubject || 'Selecione...'}</span>
                            <span className="material-symbols-outlined text-base text-text-muted group-hover:text-primary transition-transform duration-300 group-hover:rotate-180">expand_more</span>
                          </button>
                          {isSubjectDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-[60]" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                              <div className="absolute top-full right-0 mt-2 w-48 bg-surface-elevated rounded-xl shadow-xl border border-border-subtle overflow-hidden z-[61] animate-in fade-in zoom-in-95 duration-200 glass-card-premium">
                                <div className="p-2 space-y-1">
                                  {availableSubjects.map(subj => (
                                    <button key={subj} onClick={() => { updateActiveSubject(subj); setIsSubjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubject === subj ? `bg-primary/10 text-primary` : 'text-text-secondary hover:bg-surface-subtle'}`}>
                                      {subj}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Link to="/instructions" title="Precisa de ajuda?" className="hidden md:flex items-center justify-center size-10 rounded-xl text-text-muted hover:text-primary hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-border-default hover:shadow-sm">
                  <span className="material-symbols-outlined text-2xl transition-transform group-hover:rotate-[360deg] duration-500">help</span>
                </Link>
                <div className="flex items-center justify-center transition-all hover:scale-110 active:scale-95">
                  <NotificationCenter />
                </div>
              </div>

              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 h-10 bg-white dark:bg-slate-800/80 px-1.5 lg:pl-1 lg:pr-3 rounded-xl border border-border-default hover:border-primary/40 transition-all active:scale-95 group shrink-0 shadow-sm hover:shadow-md">
                <div className="size-8 rounded-lg bg-surface-subtle overflow-hidden border border-border-default shadow-inner group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className={`size-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-xs uppercase`}>
                      {(currentUser?.name || '??').substring(0, 2)}
                    </div>
                  )}
                </div>
                <div className="hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black text-text-primary truncate max-w-[100px] text-left">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono truncate max-w-[100px] text-left flex items-center gap-1">
                    <span className="size-1 rounded-full bg-primary animate-pulse"></span>
                    Perfil
                  </span>
                </div>
              </button>
            </div>

          </div>
        </header>



        {/* Main Content Area - Fixed Scrolling */}
        {/* Main Content Area - Fixed Scrolling */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar relative px-[var(--space-s)] md:px-[var(--space-m)] lg:px-[var(--space-l)] pb-24 md:pb-12 pb-safe-area-bottom`}>
          {children}
        </main>

        <div>
          {/* Mobile Bottom Nav Removed */}
        </div>
      </div>

    </div >
  );
};