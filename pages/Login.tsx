import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { BackgroundPattern } from '../components/BackgroundPattern';
import { Subject } from '../types';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';


const SUBJECTS: Subject[] = [
  'Filosofia', 'Educação Física', 'Matemática', 'Física', 'História', 'Geografia',
  'Artes', 'Projeto de Vida', 'Literatura', 'Português', 'Redação', 'Química', 'Ciências'
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme(); // Destructure new props
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // State for forms
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      if (activeTab === 'login') {
        const result = await login(email, password);
        if (result.success) {
          navigate('/');
        } else {
          setError(result.error || 'E-mail ou senha incorretos.');
        }
      } else { // This is the 'register' block
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
        }
        if (selectedSubjects.length === 0) {
          setError('Selecione pelo menos uma disciplina.');
          return;
        }

        const mainSubject = selectedSubjects[0];
        const result = await register(name, email, password, mainSubject, selectedSubjects);
        if (result.success) {
          setSuccess('Cadastro realizado! Por favor, confirme seu e-mail.');
          // Optionally clear fields or redirect
          setEmail('');
          setPassword('');
          setName('');
          setSelectedSubjects([]);
          setConfirmPassword('');
          setActiveTab('login'); // Often redirect to login after successful registration
        } else {
          setError(result.error || 'Erro ao realizar cadastro.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 font-display bg-slate-50 dark:bg-slate-950 overflow-hidden relative selection:bg-primary/30 selection:text-white transition-colors duration-500">
      {/* Immersive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-primary/10 dark:bg-primary/20 blur-[120px] will-change-transform"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 blur-[100px] will-change-transform"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-[110px] will-change-transform"
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* THEME TOGGLE BUTTON (New) */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg text-slate-600 dark:text-slate-300 hover:scale-110 transition-all font-bold group"
      >
        <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </motion.button>

      {/* Main Glass Portal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-[45%_55%] glass-card-premium overflow-hidden min-h-[650px] shadow-2xl shadow-slate-200/50 dark:shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Left Side: Brand Identity */}
        <div className="relative bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center p-8 lg:p-12 border-r border-slate-200/50 dark:border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10" />

          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative z-10 bg-gradient-to-tr from-primary to-emerald-400 p-8 rounded-[2.5rem] mb-10 shadow-2xl shadow-primary/30 border border-white/20 dark:border-white/10"
          >
            <span className="material-symbols-outlined text-white text-[80px] leading-none drop-shadow-md">school</span>
          </motion.div>

          <div className="relative z-10 text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight">
              Prof. Acerta<span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-black">+</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-slate-300 dark:bg-slate-600"></span>
              <p className="text-[12px] tracking-[0.4em] text-slate-500 dark:text-slate-400 font-bold uppercase whitespace-nowrap">
                v3.1 Intelligence
              </p>
              <span className="h-px w-8 bg-slate-300 dark:bg-slate-600"></span>
            </div>
            <p className="text-slate-600 dark:text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed font-light">
              Transforme dados em conquistas pedagógicas com IA.
            </p>
          </div>

          {/* Micro Footer for Brand */}
          <div className="absolute bottom-10 text-center opacity-40 dark:opacity-30">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              © 2026 PROF. ACERTA+ CORE
            </p>
          </div>
        </div>

        {/* Right Side: Form Access */}
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl flex flex-col p-8 lg:p-12 transition-colors duration-300">
          {/* Tabs Navigation */}
          <div className="mb-10 inline-flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/5 self-start">
            <button
              onClick={() => setActiveTab('login')}
              className={`relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {activeTab === 'login' && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">Entrar</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {activeTab === 'register' && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">Criar Conta</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto lg:mx-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 transition-colors">
                {activeTab === 'login' ? 'Bem-vindo de volta' : 'Inicie sua jornada'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
                {activeTab === 'login' ? 'Entre com suas credenciais para acessar o painel.' : 'Crie seu perfil pedagógico em segundos.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 text-sm font-medium flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-2xl dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-sm font-medium flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {activeTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <div className="relative group">
                        <input
                          className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                          placeholder="Como deseja ser chamado?"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Disciplinas</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-2 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                        {SUBJECTS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              if (selectedSubjects.includes(s)) {
                                setSelectedSubjects(selectedSubjects.filter(sub => sub !== s));
                              } else {
                                setSelectedSubjects([...selectedSubjects, s]);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${selectedSubjects.includes(s)
                              ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 dark:text-slate-400'
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <input
                      className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                      type="email"
                      placeholder="professor@escola.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                    <div className="flex justify-end pr-1 mt-1">
                      <a
                        href="https://wa.me/557187599246/?text=Ol%C3%A1!%20Esqueci%20meu%20e-mail%20de%20acesso%20ao%20sistema%20Prof.%20Acerta%2B.%20Poderia%20me%20ajudar%3F"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
                      >
                        Esqueci meu e-mail
                      </a>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Chave de Acesso</label>
                    <div className="relative group">
                      <input
                        className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 pl-5 pr-12 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                      </button>
                    </div>
                    {activeTab === 'login' && (
                      <div className="flex justify-end pr-1 mt-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(true)}
                          className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                    )}
                  </div>

                  {activeTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Confirmar Chave</label>
                      <input
                        className="w-full bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-2xl py-4 px-5 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group overflow-hidden rounded-2xl shadow-lg shadow-primary/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-emerald-500 transition-all group-hover:scale-105" />
                  <div className="relative h-14 flex items-center justify-center gap-3 text-white font-black uppercase tracking-widest text-sm">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processando...
                      </span>
                    ) : (
                      <>
                        {activeTab === 'login' ? 'Entrar no Sistema' : 'Finalizar Cadastro'}
                        <span className="material-symbols-outlined font-normal">arrow_forward</span>
                      </>
                    )}
                  </div>
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div >

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />
    </div >
  );
};