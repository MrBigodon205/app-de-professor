import React, { useState, useEffect } from 'react';
import logoSrc from '../assets/logo.svg';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Subject } from '../types';
import { BackgroundPattern } from '../components/BackgroundPattern';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS } from '../constants/motion';
import { useTheme } from '../hooks/useTheme';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const Login: React.FC = () => {
  const { login, register, completeRegistration, currentUser } = useAuth();
  const navigate = useNavigate();
  const { toggleTheme, isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSchoolRegistration, setIsSchoolRegistration] = useState(false);
  const [institutionName, setInstitutionName] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // CRITICAL: Use sessionStorage to persist error across component remounts
  const [error, setErrorState] = useState<string | null>(() => {
    const stored = sessionStorage.getItem('login_error');
    if (stored) {
      sessionStorage.removeItem('login_error'); // Clear after reading
      return stored;
    }
    return null;
  });
  const setError = (msg: string | null) => {
    if (msg) sessionStorage.setItem('login_error', msg);
    else sessionStorage.removeItem('login_error');
    setErrorState(msg);
  };
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Registration & Completion Mode States
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [isCompletionMode, setIsCompletionMode] = useState(false);

  useEffect(() => {
    const storedEmail = localStorage.getItem('remembered_email');
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberEmail(true);
    }
  }, []);

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (currentUser && !isSubmitting) {
      // Check for stored redirect target (for institutional users)
      const storedRedirect = sessionStorage.getItem('login_redirect');
      if (storedRedirect) {
        sessionStorage.removeItem('login_redirect');
        navigate(storedRedirect);
      } else {
        navigate('/');
      }
    }
  }, [currentUser, isSubmitting, navigate]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double-submission
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === 'login') {
        const result = await login(email, password);
        if (result.success) {
          // Check if user data is available (unverified accounts may return success but no user)
          if (!result.user) {
            setError('Por favor, verifique seu e-mail antes de fazer login. Verifique sua caixa de entrada.');
            setIsSubmitting(false);
            return;
          }

          if (rememberEmail) localStorage.setItem('remembered_email', email);
          else localStorage.removeItem('remembered_email');

          // --- SMART REDIRECT LOGIC for LOGIN ---
          try {
            // Fetch account_type from profiles table (NOT user_metadata)
            const { data: profileData } = await supabase
              .from('profiles')
              .select('account_type')
              .eq('id', result.user.id)
              .single();

            const { data: schools } = await supabase
              .from('institution_teachers')
              .select('institution_id')
              .eq('user_id', result.user.id);

            const hasSchools = schools && schools.length > 0;
            const isInstitutionalOnly = profileData?.account_type === 'institutional';

            // The useEffect watching currentUser will handle navigation
            // We just need to finish successfully here
            if (isInstitutionalOnly && hasSchools) {
              // Store the institutional redirect target
              sessionStorage.setItem('login_redirect', `/institution/${schools[0].institution_id}/dashboard`);
            }
            // Navigation is handled by useEffect when currentUser becomes available
          } catch (err) {
            console.error("Smart Redirect Error:", err);
            // Fall through - useEffect will redirect to '/'
          }
        } else {
          setIsSubmitting(false);
          setError(result.error || 'Verifique suas credenciais.');
        }
      } else {
        // Registration Logic
        if (!name.trim()) {
          setError('O nome é obrigatório.');
          setIsSubmitting(false);
          return;
        }
        if (!email.trim()) {
          setError('O e-mail é obrigatório.');
          setIsSubmitting(false);
          return;
        }
        if (!password || password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setIsSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setIsSubmitting(false);
          return;
        }
        if (!isSchoolRegistration && selectedSubjects.length === 0) {
          setError('Selecione pelo menos uma disciplina.');
          setIsSubmitting(false);
          return;
        }

        const subjectToRegister: Subject = isSchoolRegistration ? 'Geral' : selectedSubjects[0];
        const subjectsToRegister: Subject[] = isSchoolRegistration ? ['Geral'] : selectedSubjects;

        const result = await register(name, email, password, subjectToRegister, subjectsToRegister, isSchoolRegistration ? institutionName : undefined);
        if (result.success) {
          setSuccess('Conta criada com sucesso! Redirecionando...');

          // 5. Smart Redirect
          // Fetch schools to decide where to go
          const { data: schools } = await supabase
            .from('institution_teachers')
            .select('institution_id')
            .eq('user_id', result.user.id); // Use result.user.id

          const hasSchools = schools && schools.length > 0;
          const isInstitutionalOnly = result.user.user_metadata.account_type === 'institutional'; // Use result.user.user_metadata.account_type

          // If Institutional Only OR (Has Schools AND No Personal Classes logic handled by UI dominance)
          // Actually, strict rule:
          // If Institutional accounttype -> Redirect to first school
          // If Personal accounttype -> Redirect to dashboard (default)

          if (isSchoolRegistration && result.institutionId) { // Use result.institutionId
            setTimeout(() => navigate(`/institution/${result.institutionId}/dashboard`), 1500);
          } else if (isInstitutionalOnly && hasSchools) {
            setTimeout(() => navigate(`/institution/${schools[0].institution_id}/dashboard`), 1500);
          } else {
            setTimeout(() => navigate('/'), 1500);
          }
        } else {
          setError(result.error || 'Erro ao criar conta.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (subj: Subject) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      if (selectedSubjects.length >= 3) return; // Max 3
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar Google Login.');
    }
  };

  const subjectsList: Subject[] = ['Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Português', 'Inglês', 'Filosofia', 'Sociologia', 'Artes', 'Educação Física'];

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 font-display bg-surface-page overflow-hidden relative selection:bg-primary/30 selection:text-white transition-colors duration-500">
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

      {/* THEME TOGGLE BUTTON */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-surface-card/50 backdrop-blur-md border border-border-default shadow-lg text-text-secondary hover:scale-110 transition-all font-bold group"
      >
        <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">
          {isDarkMode ? 'light_mode' : 'dark_mode'}
        </span>
      </motion.button>

      {/* Main Glass Portal */}
      <motion.div
        variants={VARIANTS.scale}
        initial="initial"
        animate="animate"
        className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-[45%_55%] glass-card-premium overflow-hidden min-h-[650px] shadow-2xl shadow-slate-200/50 dark:shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Left Side: Brand Identity */}
        <div className="relative bg-surface-section/50 flex flex-col items-center p-8 lg:p-12 border-r border-border-default/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10" />

          {/* Centered Content */}
          <div className="flex-1 flex flex-col items-center justify-center w-full z-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative mb-10 shadow-2xl shadow-primary/30 rounded-[2.5rem]"
            >
              <img src={logoSrc} alt="Acerta+" className="w-40 h-40 object-contain drop-shadow-md" />
            </motion.div>

            <div className="text-center space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-text-primary tracking-tight leading-tight">
                Prof. Acerta<span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-black">+</span>
              </h1>
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-slate-300 dark:bg-slate-600"></span>
                <p className="text-[12px] tracking-[0.4em] text-slate-500 dark:text-slate-400 font-bold uppercase whitespace-nowrap">
                  v3.1 Intelligence
                </p>

                <span className="h-px w-8 bg-slate-300 dark:bg-slate-600"></span>
              </div>
              <p className="text-text-secondary text-sm max-w-[280px] mx-auto leading-relaxed font-light">
                Transforme dados em conquistas pedagógicas com IA.
              </p>
            </div>
          </div>

          {/* Footer - Pushed to bottom naturally */}
          <div className="relative z-10 text-center opacity-40 dark:opacity-30 mt-8 shrink-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              © 2026 PROF. ACERTA+ CORE
            </p>
          </div>
        </div>

        {/* Right Side: Form Access */}
        <div className="bg-surface-card/60 backdrop-blur-3xl flex flex-col p-8 lg:p-12 transition-colors duration-300">
          {/* Tabs Navigation */}
          <div className="mb-10 inline-flex p-1 bg-surface-section rounded-2xl border border-border-default self-start">
            <button
              onClick={() => setActiveTab('login')}
              className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'login' ? 'bg-surface-elevated text-text-primary shadow-lg shadow-black/5 ring-1 ring-border-default' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {activeTab === 'register' && (
                <motion.div layoutId="tab-bg" className="absolute inset-0 bg-primary rounded-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">Cadastrar</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto lg:mx-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2 transition-colors">
                {activeTab === 'login' ? 'Bem-vindo de volta' : 'Inicie sua jornada'}
              </h2>
              <p className="text-text-secondary text-sm transition-colors">
                {activeTab === 'login' ? 'Entre com suas credenciais para acessar o painel.' : 'Crie seu perfil pedagógico em segundos.'}
              </p>
            </div>

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
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Nome Completo</label>
                      <div className="relative group">
                        <motion.input
                          whileFocus={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-full bg-surface-card border border-border-default rounded-2xl py-4 px-5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                          placeholder="Como deseja ser chamado?"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'register' && (
                    <div className="space-y-4">
                      {/* School Registration Toggle */}
                      <div className="flex items-center gap-3 p-3 bg-surface-subtle rounded-xl border border-border-default cursor-pointer hover:bg-surface-elevated transition-colors" onClick={() => setIsSchoolRegistration(!isSchoolRegistration)}>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSchoolRegistration ? 'bg-primary border-primary' : 'border-text-muted bg-white dark:bg-black/20'}`}>
                          {isSchoolRegistration && <span className="material-symbols-outlined text-[16px] text-white font-bold">check</span>}
                        </div>
                        <span className="text-sm font-bold text-text-secondary select-none">Quero cadastrar minha escola</span>
                      </div>

                      {/* School Name Input */}
                      <AnimatePresence>
                        {isSchoolRegistration && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1 mb-2 block">Nome da Instituição</label>
                            <div className="relative group">
                              <motion.input
                                whileFocus={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="w-full bg-surface-card border border-border-default rounded-2xl py-4 px-5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                                placeholder="Ex: Colégio Futuro"
                                value={institutionName}
                                onChange={e => setInstitutionName(e.target.value)}
                              />
                              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">school</span>
                            </div>

                            {/* Coordinator Badge */}
                            <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500 animate-pulse">
                                <span className="material-symbols-outlined text-lg">local_police</span>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wide mb-0.5">Acesso Administrativo</h4>
                                <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                                  Você será cadastrado como o <strong>Coordenador Responsável</strong> por esta instituição.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {activeTab === 'register' && !isSchoolRegistration && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Disciplinas</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-2 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
                        {subjectsList.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSubject(s)}
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
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-full bg-surface-card border border-border-default rounded-2xl py-4 px-5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
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
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Chave de Acesso</label>
                    <div className="relative group">
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-full bg-surface-card border border-border-default rounded-2xl py-4 pl-5 pr-12 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
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
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
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

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-500 shrink-0">check_circle</span>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{success}</p>
                </div>
              )}

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting || (activeTab === 'register' && ((!isSchoolRegistration && selectedSubjects.length === 0) || !password || !confirmPassword || !name || !email)) || (activeTab === 'login' && (!email || !password))}
                  className={`w-full relative group overflow-hidden rounded-2xl shadow-lg shadow-primary/20 ${(isSubmitting || (activeTab === 'register' && ((!isSchoolRegistration && selectedSubjects.length === 0) || !password || !confirmPassword || !name || !email)) || (activeTab === 'login' && (!email || !password)))
                    ? 'opacity-50 cursor-not-allowed grayscale'
                    : ''
                    }`}
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
                        {activeTab === 'login' ? 'Entrar no Sistema' : isSchoolRegistration ? 'Finalizar como Coordenador' : 'Finalizar Cadastro'}
                        <span className="material-symbols-outlined font-normal">arrow_forward</span>
                      </>
                    )}
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-surface-card border border-border-default rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all group mt-4"
                >
                  <div className="p-1 bg-white rounded-full">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  </div>
                  <span className="text-slate-600 dark:text-white font-bold text-sm tracking-wide group-hover:text-primary transition-colors">Google</span>
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
      />

      <AnimatePresence>
        {error && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-elevated w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border-default relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-orange-500" />

              <div className="flex flex-col items-center text-center gap-4 pt-2">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[32px] text-rose-500">priority_high</span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Atenção!</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {error}
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setError(null)}
                    className="flex-1 py-3.5 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-2xl font-bold uppercase tracking-wide text-xs hover:bg-slate-300 dark:hover:bg-white/20 transition-all"
                  >
                    Tentar Novamente
                  </button>
                  {error === 'E-mail ou senha incorretos.' && (
                    <button
                      onClick={() => { setError(null); setActiveTab('register'); }}
                      className="flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold uppercase tracking-wide text-xs hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 transition-all"
                    >
                      Criar Conta
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};