import React, { useState, useCallback, useMemo, useEffect } from 'react';
import logoSrc from '../assets/logo.svg';

import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';
import { PasswordSetupModal } from './PasswordSetupModal';

import { NotificationCenter } from './NotificationCenter';
import { AnimatedNavItem } from './AnimatedNavItem';

import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';
import { BackgroundPattern } from './BackgroundPattern';
import { useSchool } from '../institutional/contexts/SchoolContext';
import { DesktopTitleBar } from './DesktopTitleBar';

import { usePredictiveSync } from '../hooks/usePredictiveSync';


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
        setIsMobileMenuOpen(false);
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
      { path: '/instructions', label: 'Manual de Uso', icon: 'menu_book' },
      { path: '/dashboard', label: 'Início', icon: 'dashboard' },
      { path: '/timetable', label: 'Horário', icon: 'schedule' },
      { path: '/planning', label: 'Planejamento', icon: 'calendar_month' },
      { path: '/activities', label: 'Atividades', icon: 'assignment' },
      { path: '/grades', label: 'Notas', icon: 'grade' },
      { path: '/attendance', label: 'Frequência', icon: 'co_present' },
      { path: '/students', label: 'Alunos', icon: 'groups' },
      { path: '/observations', label: 'Ocorrências', icon: 'warning' },
      { path: '/reports', label: 'Relatórios', icon: 'description' },
    ];

    // Add institution link for users with a school
    if (currentSchool?.id) {
      baseItems.push({
        path: `/institution/${currentSchool.id}/dashboard`,
        label: 'Minha Escola',
        icon: 'corporate_fare'
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
    <div className="fixed inset-0 w-full h-[100dvh] flex bg-surface-page overflow-hidden selection:bg-primary/10 selection:text-primary">
      {window.electronAPI?.isElectron && <DesktopTitleBar />}
      {/* Dynamic Background Pattern - Fixed and isolated */}
      <BackgroundPattern
        theme={theme}
        activeSubject={isInstitutionalRoute ? undefined : (activeSubject || undefined)}
      />


      {/* Background handled by BackgroundPattern — no duplicate blobs */}



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
        className={`fixed ${window.electronAPI?.isElectron ? 'top-10' : 'top-4'} bottom-4 left-4 z-[60] glass-card-premium flex flex-col shadow-2xl lg:shadow-neon shrink-0 group/sidebar overflow-hidden transition-all duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0 w-72 border-r-0' : ''} 
          ${!isMobileMenuOpen && isSidebarCollapsed ? 'lg:-translate-x-full w-0 border-0 p-0 opacity-0 pointer-events-none' : 'lg:translate-x-0 w-72 border-r-0'}
          ${!isMobileMenuOpen && !isSidebarCollapsed ? '-translate-x-[120%]' : ''}
        `}
      >
        <div className="flex flex-col h-full justify-between bg-transparent">
          <div className="lg:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-surface-section rounded-full text-text-secondary hover:bg-surface-subtle hover:text-text-primary backdrop-blur-md transition-colors shadow-sm">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 landscape:p-2 flex flex-col gap-4 landscape:gap-2">
            <div className={`relative px-2 py-4 landscape:py-2 border-b border-border-default mb-2 shrink-0 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
              {!isSidebarCollapsed ? (
                <div
                  onClick={() => { setProfileDefaultTab('schools'); setIsProfileModalOpen(true); }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-subtle transition-all group border border-transparent hover:border-border-default"
                  title="Alternar contexto"
                >
                  <div className={`size-10 rounded-lg flex items-center justify-center shadow-sm shrink-0 overflow-hidden ${isInstitutionalRoute ? 'bg-white border border-border-default' : 'bg-transparent'}`}>
                    {isInstitutionalRoute ? (
                      currentSchool?.logo_url ? (
                        <img src={currentSchool.logo_url} alt={currentSchool.name} className="size-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-xl">school</span>
                      )
                    ) : (
                      <img src={logoSrc} alt="Acerta+" className="size-full object-contain" />
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider truncate w-full text-left">
                      {isInstitutionalRoute ? 'Gestão Escolar' : 'Minha Sala'}
                    </span>
                    <span className="text-sm font-black text-text-primary truncate w-full text-left leading-tight">
                      {isInstitutionalRoute ? (currentSchool?.name || 'Escola') : 'Prof. Acerta+'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-lg opacity-0 group-hover:opacity-100 transition-opacity">swap_horiz</span>
                </div>
              ) : (
                <div className="size-10 rounded-lg flex items-center justify-center overflow-hidden">
                  {isInstitutionalRoute && currentSchool?.logo_url ? (
                    <img src={currentSchool.logo_url} alt={currentSchool.name} className="size-full object-cover" />
                  ) : (
                    <img src={logoSrc} alt="Acerta+" className="size-10 object-contain drop-shadow-md shrink-0" />
                  )}
                </div>
              )}
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
                  isCollapsed={isSidebarCollapsed && !isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen(false)}
                  // @ts-ignore - Adding prop dynamically
                  isSpecial={item.isSpecial}
                />
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-border-default flex flex-col gap-2">
            <button onClick={theme.toggleTheme} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-surface-subtle hover:text-amber-500 transition-all active:scale-95 hover:scale-[1.01] group border border-transparent hover:border-border-default ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
              <span className="material-symbols-outlined text-[24px] font-medium transition-transform duration-500 lg:group-hover:rotate-[180deg]">{theme.isDarkMode ? 'light_mode' : 'dark_mode'}</span>
              <span className={`text-sm font-medium animate-in fade-in duration-300 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Alternar Tema</span>
            </button>
            <button onClick={logout} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-text-muted hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/20 border border-transparent transition-all active:scale-95 hover:scale-[1.01] group ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
              <span className="material-symbols-outlined text-[24px] font-medium transition-transform group-hover:-translate-x-1">logout</span>
              <span className={`text-sm font-medium animate-in fade-in duration-300 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Sair</span>
            </button>
          </div>
        </div >
      </aside >

      {/* Sidebar Toggle Button - Hidden when modals are open OR Restricted View */}
      {/* Sidebar Toggle Button - Hidden when modals are open OR Restricted View */}
      {
        !isProfileModalOpen && !isPasswordSetupOpen && !isClassSelectorOpen && (
          <button
            onClick={toggleSidebar}
            className={`hidden lg:flex fixed z-[70] top-8 size-12 items-center justify-center rounded-full transition-all duration-300 ease-out will-change-transform hover:scale-110 active:scale-95 group left-6 ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-[17rem]'} bg-surface-card/60 backdrop-blur-md shadow-[0_4px_20px_-5px_rgba(var(--theme-primary-500),0.3),0_0_0_1px_rgba(var(--theme-primary-500),0.1)] border border-[rgba(var(--theme-primary-500),0.3)] [--theme-primary-500:var(--${theme.primaryColor}-500)]`}
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {/* Inner Glow Ring */}
            <div
              className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[inset_0_0_15px_rgba(var(--theme-color),0.4),0_0_15px_rgba(var(--theme-color),0.4)]`}
            />

            {/* Icon */}
            <span
              className={`material-symbols-outlined text-3xl font-bold transition-all duration-300 ease-out relative z-10 ${isSidebarCollapsed ? 'translate-x-0.5' : 'rotate-180 -translate-x-0.5'} text-[var(--${theme.primaryColor}-500)]`}
            >
              chevron_right
            </span>
          </button>
        )
      }

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-full relative z-10 transition-[margin] duration-300 ease-out
          ${isSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-72'}
        `}
      >
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[55] lg:hidden transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <header
          className={`flex flex-col md:flex-row items-center justify-between mx-2 md:mx-4 mt-2 md:mt-4 mb-2 rounded-2xl glass-card-soft px-2 py-1.5 md:px-3 md:py-3 z-[40] shrink-0 gap-3 sticky top-2 shadow-lg shadow-black/5 bg-white/80 dark:bg-slate-900/80 min-h-[48px] md:min-h-[60px]`}
        >
          {/* Main Flex Container - Single Row on Mobile */}
          <div className="flex w-full items-center justify-between gap-x-2 gap-y-0">

            {/* 1. LEFT: Menu (Visible on Mobile, Hidden on Desktop) */}
            {/* 1. LEFT: Menu (Visible on Mobile, Hidden on Desktop) */}
            <div className="flex items-center shrink-0 lg:w-auto">
              <button className="lg:hidden text-text-primary p-1.5 hover:bg-surface-subtle rounded-lg transition-colors shrink-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <span className="material-symbols-outlined text-xl">menu</span>
              </button>
            </div>

            {/* 2. CENTER: Series + Classes (Hidden on Mobile, Desktop Center) - HIDDEN for Coordinator */}
            {!isCoordinator && (
              <div className="hidden lg:flex flex-wrap items-center justify-center gap-2 flex-1 order-3 md:order-2 w-full md:w-auto mt-2 md:mt-0 min-w-[200px]">

                {/* Series Selector - HIDDEN on Mobile */}
                <button onClick={() => setIsClassSelectorOpen(true)} className="hidden md:flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl bg-surface-card/50 hover:bg-surface-card/80 transition-all duration-300 border border-border-default hover:border-primary/30 shadow-sm active:scale-95 backdrop-blur-sm shrink-0" title="Gerenciar Turmas">
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

                {/* Divider */}
                <div className="h-6 w-px bg-border-default mx-1 hidden sm:block shrink-0"></div>

                {/* Classes List */}
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

            {/* 3. RIGHT: Subject + Profile (Aligned Right, Compact on Mobile) */}
            <div className="flex items-center justify-end gap-1.5 shrink-0 ml-auto bg-transparent md:bg-surface-subtle/30 p-0 md:p-1 rounded-xl order-2 md:order-3">

              {/* MOBILE ONLY: Series Selector (Next to Profile) - HIDDEN for Coordinator */}
              {!isCoordinator && (
                <button
                  onClick={() => setIsClassSelectorOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 bg-surface-card px-2 py-1 rounded-lg border border-border-default active:scale-95 transition-all shadow-sm h-8"
                >
                  <div className="flex flex-col items-end leading-none">
                    {/* <span className="text-[6px] font-black text-text-muted uppercase tracking-wider font-mono hidden sm:inline">Turma</span> */}
                    <span className="text-[10px] sm:text-xs font-black text-text-primary capitalize flex items-center gap-1">
                      {activeSeries?.name || '?'} <span className="bg-primary text-white px-1 sm:px-1.5 rounded text-[9px] sm:text-[10px]">{selectedSection}</span>
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[10px] text-text-muted bg-surface-subtle rounded-full p-0.5">expand_more</span>
                </button>
              )}


              {/* Subject Selector / Role Display - HIDDEN on Mobile */}
              {currentUser && (
                <div className="relative shrink-0 hidden md:block">
                  {isCoordinator ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 select-none cursor-default">
                      <span className="material-symbols-outlined text-[16px]">local_police</span>
                      <span>Coordenador Pedagógico</span>
                    </div>
                  ) : (
                    <>
                      {/* Only Show Subject Selector if there are subjects available in this context */}
                      {availableSubjects.length > 0 && (
                        <>
                          <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-surface-subtle hover:text-primary transition-colors border border-border-subtle bg-surface-card/30">
                            <span className={`size-2 rounded-full bg-primary shadow-neon`}></span>
                            <span className="inline-block max-w-[150px] truncate">{activeSubject || 'Selecione...'}</span>
                            <span className="material-symbols-outlined text-xs">expand_more</span>
                          </button>
                          {/* Dropdown Logic Kept Same - Rendered via Portal or Absolute usually, reusing state */}
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

              {/* Help & Notifications */}
              <div className="flex items-center gap-1 transition-transform duration-300 lg:scale-110">
                <Link to="/instructions" title="Precisa de ajuda?" className="hidden md:flex landscape:flex items-center justify-center size-9 rounded-full text-text-muted hover:text-primary hover:bg-surface-subtle transition-colors group">
                  <span className="material-symbols-outlined text-xl group-hover:animate-bounce">help</span>
                </Link>
                <div className="flex items-center justify-center transform transition-transform hover:scale-110 scale-90 md:scale-100">
                  <NotificationCenter />
                </div>
              </div>

              {/* User Profile - Compacted on Mobile */}
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 bg-surface-card px-1.5 py-1 md:px-2.5 md:py-2 rounded-lg md:rounded-xl border border-border-default hover:border-primary/30 transition-all active:scale-95 group shrink-0 shadow-sm md:ml-2 lg:scale-105 origin-right">
                <div className="size-7 md:size-9 rounded-md md:rounded-lg bg-surface-subtle overflow-hidden border border-border-default shadow-sm group-hover:scale-105 transition-transform">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className={`size-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-xs`}>
                      {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black text-text-primary truncate w-full text-left">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono truncate w-full text-left">{theme.subject || activeSubject}</span>
                </div>
              </button>
            </div>

          </div>
        </header>



        {/* Main Content Area - Fixed Scrolling */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar relative px-4 md:px-8 pb-24 md:pb-12 pb-safe-area-bottom`}>
          {children}
        </main>

        <div>
          {/* Mobile Bottom Nav Removed */}
        </div>
      </div>

    </div >
  );
};