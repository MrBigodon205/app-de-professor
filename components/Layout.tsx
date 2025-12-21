import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useClass } from '../contexts/ClassContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { ProfileModal } from './ProfileModal';
import { NotificationCenter } from './NotificationCenter';

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', path: '/' },
  { icon: 'menu_book', label: 'Planejamentos', path: '/planning' },
  { icon: 'assignment', label: 'Atividades', path: '/activities' },
  { icon: 'group', label: 'Alunos', path: '/students' },
  { icon: 'assignment_ind', label: 'Relatório Individual', path: '/reports' },
  { icon: 'school', label: 'Notas', path: '/grades' },
  { icon: 'check_circle', label: 'Presenças', path: '/attendance' },
  { icon: 'edit_note', label: 'Observações', path: '/observations' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const { logout, currentUser } = useAuth();
  const theme = useTheme();

  // Consume Context
  const {
    classes,
    selectedSeriesId,
    selectedSection,
    activeSeries,
    selectSeries,
    selectSection,
    addClass,
    removeClass,
    addSection,
    removeSection
  } = useClass();

  // Local UI state
  const [isSeriesDropdownOpen, setIsSeriesDropdownOpen] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');

  // --- Actions ---

  // 1. Add Series
  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) return;
    await addClass(newSeriesName);
    setNewSeriesName('');
    setIsSeriesDropdownOpen(false);
  };

  // 2. Remove Series
  const handleDeleteSeries = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selection
    if (!confirm('Excluir esta série e todas as suas turmas?')) return;
    await removeClass(id);
  };

  // 3. Select Series
  const handleSelectSeries = (id: string) => {
    if (id === selectedSeriesId) {
      setIsSeriesDropdownOpen(false);
      return;
    }
    selectSeries(id);
    setIsSeriesDropdownOpen(false);
  };

  // 4. Switch Section (Click to switch)
  const handleSwitchSection = (sec: string) => {
    selectSection(sec);
  };

  // 5. Add Section (One Click)
  const handleAddSectionOneClick = async () => {
    if (!activeSeries) return;

    // Determine next letter
    let nextChar = 'A';
    if (activeSeries.sections.length > 0) {
      const lastSec = activeSeries.sections[activeSeries.sections.length - 1];
      if (lastSec.length === 1 && /[A-Z]/.test(lastSec)) {
        let candidate = String.fromCharCode(lastSec.charCodeAt(0) + 1);
        nextChar = candidate;
      } else {
        nextChar = 'A';
      }
    }
    await addSection(activeSeries.id, nextChar);
  };

  // 6. Remove Section (One Click - Small X)
  const handleRemoveSectionOneClick = async (e: React.MouseEvent, secToRemove: string) => {
    e.stopPropagation();
    if (!activeSeries) return;
    if (!confirm(`Excluir turma ${secToRemove}?`)) return;
    await removeSection(activeSeries.id, secToRemove);
  };


  // If login page, don't show layout
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    // Special case for dynamic routes like students/:id
    if (path === '/students' && location.pathname.startsWith('/students')) return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">

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

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full justify-between">
          <div className="p-4 flex flex-col gap-4">
            {/* User Profile / Brand - NEW LOGO */}
            <div className="flex gap-3 items-center px-2 py-4 border-b border-dashed border-slate-200 dark:border-slate-800 mb-2">
              <div className={`size-10 rounded-xl bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white flex items-center justify-center shadow-lg shadow-${theme.primaryColor}/20`}>
                <span className="material-symbols-outlined text-2xl">school</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-text-main dark:text-white text-lg font-black leading-none tracking-tight">Prof. Acerta<span className={`text-${theme.primaryColor}`}>+</span></h1>
                <p className="text-text-secondary dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Gestão Inteligente</p>
              </div>
            </div>

            {/* Mobile Profile & Notification Actions (Visible only on mobile sidebar) */}
            <div className="md:hidden flex flex-col gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div
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
              </div>

              {/* Mobile Notification Link */}
              <div
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
              </div>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[calc(100vh-320px)] custom-scrollbar pr-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
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
              ))}
            </nav>
          </div>

          <div className="p-4 border-t border-border-light dark:border-border-dark">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">logout</span>
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative bg-background-light dark:bg-background-dark">
        {/* Overlay for mobile sidebar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-all"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Header - Modernized with Glassmorphism */}
        <header className="flex items-center justify-between border-b border-white/50 dark:border-slate-800 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md px-6 py-4 z-[40] shrink-0 gap-4 sticky top-0 transition-all">

          <div className="flex items-center gap-4 flex-1">
            <button
              className="md:hidden text-text-main dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* 1. Series Clicker (Left) */}
            <div className="relative z-50">
              <button
                onClick={() => setIsSeriesDropdownOpen(!isSeriesDropdownOpen)}
                className="flex items-center gap-3 pl-1 pr-4 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title="Alterar Série"
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
                    <span className="material-symbols-outlined text-slate-400 text-sm group-hover:text-primary transition-colors duration-300">expand_more</span>
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isSeriesDropdownOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2 origin-top-left">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">
                    Minhas Turmas
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                    {classes.map(cls => (
                      <div
                        key={cls.id}
                        onClick={() => handleSelectSeries(cls.id)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all group/item ${selectedSeriesId === cls.id ? 'bg-primary/5 text-primary' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`size-2 rounded-full ring-2 ring-offset-2 dark:ring-offset-slate-900 ${selectedSeriesId === cls.id ? 'bg-primary ring-primary/30' : 'bg-slate-300 dark:bg-slate-600 ring-transparent'}`}></div>
                          <span className="font-bold text-sm">{cls.name}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSeries(e, cls.id)}
                          className="size-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                          title="Excluir Série"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Nova Série..."
                        value={newSeriesName}
                        onChange={e => setNewSeriesName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSeries()}
                      />
                      <button onClick={handleAddSeries} className="bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20">
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isSeriesDropdownOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsSeriesDropdownOpen(false)}></div>}
            </div>

            <div className="h-10 w-px bg-gradient-to-b from-transparent via-slate-200 dark:via-slate-700 to-transparent mx-2 hidden md:block"></div>

            {/* 2. Section Selector (Active Tabs) */}
            <div className="flex-1 min-w-0 mx-2 md:mx-0 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade py-1 pr-4">
                {/* Mobile Label if needed or just buttons */}
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

                {/* Add Section Button */}
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

          <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-100 dark:border-slate-800">
            <NotificationCenter />

            {/* User Profile Trigger - Clickable */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 bg-white dark:bg-slate-800/50 pl-1.5 pr-4 py-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary transition-all group active:scale-95"
            >
              <div className="relative">
                <div
                  className={`size-10 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-md bg-slate-200 overflow-hidden shrink-0 group-hover:scale-110 transition-transform`}
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
                {/* Status Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full shadow-sm"></div>
              </div>

              <div className="flex flex-col items-start leading-tight">
                <span className="text-[13px] font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{currentUser?.name?.split(' ')[0]}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{theme.subject}</span>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};