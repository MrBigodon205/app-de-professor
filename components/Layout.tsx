import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';
import { Tutorial } from './Onboarding/Tutorial';
import { NotificationCenter } from './NotificationCenter';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileClassSelector } from './MobileClassSelector';
import { ClassManager } from './ClassManager';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, activeSubject, updateActiveSubject } = useAuth();
  const theme = useTheme();
  const { classes, activeSeries, selectedSeriesId, selectedSection, selectSeries, selectSection, deleteSeries, addSeries, removeSectionFromSeries, addSectionToSeries } = useClass();
  const location = useLocation();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

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
      await removeSectionFromSeries(activeSeries!.id, section);
    }
  };

  const handleAddSectionOneClick = async () => {
    if (!activeSeries) return;
    const next = String.fromCharCode(activeSeries.sections.length > 0
      ? activeSeries.sections[activeSeries.sections.length - 1].charCodeAt(0) + 1
      : 65);
    await addSectionToSeries(activeSeries.id, next);
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">
      <Tutorial />
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

      {/* Mobile Sidebar - Drawer */}
      {/* On mobile, this acts as the "More Menu" drawer */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-[85vw] max-w-[300px] bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-72 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl md:shadow-none`}>
        <div className="flex flex-col h-[100dvh] justify-between">
          {/* Close Button for Mobile Drawer */}
          <div className="md:hidden absolute top-4 right-4 z-50">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* User Profile / Brand - NEW LOGO */}
            <div className="flex gap-3 items-center px-2 py-4 border-b border-dashed border-slate-200 dark:border-slate-800 mb-2">
              <div className={`size-10 rounded-xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                <span className="material-symbols-outlined text-2xl">school</span>
              </div >
              <div className="flex flex-col">
                <h1 className="text-text-main dark:text-white text-lg font-black leading-none tracking-tight">Prof. Acerta<span className={`text-${theme.primaryColor}`}>+</span></h1>
                <p className="text-text-secondary dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestão Inteligente</p>
              </div>
            </div >

            {/* Mobile Profile & Notification Actions (Visible only on mobile sidebar) */}
            <div className="md:hidden flex flex-col gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              {/* ... (existing Mobile Profile UI) ... */}
              < div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 border border-white dark:border-slate-600">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
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
              </div >

              {/* Mobile Notification Link */}
              < div
                className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 cursor-pointer"
                onClick={() => {
                  setIsNotificationModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className="flex items-center justify-center size-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                  <span className="material-symbols-outlined text-sm text-slate-600 dark:text-slate-300">notifications</span>
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Notificações</span>
              </div >
            </div >

            {/* Mobile Subject Switcher (New) */}
            <div className="md:hidden px-3 mb-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block px-1">Matéria Atual</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <button
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="w-full flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full bg-${theme.primaryColor}`}></span>
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{activeSubject}</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">expand_more</span>
                </button>

                {isSubjectDropdownOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {Array.from(new Set([currentUser?.subject, ...(currentUser?.subjects || [])])).filter(Boolean).map(subj => (
                      <button
                        key={subj}
                        onClick={() => {
                          updateActiveSubject(subj);
                          setIsSubjectDropdownOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-3 text-sm font-medium border-l-4 ${activeSubject === subj ? `border-${theme.primaryColor} bg-${theme.primaryColor}/5 text-${theme.primaryColor}` : 'border-transparent text-slate-600 dark:text-slate-400'}`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Nav */}
            < nav className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar pr-2" >
              {
                navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-tour={`sidebar-${item.path.replace('/', '')}`}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive(item.path)
                      ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}`
                      : 'text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 hover:text-text-main dark:hover:text-white'
                      }`}
                  >
                    <span className={`material-symbols-outlined text-2xl ${isActive(item.path) ? 'icon-filled' : ''}`}>
                      {item.icon}
                    </span>
                    <span className={`text-sm font-medium ${isActive(item.path) ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>
                  </Link>
                ))
              }
            </nav>
          </div >

          <div className="p-4 border-t border-border-light dark:border-border-dark flex flex-col gap-2">
            <button
              onClick={() => {
                document.documentElement.classList.toggle('dark');
                localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">dark_mode</span>
              <span className="text-sm font-medium">Alternar Tema</span>
            </button>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div >
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-background-light dark:bg-background-dark custom-bg-transition overflow-hidden">

        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          {/* Gradient Blob */}
          <div className={`absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-${theme.primaryColor}/5 blur-3xl`}></div>
          <div className={`absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-${theme.secondaryColor}/5 blur-3xl`}></div>

          {/* Icons Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] grid grid-cols-6 md:grid-cols-8 gap-8 p-8 transform -rotate-12 scale-150">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <span className={`material-symbols-outlined text-4xl md:text-6xl text-${theme.primaryColor}`}>
                  {theme.illustrations[i % theme.illustrations.length]}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Overlay for mobile sidebar */}
        {
          isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm transition-all"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
          )
        }

        {/* Header - HIDDEN on mobile now? Or simplified? Keeping simplified for now as per plan */}
        <header className="flex items-center justify-between border-b border-white/50 dark:border-slate-800 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 z-[40] shrink-0 gap-4 sticky top-0 transition-all">

          <div className="flex items-center gap-4 flex-1">
            {/* Sidebar Toggle - Hidden on mobile if we use Bottom Nav + Menu Button, BUT we might want a way to access it from header too? 
                 Plan says: "Simplified Mobile Header: Logo (Left) + Profile (Right)." and "Class Switcher... Below header"
                 For now, keeping toggle but perhaps it should be redundant if bottom nav has 'Menu'. 
                 Actually, let's HIDE the hamburger on mobile since BottomNav has 'Menu'. 
             */}
            {/* Sidebar Toggle */}
            <button
              data-tour="mobile-menu"
              className="md:hidden text-text-main dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Mobile Logo (Visible only on mobile) */}
            <div className="md:hidden flex items-center gap-2">
              <div className={`size-8 rounded-lg bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center`}>
                <span className="material-symbols-outlined text-lg">school</span>
              </div>
              <span className="font-bold text-slate-800 dark:text-white text-sm">Prof. Acerta+</span>
            </div>

            {/* 1. Series Clicker (Desktop) - Opens Class Manager */}
            <div className="hidden md:block">
              <button
                data-tour="class-selector"
                onClick={() => setIsClassSelectorOpen(true)}
                className="flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title="Gerenciar Turmas"
              >
                <div className={`size-11 rounded-xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20 group-hover:scale-105 group-hover:shadow-${theme.primaryColor}/30 transition-all`}>
                  <span className="material-symbols-outlined">{theme.icon}</span>
                </div>
                <div className="flex flex-col items-start leading-none gap-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Série Atual</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap">
                      {activeSeries ? activeSeries.name : 'Selecione...'}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-primary transition-colors duration-300">edit_square</span>
                  </div>
                </div>
              </button>
            </div>

            <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-2 hidden md:block"></div>

            {/* 2. Section Selector (Active Tabs) - Hidden on Mobile for now, will replace with Mobile Context Bar */}
            <div className="flex-1 min-w-0 mx-2 md:mx-0 overflow-hidden hidden md:block">
              {/* ... (Existing Desktop Tab implementation) ... */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade py-1 pr-4">
                {activeSeries?.sections.map(sec => (
                  <div key={sec} className="relative group/tab shrink-0">
                    <button
                      onClick={() => handleSwitchSection(sec)}
                      className={`relative min-w-[3rem] h-10 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center border ${selectedSection === sec
                        ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-200 dark:shadow-slate-900/50 border-transparent transform -translate-y-0.5'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                      {sec}
                    </button>
                    {/* Remove Interaction */}
                    <button
                      onClick={(e) => handleRemoveSectionOneClick(e, sec)}
                      className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/tab:opacity-100 transition-all transform scale-0 group-hover/tab:scale-100 cursor-pointer z-20 hover:bg-red-600 border-2 border-white dark:border-surface-dark"
                      title="Remover Turma"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                ))}
                {activeSeries && (
                  <button
                    onClick={handleAddSectionOneClick}
                    className="size-10 min-w-[2.5rem] rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-primary hover:text-primary text-slate-400 flex items-center justify-center transition-all hover:bg-primary/5 active:scale-95 group shrink-0"
                    title="Adicionar Próxima Turma"
                  >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          <div className="flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-800">
            {/* Subject Switcher (Desktop) */}
            {currentUser?.subjects && currentUser.subjects.length > 0 && (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
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
                          <button
                            key={subj}
                            onClick={() => {
                              updateActiveSubject(subj);
                              setIsSubjectDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${activeSubject === subj
                              ? `bg-${theme.primaryColor}/10 text-${theme.primaryColor}`
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            {subj}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notification - Visible on Mobile too maybe? No, moving to sidebar or specific page */}
            <div className="hidden md:block">
              <NotificationCenter />
            </div>

            {/* User Profile - Mobile: Just Avatar */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 bg-white dark:bg-slate-800/50 pl-1.5 pr-4 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary transition-all group active:scale-95"
            >
              <div className="relative">
                <div
                  className={`size-8 md:size-10 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-md bg-slate-200 overflow-hidden shrink-0 group-hover:scale-110 transition-transform`}
                  style={{
                    backgroundImage: currentUser?.photoUrl
                      ? `url(${currentUser.photoUrl})`
                      : undefined
                  }}
                >
                  {!currentUser?.photoUrl && (
                    <div className={`size-full flex items-center justify-center bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white font-bold text-sm tracking-tighter`}>
                      {(currentUser?.name || '??').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
              </div>

              {/* Hidden Name on Mobile */}
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{currentUser?.name?.split(' ')[0]}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeSubject || theme.subject}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Context Bar (Class Switcher & Current Section) - VISIBLE ONLY ON MOBILE */}
        <div className="md:hidden px-4 pt-2 -mb-2 z-30">
          <button
            onClick={() => setIsClassSelectorOpen(true)}
            className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-lg bg-${theme.primaryColor}/10 text-${theme.primaryColor} flex items-center justify-center`}>
                <span className="material-symbols-outlined">school</span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] uppercase font-bold text-slate-400">Turma Atual</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeSeries ? activeSeries.name : 'Selecione uma turma'} {selectedSection ? ` - ${selectedSection}` : ''}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400">expand_more</span>
          </button>
        </div>


        {/* Page Content - Adjust padding for Bottom Nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onMoreClick={() => setIsMobileMenuOpen(true)} />
      </div >
    </div >
  );
};