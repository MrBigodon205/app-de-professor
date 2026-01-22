import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';
import { PasswordSetupModal } from './PasswordSetupModal';

import { NotificationCenter } from './NotificationCenter';


import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';
import { BackgroundPattern } from './BackgroundPattern';
import { DesktopTitleBar } from './DesktopTitleBar';



export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, activeSubject, updateActiveSubject } = useAuth();
  const theme = useTheme();
  const { classes, activeSeries, selectedSeriesId, selectedSection, selectSeries, selectSection, removeClass: deleteSeries, addClass: addSeries, removeSection, addSection } = useClass();
  const location = useLocation();

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
    <div className={`flex h-dvh w-full bg-background-light dark:bg-background-dark overflow-hidden lg:overflow-hidden selection:bg-primary/10 selection:text-primary ${window.electronAPI?.isElectron ? 'pt-8' : ''}`}>
      <DesktopTitleBar />
      {/* Dynamic Background Pattern - Fixed and isolated */}
      <BackgroundPattern
        theme={theme}
        mouseX={springX}
        mouseY={springY}
        orientation={backgroundOrientation}
      />



      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <PasswordSetupModal
        isOpen={isPasswordSetupOpen}
        onClose={() => setIsPasswordSetupOpen(false)}
        mandatory={currentUser ? (!currentUser.isPasswordSet || !currentUser.subject) : false}
      />

      {/* Mobile Notifications Modal */}
      <NotificationCenter
        isMobile
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />

      <ClassManager
        isOpen={isClassSelectorOpen}
        onClose={() => setIsClassSelectorOpen(false)}
      />

      {/* Floating Sidebar */}
      <motion.aside
        layout
        transition={{ type: "spring", stiffness: 280, damping: 30, mass: 0.6 }}
        className={`fixed top-4 bottom-4 left-4 z-[60] glass-card-premium transform flex flex-col shadow-2xl lg:shadow-neon shrink-0 group/sidebar overflow-hidden transition-all duration-300
          ${isMobileMenuOpen ? 'translate-x-0 w-72 border-r-0' : ''} 
          ${!isMobileMenuOpen && isSidebarCollapsed ? 'lg:-translate-x-full landscape:-translate-x-full w-0 border-0 p-0 opacity-0 pointer-events-none' : 'lg:translate-x-0 landscape:translate-x-0 w-72 border-r-0'}
          ${!isMobileMenuOpen && !isSidebarCollapsed ? '-translate-x-[120%]' : ''}
        `}
      >
        <div className="flex flex-col h-full justify-between bg-white/40 dark:bg-black/20">
          <div className="lg:hidden landscape:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full text-slate-500 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white backdrop-blur-none transition-colors shadow-sm">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 landscape:p-2 flex flex-col gap-4 landscape:gap-2">
            <div className={`flex gap-3 items-center px-2 py-4 landscape:py-2 border-b border-slate-200 dark:border-white/10 mb-2 shrink-0 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <img src="./logo.png" alt="Acerta+" className="size-12 object-contain drop-shadow-lg shrink-0 rounded-xl" />
              {!isSidebarCollapsed && (
                <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500 min-w-0">
                  <h1 className="text-slate-800 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-white/70 text-2xl font-black leading-none tracking-tight truncate filter drop-shadow-sm">Prof. Acerta<span className="text-primary">+</span></h1>
                  <p className="text-primary-hover text-[10px] font-mono font-bold uppercase tracking-[0.2em] mt-1 truncate ml-0.5">Gestão 3.0</p>
                </div>
              )}
            </div>

            <div className="lg:hidden landscape:hidden flex flex-col gap-2 mb-2 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 shrink-0 backdrop-blur-none shadow-sm">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}>
                <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0 border-2 border-primary/50 shadow-neon">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-sm font-bold`}>
                      {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900 dark:text-white shadow-black/5 dark:shadow-black/50 drop-shadow-sm">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase tracking-widest text-primary font-mono">Meu Perfil</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 dark:text-white/50 ml-auto bg-slate-200 dark:bg-white/10 rounded-full p-1 text-[16px]">settings</span>
              </div>
            </div>

            <div className="lg:hidden landscape:hidden px-3 mb-2 shrink-0">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block px-1 font-mono">Matéria Atual</label>
              <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-none shadow-sm">
                <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="w-full flex items-center justify-between p-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary shadow-neon"></span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">{activeSubject}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </button>
              </div>
            </div>

            <nav className="flex flex-col gap-2 landscape:gap-1 mt-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group hover:scale-[1.02] active:scale-95 ${isActive(item.path) ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white shadow-sm dark:shadow-neon border border-primary/10 dark:border-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white border border-transparent'} ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`} title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : ''}>
                  <span className={`material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-12 ${isActive(item.path) ? 'icon-filled text-primary dark:text-white scale-110' : 'group-hover:text-primary group-hover:scale-110'}`}>{item.icon}</span>
                  {(!isSidebarCollapsed || isMobileMenuOpen) && <span className={`text-sm tracking-wide transition-all animate-in fade-in duration-300 ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>{item.label}</span>}
                  {isActive(item.path) && (!isSidebarCollapsed || isMobileMenuOpen) && <span className="absolute right-3 w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-neon" />}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
            <button onClick={() => { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-amber-500 dark:hover:text-amber-400 transition-all active:scale-95 hover:scale-[1.01] group border border-transparent hover:border-slate-200 dark:hover:border-white/5 ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
              <span className="material-symbols-outlined text-[24px] font-medium transition-transform duration-500 lg:group-hover:rotate-[180deg]">dark_mode</span>
              <span className={`text-sm font-medium animate-in fade-in duration-300 ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>Alternar Tema</span>
            </button>
            <button onClick={logout} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-500/20 border border-transparent transition-all active:scale-95 hover:scale-[1.01] group ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}>
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
          className={`hidden lg:flex landscape:flex fixed z-[70] top-8 size-12 bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-xl shadow-${theme.primaryColor}/20 text-${theme.primaryColor} transition-transform duration-150 ease-out will-change-transform hover:scale-105 active:scale-95 group ring-0 hover:ring-4 ring-${theme.primaryColor}/10 left-6 ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-[17rem]'}`}
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
          className={`flex items-center justify-between mx-4 mt-4 mb-2 rounded-2xl glass-card-soft backdrop-blur-none px-4 md:px-6 py-2 md:py-3 z-[40] shrink-0 gap-4 sticky top-4 shadow-lg shadow-black/5`}
        >
          {/* Centered Container for Landscape */}
          <div className="contents landscape:flex landscape:w-full landscape:max-w-5xl landscape:items-center landscape:justify-between landscape:mx-auto">
            <div className="flex items-center gap-4 flex-1">
              <button className="lg:hidden landscape:hidden text-text-main dark:text-white p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="lg:hidden landscape:hidden flex items-center gap-2">
                <img src="/logo.svg" alt="Acerta+" className="size-8 object-contain drop-shadow-md" />
                <span className="font-bold text-slate-800 dark:text-white text-xs landscape:hidden">Prof. Acerta+</span>
              </div>

              <div className={`hidden md:block landscape:block transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ml-4`}>
                <button onClick={() => setIsClassSelectorOpen(true)} className="flex items-center gap-3 pl-2 pr-5 py-2 rounded-xl bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group border border-white/20 dark:border-white/5 hover:border-primary/30 shadow-sm hover:shadow-neon active:scale-95 backdrop-blur-sm" title="Gerenciar Turmas">
                  <div className={`size-11 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-all duration-500`}>
                    <span className="material-symbols-outlined text-xl font-black">{theme.icon}</span>
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none font-mono">Série</span>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-primary transition-colors">{activeSeries?.name || 'Selecione...'}</span>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[12px] group-hover:text-primary transition-all">expand_more</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-white/10 to-transparent mx-2 hidden md:block landscape:block"></div>

              <div className="flex-1 min-w-0 mx-2 md:mx-0 overflow-hidden hidden md:block landscape:block">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mask-linear-fade py-1 pr-4">
                  {activeSeries?.sections.map(sec => (
                    <div key={sec} className="relative group/tab shrink-0">
                      <button onClick={() => handleSwitchSection(sec)} className={`relative min-w-[3.5rem] h-11 px-6 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center border active:scale-90 ${selectedSection === sec ? `bg-gradient-to-br from-primary to-secondary text-white border-transparent shadow-lg shadow-semimary/30 ring-1 ring-white/20` : 'bg-white/50 dark:bg-white/5 border-white/10 text-slate-500 dark:text-slate-400 hover:bg-white hover:text-primary hover:border-primary/30'}`}>
                        {sec}
                        {selectedSection === sec && <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-white animate-pulse shadow-neon`}></span>}
                      </button>
                      <button onClick={(e) => handleRemoveSectionOneClick(e, sec)} className="absolute -top-1.5 -right-1.5 size-5 bg-white dark:bg-slate-800 text-red-500 rounded-full shadow-md border dark:border-white/10 flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-all transform scale-0 group-hover/tab:scale-100 cursor-pointer z-20 hover:scale-110" title="Remover Turma">
                        <span className="material-symbols-outlined text-[10px] font-black">close</span>
                      </button>
                    </div>
                  ))}
                  {activeSeries && (
                    <button onClick={handleAddSectionOneClick} className={`h-11 pl-4 pr-5 rounded-xl flex items-center gap-2 border border-dashed border-slate-300 dark:border-white/20 text-slate-400 hover:border-primary hover:text-white hover:bg-primary transition-all duration-300 hover:scale-105 active:scale-95 group/nova shadow-sm hover:shadow-neon`} title="Adicionar Turma">
                      <span className="material-symbols-outlined text-base font-black">add</span>
                      <span className="text-[11px] font-black uppercase tracking-widest font-mono">Nova</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Selector - Always visible if user is logged in */}
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              {currentUser && (
                <div className="relative hidden md:block landscape:block">
                  <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white/10 hover:text-primary transition-colors">
                    <span className={`size-2 rounded-full bg-primary shadow-neon`}></span>
                    {activeSubject}
                    <span className="material-symbols-outlined text-xs">expand_more</span>
                  </button>
                  {isSubjectDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-[61] animate-in fade-in zoom-in-95 duration-200 glass-card-premium">
                        <div className="p-2 space-y-1">
                          {Array.from(new Set([currentUser.subject, ...(currentUser.subjects || [])])).map(subj => (
                            <button key={subj} onClick={() => { updateActiveSubject(subj); setIsSubjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubject === subj ? `bg-primary/10 text-primary` : 'text-slate-600 dark:text-slate-400 hover:bg-white/5'}`}>
                              {subj}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="hidden md:block landscape:block">
                <Link to="/instructions" title="Precisa de ajuda?" className="flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                  <span className="material-symbols-outlined group-hover:animate-bounce">help</span>
                </Link>
              </div>
              <div className="hidden md:block landscape:block">
                <NotificationCenter />
              </div>
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 bg-white/50 dark:bg-white/5 pl-1.5 pr-4 py-1.5 rounded-xl border border-white/20 dark:border-white/5 shadow-sm hover:shadow-neon hover:border-primary/30 transition-all group active:scale-95 backdrop-blur-sm">
                <div className="relative">
                  <div className="size-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden border border-white/20 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {currentUser?.photoUrl ? (
                      <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                    ) : (
                      <div className={`size-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm tracking-tighter`}>
                        {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg shadow-emerald-500/50"></div>
                </div>
                <div className="hidden md:flex landscape:flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{activeSubject || theme.subject}</span>
                </div>
              </button>
            </div>
          </div> {/* End of Centered Container */}
        </motion.header>

        <div className="xl:hidden landscape:hidden px-3 pt-2.5 -mb-0.5 z-30">
          <button onClick={() => setIsClassSelectorOpen(true)} className="w-full bg-white/90 dark:bg-slate-900/95 backdrop-blur-none p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg dark:shadow-none flex items-center justify-between group active:scale-[0.98] transition-all landscape:p-1.5 landscape:rounded-xl">
            <div className="flex items-center gap-2.5">

              {/* Dynamic Theme Icon instead of static logo */}
              <div className={`size-8 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0`}>
                <span className="material-symbols-outlined text-lg font-black">{theme.icon}</span>
              </div>

              <div className="flex flex-col items-start gap-0">
                <span className="text-[7px] uppercase font-black tracking-widest text-slate-400 leading-none mb-0.5 landscape:hidden">Seletor de Turma</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] xs:max-w-none text-left flex items-center gap-1.5 landscape:text-[10px]">
                  {activeSeries?.name || 'Selecione...'}
                  {selectedSection && <span className={`px-1 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black shadow-sm`}>{selectedSection}</span>}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </button>
        </div>

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