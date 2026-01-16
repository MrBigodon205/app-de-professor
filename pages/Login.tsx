import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { BackgroundPattern } from '../components/BackgroundPattern';
import { Subject } from '../types';

const SUBJECTS: Subject[] = [
  'Filosofia', 'Educação Física', 'Matemática', 'Física', 'História', 'Geografia',
  'Artes', 'Projeto de Vida', 'Literatura', 'Português', 'Redação', 'Química', 'Ciências'
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, resetPassword } = useAuth();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-password'>('login');

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
      } else if (activeTab === 'register') {
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
          setEmail('');
          setPassword('');
          setName('');
          setSelectedSubjects([]);
          setConfirmPassword('');
          setActiveTab('login');
        } else {
          setError(result.error || 'Erro ao realizar cadastro.');
        }
      } else if (activeTab === 'forgot-password') {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccess('Link de recuperação enviado! Verifique seu e-mail.');
          setEmail('');
        } else {
          setError(result.error || 'Erro ao enviar e-mail de recuperação.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-8 font-display bg-slate-950 overflow-hidden relative selection:bg-primary/30 selection:text-white">
      {/* Immersive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] will-change-transform"
        />
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[100px] will-change-transform"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-indigo-500/20 blur-[110px] will-change-transform"
        />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* Main Glass Portal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[1000px] grid lg:grid-cols-[45%_55%] glass-card-premium overflow-hidden min-h-[650px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]"
      >
        {/* Left Side: Brand Identity */}
        <div className="relative bg-slate-950/50 flex flex-col items-center justify-center p-8 lg:p-12 border-r border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />

          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative z-10 bg-gradient-to-tr from-primary to-emerald-400 p-8 rounded-[2.5rem] mb-10 shadow-2xl shadow-primary/30 border border-white/10"
          >
            <span className="material-symbols-outlined text-white text-[80px] leading-none drop-shadow-2xl">school</span>
          </motion.div>

          <div className="relative z-10 text-center space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Prof. Acerta<span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent font-black">+</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-slate-600"></span>
              <p className="text-[12px] tracking-[0.4em] text-slate-400 font-bold uppercase whitespace-nowrap">
                v3.1 Intelligence
              </p>
              <span className="h-px w-8 bg-slate-600"></span>
            </div>
            <p className="text-slate-500 text-sm max-w-[280px] mx-auto leading-relaxed font-light">
              Transforme dados em conquistas pedagógicas com IA.
            </p>
          </div>

          {/* Micro Footer for Brand */}
          <div className="absolute bottom-10 text-center opacity-30">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              © 2026 PROF. ACERTA+ CORE
            </p>
          </div>
        </div>

        {/* Right Side: Form Access */}
        <div className="bg-white/5 backdrop-blur-3xl flex flex-col p-8 lg:p-12">
          {/* Tabs Navigation */}
          <div className="mb-10 inline-flex p-1 bg-slate-900/50 rounded-2xl border border-white/5 self-start">
            <button
              onClick={() => setActiveTab('login')}
              className={`relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {(activeTab === 'login' || activeTab === 'forgot-password') && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">Entrar</span>
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`relative px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === 'register' && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 bg-primary rounded-xl shadow-lg shadow-primary/20" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
              )}
              <span className="relative z-10">Criar Conta</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-[400px] w-full mx-auto lg:mx-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {activeTab === 'login' ? 'Bem-vindo de volta' : activeTab === 'register' ? 'Inicie sua jornada' : 'Recuperar Senha'}
              </h2>
              <p className="text-slate-400 text-sm">
                {activeTab === 'login' ? 'Entre com suas credenciais para acessar o painel.' : activeTab === 'register' ? 'Crie seu perfil pedagógico em segundos.' : 'Digite seu e-mail para receber o link de redefinição.'}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-medium flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-[20px]">error</span>
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-medium flex items-center gap-3"
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                      <div className="relative group">
                        <input
                          className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
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
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Disciplinas</label>
                      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-2 bg-slate-900/40 rounded-2xl border border-white/5">
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
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                              }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                    <input
                      className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                      type="email"
                      placeholder="professor@escola.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {activeTab !== 'forgot-password' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chave de Acesso</label>
                        {activeTab === 'login' && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('forgot-password')}
                            className="text-[10px] font-bold text-primary hover:text-emerald-400 transition-colors uppercase tracking-wider"
                          >
                            Esqueci a senha
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <input
                          className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 pl-5 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility' : 'visibility_off'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Chave</label>
                      <input
                        className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 px-5 text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
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

              <div className="pt-4 space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group overflow-hidden"
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
                        {activeTab === 'login' ? 'Entrar no Sistema' : activeTab === 'register' ? 'Finalizar Cadastro' : 'Enviar Link de Recuperação'}
                        <span className="material-symbols-outlined font-normal">arrow_forward</span>
                      </>
                    )}
                  </div>
                </motion.button>

                {activeTab === 'forgot-password' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Voltar para o Login
                  </button>
                )}

                <div className="text-center pt-4">
                  <a
                    href="https://wa.me/557187599246?text=Olá,%20esqueci%20meu%20e-mail%20de%20acesso%20ao%20Prof.%20Acerta+"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-[0.2em] inline-flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[14px]">help</span>
                    Esqueci meu e-mail / Suporte
                  </a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};