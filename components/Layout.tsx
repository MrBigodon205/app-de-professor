import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useScroll, useMotionValue, useSpring } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';

import { NotificationCenter } from './NotificationCenter';
import { MobileBottomNav } from './MobileBottomNav';

import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';
import { BackgroundPattern } from './BackgroundPattern';


export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, activeSubject, updateActiveSubject } = useAuth();
  const theme = useTheme();
  const { classes, activeSeries, selectedSeriesId, selectedSection, selectSeries, selectSection, deleteSeries, addSeries, removeSection, addSection } = useClass();
  const location = useLocation();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === 'true');

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebar_collapsed', String(newState));
      return newState;
    });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
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

  const backgroundOrientation = useMemo(() => ({ x: springOrientX, y: springOrientY }), [springOrientX, springOrientY]);

  return (
    <div className="flex h-dvh w-full bg-background-light dark:bg-background-dark overflow-hidden lg:overflow-hidden selection:bg-primary/10 selection:text-primary">
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

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-slate-900 border-r border-border-light dark:border-border-dark transform transition-transform duration-200 ease-out will-change-transform flex flex-col shadow-2xl lg:shadow-none landscape:shadow-none shrink-0 group/sidebar overflow-hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${isSidebarCollapsed ? 'lg:-translate-x-full landscape:-translate-x-full' : 'lg:translate-x-0 landscape:translate-x-0'} `}>
        <div className="flex flex-col h-[100dvh] justify-between">
          <div className="lg:hidden landscape:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 landscape:p-2 flex flex-col gap-4 landscape:gap-2">
            <div className={`flex gap-3 items-center px-2 py-4 landscape:py-2 border-b border-dashed border-slate-200 dark:border-slate-800 mb-2 shrink-0 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className={`size-10 rounded-xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20 shrink-0`}>
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col animate-in fade-in duration-300 min-w-0">
                  <h1 className="text-text-main dark:text-white text-lg font-black leading-none tracking-tight truncate">Prof. Acerta<span className={`text-${theme.primaryColor}`}>+</span></h1>
                  <p className="text-text-secondary dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 truncate">Gestão Inteligente</p>
                </div>
              )}
            </div>

            <div className="lg:hidden landscape:hidden flex flex-col gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsProfileModalOpen(true); setIsMobileMenuOpen(false); }}>
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-white dark:border-slate-600">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white text-xs`}>
                      {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[9px] uppercase tracking-widest text-slate-400">Meu Perfil</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 ml-auto">settings</span>
              </div>

              <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => { setIsNotificationModalOpen(true); setIsMobileMenuOpen(false); }}>
                <span className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                  <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-300">notifications</span>
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Notificações</span>
              </div>
            </div>

            <div className="lg:hidden landscape:hidden px-3 mb-2 shrink-0">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block px-1">Matéria Atual</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="w-full flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{activeSubject}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </button>
                {isSubjectDropdownOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {Array.from(new Set([currentUser?.subject, ...(currentUser?.subjects || [])])).filter(Boolean).map(subj => (
                      <button key={subj} onClick={() => { updateActiveSubject(subj); setIsSubjectDropdownOpen(false); setIsMobileMenuOpen(false); }} className={`w-full text-left px-3 py-3 text-sm font-medium border-l-4 ${activeSubject === subj ? `border-${theme.primaryColor} bg-${theme.primaryColor}/5 text-${theme.primaryColor}` : 'border-transparent text-slate-600 dark:text-slate-400'}`}>
                        {subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <nav className="flex flex-col gap-1.5 landscape:gap-1 mt-2 pr-2">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group hover:scale-[1.02] active:scale-95 ${isActive(item.path) ? `bg-${theme.primaryColor} text-white shadow-lg shadow-${theme.primaryColor}/30 ring-1 ring-${theme.primaryColor}/20` : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 hover:text-text-main dark:hover:text-white'} ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''}`} title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : ''}>
                  <span className={`material-symbols-outlined text-2xl transition-transform duration-300 group-hover:rotate-12 ${isActive(item.path) ? 'icon-filled scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                  {(!isSidebarCollapsed || isMobileMenuOpen) && <span className={`text-sm font-medium transition-all animate-in fade-in duration-300 ${isActive(item.path) ? 'font-bold' : ''}`}>{item.label}</span>}
                  {isActive(item.path) && (!isSidebarCollapsed || isMobileMenuOpen) && <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-2">
            <button onClick={() => { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 hover:scale-[1.01] group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <span className="material-symbols-outlined text-[24px] font-medium transition-transform duration-300 group-hover:rotate-[360deg] text-amber-500">dark_mode</span>
              {!isSidebarCollapsed && <span className="text-sm font-medium animate-in fade-in duration-300">Alternar Tema</span>}
            </button>
            <button onClick={logout} className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 hover:scale-[1.01] group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <span className="material-symbols-outlined text-[24px] font-medium transition-transform group-hover:-translate-x-1">logout</span>
              {!isSidebarCollapsed && <span className="text-sm font-medium animate-in fade-in duration-300">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      <button
        onClick={toggleSidebar}
        className={`hidden lg:flex landscape:flex fixed z-[70] top-8 size-12 bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center shadow-xl shadow-${theme.primaryColor}/20 text-${theme.primaryColor} transition-transform duration-150 ease-out will-change-transform hover:scale-105 active:scale-95 group ring-0 hover:ring-4 ring-${theme.primaryColor}/10 left-6 ${isSidebarCollapsed ? 'translate-x-0' : 'translate-x-[17rem]'}`}
        title={isSidebarCollapsed ? "Expandir" : "Recolher"}
      >
        <span className={`material-symbols-outlined text-3xl font-bold transition-transform duration-150 ease-out ${isSidebarCollapsed ? '' : 'rotate-180'}`}>chevron_right</span>
      </button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-[55] lg:hidden backdrop-blur-sm transition-all" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <header className="flex items-center justify-between border-b border-white/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md px-4 md:px-6 py-2 md:py-4 z-[40] shrink-0 gap-4 sticky top-0 transition-all duration-300 landscape:py-1.5 landscape:px-[max(env(safe-area-inset-right),0.5rem)] landscape:pl-[max(env(safe-area-inset-left),0.5rem)] landscape:justify-center">
          {/* Centered Container for Landscape */}
          <div className="contents landscape:flex landscape:w-full landscape:max-w-5xl landscape:items-center landscape:justify-between landscape:mx-auto">
            <div className="flex items-center gap-4 flex-1">
              <button className="lg:hidden landscape:hidden text-text-main dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(true)}>
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div className="lg:hidden landscape:hidden flex items-center gap-2">
                <div className={`size-8 rounded-lg bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                  <span className="material-symbols-outlined text-lg">school</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-xs landscape:hidden">Prof. Acerta+</span>
              </div>

              <div className={`hidden md:block landscape:block transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'ml-24 landscape:ml-12' : 'ml-4'} landscape:ml-4`}>
                <button onClick={() => setIsClassSelectorOpen(true)} className="flex items-center gap-3 pl-1.5 pr-4 py-1.5 rounded-2xl bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 group border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 shadow-sm hover:shadow-md active:scale-95" title="Gerenciar Turmas">
                  <div className={`size-10 rounded-lg bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-md shadow-${theme.primaryColor}/10 group-hover:scale-105 transition-all duration-500`}>
                    <span className="material-symbols-outlined text-lg font-black">{theme.icon}</span>
                  </div>
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Série</span>
                    <div className="flex items-center gap-1">
                      <span className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none group-hover:text-${theme.primaryColor} transition-colors">{activeSeries?.name || 'Selecione...'}</span>
                      <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[10px] group-hover:text-${theme.primaryColor} transition-all">expand_more</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-2 hidden md:block landscape:block"></div>

              <div className="flex-1 min-w-0 mx-2 md:mx-0 overflow-hidden hidden md:block landscape:block">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mask-linear-fade py-1 pr-4">
                  {activeSeries?.sections.map(sec => (
                    <div key={sec} className="relative group/tab shrink-0">
                      <button onClick={() => handleSwitchSection(sec)} className={`relative min-w-[3.5rem] h-10 px-5 rounded-full font-black text-sm transition-all duration-500 flex items-center justify-center border-2 active:scale-90 ${selectedSection === sec ? `bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white border-transparent shadow-[0_0_15px] shadow-${theme.primaryColor}/40 ring-1 ring-${theme.primaryColor}/20` : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-700 dark:hover:text-white'}`}>
                        {sec}
                        {selectedSection === sec && <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-${theme.primaryColor} animate-pulse`}></span>}
                      </button>
                      <button onClick={(e) => handleRemoveSectionOneClick(e, sec)} className="absolute -top-1.5 -right-1.5 size-5 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-md border dark:border-white/10 flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-all transform scale-0 group-hover/tab:scale-100 cursor-pointer z-20 hover:scale-110" title="Remover Turma">
                        <span className="material-symbols-outlined text-[10px] font-black">close</span>
                      </button>
                    </div>
                  ))}
                  {activeSeries && (
                    <button onClick={handleAddSectionOneClick} className={`h-10 pl-3 pr-4 rounded-full flex items-center gap-2 border-2 border-dashed border-slate-200 dark:border-white/10 text-slate-400 hover:border-${theme.primaryColor} hover:text-white hover:bg-${theme.primaryColor} transition-all duration-300 hover:scale-105 active:scale-95 group/nova shadow-sm hover:shadow-lg hover:shadow-${theme.primaryColor}/20`} title="Adicionar Turma">
                      <span className="material-symbols-outlined text-sm font-black">add</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">Nova</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-800">
              {currentUser?.subjects && currentUser.subjects.length > 0 && (
                <div className="relative hidden md:block landscape:block">
                  <button onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                    {activeSubject}
                    <span className="material-symbols-outlined text-xs">expand_more</span>
                  </button>
                  {isSubjectDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[61] animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 space-y-1">
                          {Array.from(new Set([currentUser.subject, ...(currentUser.subjects || [])])).map(subj => (
                            <button key={subj} onClick={() => { updateActiveSubject(subj); setIsSubjectDropdownOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubject === subj ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
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
                <NotificationCenter />
              </div>
              <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center gap-3 bg-white dark:bg-slate-800/50 pl-1.5 pr-4 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary transition-all group active:scale-95">
                <div className="relative">
                  <div className="size-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden border border-white dark:border-slate-600 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {currentUser?.photoUrl ? (
                      <img src={currentUser.photoUrl} alt="Profile" className="size-full object-cover" />
                    ) : (
                      <div className={`size-full flex items-center justify-center bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold text-sm tracking-tighter`}>
                        {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
                </div>
                <div className="hidden md:flex landscape:flex flex-col items-start leading-tight">
                  <span className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{currentUser?.name?.split(' ')[0]}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSubject || theme.subject}</span>
                </div>
              </button>
            </div>
          </div> {/* End of Centered Container */}
        </header>

        <div className="xl:hidden px-3 pt-2.5 -mb-0.5 z-30 landscape:pt-1 landscape:px-2">
          <button onClick={() => setIsClassSelectorOpen(true)} className="w-full bg-white/90 dark:bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-lg dark:shadow-none flex items-center justify-between group active:scale-[0.98] transition-all landscape:p-1.5 landscape:rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className={`size-8 rounded-xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20 landscape:size-7`}>
                <span className="material-symbols-outlined text-base font-black">school</span>
              </div>
              <div className="flex flex-col items-start gap-0">
                <span className="text-[7px] uppercase font-black tracking-widest text-slate-400 leading-none mb-0.5 landscape:hidden">Contexto</span>
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

        <main className={`flex-1 overflow-y-auto lg:overflow-hidden overflow-x-hidden scroll-smooth custom-scrollbar relative px-1`}>
          {children}
        </main>

        <div>
          <MobileBottomNav onMoreClick={() => setIsMobileMenuOpen(true)} />
        </div>
      </div>

    </div>
  );
};