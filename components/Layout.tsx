import React, { useState, useCallback, useMemo, useEffect } from 'react';
import logoSrc from '../assets/logo.svg';

import { motion, useScroll, useMotionValue, useSpring } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { useSync } from '../hooks/useSync';
import { usePredictiveSync } from '../hooks/usePredictiveSync';
import { ProfileModal } from './ProfileModal';
import { PasswordSetupModal } from './PasswordSetupModal';

import { NotificationCenter } from './NotificationCenter';
import { AnimatedNavItem } from './AnimatedNavItem';

import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';
import { BackgroundPattern } from './BackgroundPattern';
import { DesktopTitleBar } from './DesktopTitleBar';
import { BackupService } from '../services/BackupService';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, activeSubject, updateActiveSubject } = useAuth();
  const theme = useTheme();
  const { classes, activeSeries, selectedSeriesId, selectedSection, selectSeries, selectSection, removeClass: deleteSeries, addClass: addSeries, removeSection, addSection } = useClass();
  const location = useLocation();

  // Auto-Backup Integration (PC Only)
  useEffect(() => {
    // 1. Check if we need to restore from file (on first load)
    BackupService.checkAndRestore();

    // 2. Set up auto-backup interval (every 5 minutes)
    const backupInterval = setInterval(() => {
      BackupService.performAutoBackup();
    }, 5 * 60 * 1000);

    return () => clearInterval(backupInterval);
  }, []);

  // 🔄 BACKGROUND SYNC: Active whenever Layout is mounted (Logged In)
  const { isSyncing, pendingCount } = useSync();

  // 🔮 PREDICTIVE SYNC: The "Clarividente" Robot
  const { prefetchStatus } = usePredictiveSync();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
      }
    }
  }, [currentUser, isPasswordSetupOpen]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/instructions', label: 'Manual de Uso', icon: 'menu_book' }, // MOVED TO TOP
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

  const { scrollY } = useScroll();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const orientX = useMotionValue(0);
  const orientY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 100 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const springOrientX = useSpring(orientX, springConfig);
  const springOrientY = useSpring(orientY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 40;
      const y = (clientY / window.innerHeight - 0.5) * 40;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
        const x = (e.gamma / 45) * 30;
        const y = ((e.beta - 45) / 45) * 30;
        orientX.set(x);
        orientY.set(y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [mouseX, mouseY, orientX, orientY]);

  // Enhanced Orientation & Resize Handler
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResizeAndOrientation = () => {
      // Clear existing timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Debounce execution
      timeoutId = setTimeout(() => {
        const isLandscape = window.innerWidth > window.innerHeight;
        const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint

        // If rotating to Portrait Mobile, force sidebar closed
        if (!isLandscape && !isLargeScreen) {
          setIsSidebarCollapsed(true);
          setIsMobileMenuOpen(false);
        }
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', handleResizeAndOrientation);
    window.addEventListener('orientationchange', handleResizeAndOrientation);

    return () => {
      window.removeEventListener('resize', handleResizeAndOrientation);
      window.removeEventListener('orientationchange', handleResizeAndOrientation);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const backgroundOrientation = useMemo(() => ({ x: springOrientX, y: springOrientY }), [springOrientX, springOrientY]);

  return (
    <div className="flex h-dvh w-full bg-surface-page overflow-hidden lg:overflow-hidden selection:bg-primary/10 selection:text-primary">
      {window.electronAPI?.isElectron && <DesktopTitleBar />}
      {/* Dynamic Background Pattern - Fixed and isolated */}
      <BackgroundPattern
        theme={theme}
        mouseX={springX}
        mouseY={springY}
        orientation={backgroundOrientation}
      />

      {/* PREMIUM ANIMATED BLOBS (Mesh Gradient) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] animate-blob mix-blend-multiply filter opacity-70"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/20 blur-[120px] animate-blob animation-delay-2000 mix-blend-multiply filter opacity-70"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-pink-500/10 blur-[150px] animate-blob animation-delay-4000 mix-blend-multiply filter opacity-70"></div>
      </div>



      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
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

      <motion.aside
        layout
        transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.6 }}
        className={`fixed ${window.electronAPI?.isElectron ? 'top-10' : 'top-4'} bottom-4 left-4 z-[60] glass-card-premium transform flex flex-col shadow-2xl lg:shadow-neon shrink-0 group/sidebar overflow-hidden transition-all duration-300
          ${isMobileMenuOpen ? 'translate-x-0 w-72 border-r-0' : ''} 
          ${!isMobileMenuOpen && isSidebarCollapsed ? 'lg:-translate-x-full landscape:-translate-x-full w-0 border-0 p-0 opacity-0 pointer-events-none' : 'lg:translate-x-0 landscape:translate-x-0 w-72 border-r-0'}
          ${!isMobileMenuOpen && !isSidebarCollapsed ? '-translate-x-[120%]' : ''}
        `}
      >
        <div className="flex flex-col h-full justify-between bg-transparent">
          <div className="lg:hidden landscape:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-surface-section rounded-full text-text-secondary hover:bg-surface-subtle hover:text-text-primary backdrop-blur-md transition-colors shadow-sm">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 landscape:p-2 flex flex-col gap-4 landscape:gap-2">
            <div className={`flex gap-3 items-center px-2 py-4 landscape:py-2 border-b border-border-default mb-2 shrink-0 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <img src={logoSrc} alt="Acerta+" className="size-12 object-contain drop-shadow-md shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
                  <h1 className="text-text-primary text-2xl font-black leading-none tracking-tight truncate filter drop-shadow-sm">Prof. Acerta<span className="text-primary">+</span></h1>
                  <p className="text-primary-hover text-[10px] font-mono font-bold uppercase tracking-[0.2em] mt-1 truncate ml-0.5">Gestão 3.0</p>
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
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary shadow-black/5 dark:shadow-black/50 drop-shadow-sm">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase tracking-widest text-primary font-mono">Meu Perfil</span>
                </div>
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
                  <span className="material-symbols-outlined text-text-muted">expand_more</span>
                </button>
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
        </div>
      </motion.aside>

      {/* Sidebar Toggle Button - Hidden when modals are open */}
      {!isProfileModalOpen && !isPasswordSetupOpen && !isClassSelectorOpen && (
        <button
          onClick={toggleSidebar}
          className={`hidden lg:flex fixed z-[70] top-8 size-12 bg-surface-card/95 border border-border-default rounded-full items-center justify-center shadow-xl shadow-${theme.primaryColor}/20 text-${theme.primaryColor} transition-transform duration-150 ease-out will-change-transform hover:scale-105 active:scale-95 group ring-0 hover:ring-4 ring-${theme.primaryColor}/10 left-6 ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-[17rem]'}`}
          title={isSidebarCollapsed ? "Expandir" : "Recolher"}
        >
          <span className={`material-symbols-outlined text-3xl font-bold transition-transform duration-150 ease-out ${isSidebarCollapsed ? '' : 'rotate-180'}`}>chevron_right</span>
        </button>
      )}

      {/* Main Content Area */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.6 }}
        className={`flex-1 flex flex-col min-w-0 h-full relative z-10 
          ${isSidebarCollapsed ? 'lg:ml-0 landscape:ml-0' : 'lg:ml-72 landscape:ml-72'}
        `}
      >
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-all" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <motion.header
          layout
          className={`flex flex-col md:flex-row items-center justify-between mx-2 md:mx-4 mt-2 md:mt-4 mb-2 rounded-2xl glass-card-soft backdrop-blur-none px-3 py-3 z-[40] shrink-0 gap-3 sticky top-2 shadow-lg shadow-black/5 bg-white/80 dark:bg-slate-900/80 min-h-[60px]`}
        >
          {/* Main Flex Container - Wraps on small screens */}
          <div className="flex flex-wrap w-full items-center justify-between gap-x-4 gap-y-2">

            {/* 1. LEFT: Menu (Visible on Mobile, Hidden on Desktop but keeps alignment if needed) */}
            <div className="flex items-center shrink-0 w-[50px] lg:w-auto">
              <button className="lg:hidden text-text-primary p-2 hover:bg-surface-subtle rounded-lg transition-colors shrink-0" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>

            {/* 2. CENTER: Series + Classes (Mobile: Bottom Row, Desktop: Center) */}
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

            {/* 3. RIGHT: Subject + Profile (Aligned Right) */}
            <div className="flex flex-wrap items-center justify-end gap-3 shrink-0 ml-auto bg-surface-subtle/30 p-1 rounded-xl order-2 md:order-3">

              {/* MOBILE ONLY: Series Selector (Next to Profile) */}
              <button
                onClick={() => setIsClassSelectorOpen(true)}
                className="lg:hidden flex items-center gap-2 bg-surface-card px-2 py-1.5 rounded-lg border border-border-default active:scale-95 transition-all shadow-sm"
              >
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-wider font-mono">Turma</span>
                  <span className="text-xs font-black text-text-primary capitalize flex items-center gap-1">
                    {activeSeries?.name || '?'} <span className="bg-primary text-white px-1 rounded text-[10px]">{selectedSection}</span>
                  </span>
                </div>
                <span className="material-symbols-outlined text-xs text-text-muted bg-surface-subtle rounded-full p-0.5">expand_more</span>
              </button>

              {/* Sync Status */}
              {(pendingCount > 0 || isSyncing) && (
                <div className="flex items-center justify-center size-8 rounded-full bg-amber-500/10 text-amber-600 animate-pulse shrink-0" title="Sincronizando...">
                  <span className={`material-symbols-outlined text-base ${isSyncing ? 'animate-spin' : ''}`}>{isSyncing ? 'sync' : 'cloud_upload'}</span>
                </div>
              )}

              {/* Subject Selector - HIDDEN on Mobile */}
              {currentUser && (
                <div className="relative shrink-0 hidden md:block">
                  <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-text-secondary hover:bg-surface-subtle hover:text-primary transition-colors">
                    <span className={`size-2 rounded-full bg-primary shadow-neon`}></span>
                    <span className="hidden xs:inline max-w-[120px] truncate">{activeSubject}</span>
                    <span className="material-symbols-outlined text-xs">expand_more</span>
                  </button>
                  {/* Dropdown Logic Kept Same - Rendered via Portal or Absolute usually, reusing state */}
                  {isSubjectDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-surface-elevated rounded-xl shadow-xl border border-border-subtle overflow-hidden z-[61] animate-in fade-in zoom-in-95 duration-200 glass-card-premium">
                        <div className="p-2 space-y-1">
                          {Array.from(new Set([currentUser.subject, ...(currentUser.subjects || [])])).map(subj => (
                            <button key={subj} onClick={() => { updateActiveSubject(subj); setIsSubjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubject === subj ? `bg-primary/10 text-primary` : 'text-text-secondary hover:bg-surface-subtle'}`}>
                              {subj}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Help & Notifications */}
              <div className="flex items-center gap-1.5 transition-transform duration-300 lg:scale-110">
                <Link to="/instructions" title="Precisa de ajuda?" className="hidden md:flex landscape:flex items-center justify-center size-9 rounded-full text-text-muted hover:text-primary hover:bg-surface-subtle transition-colors group">
                  <span className="material-symbols-outlined text-xl group-hover:animate-bounce">help</span>
                </Link>
                <div className="flex items-center justify-center transform transition-transform hover:scale-110">
                  <NotificationCenter />
                </div>
              </div>

              {/* User Profile */}
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-2 bg-surface-card px-2.5 py-2 rounded-xl border border-border-default hover:border-primary/30 transition-all active:scale-95 group shrink-0 shadow-sm md:ml-2 lg:scale-105 origin-right">
                <div className="size-9 rounded-lg bg-surface-subtle overflow-hidden border border-border-default shadow-sm group-hover:scale-105 transition-transform">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className={`size-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-xs`}>
                      {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[11px] font-black text-text-primary">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono">{activeSubject || theme.subject}</span>
                </div>
              </button>
            </div>

          </div>
        </motion.header>



        {/* Main Content Area - Fixed Scrolling */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar relative px-1`}>
          {children}
        </main>

        <div>
          {/* Mobile Bottom Nav Removed */}
        </div>
      </motion.div>

    </div>
  );
};