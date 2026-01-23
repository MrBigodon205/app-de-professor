import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { BackgroundPattern } from '../components/BackgroundPattern';
import { Eye, EyeOff, Mail, Lock, ArrowRight, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Subject } from '../types';

export const Login: React.FC = () => {
  const { login, register, completeRegistration } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);

  // Registration & Completion Mode States
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [isCompletionMode, setIsCompletionMode] = useState(false); // To handle legacy users completing profile

  useEffect(() => {
    const storedEmail = localStorage.getItem('remembered_email');
    if (storedEmail) {
      setEmail(storedEmail);
      setRememberEmail(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === 'login') {
        const result = await login(email, password);
        if (result.success) {
          if (rememberEmail) localStorage.setItem('remembered_email', email);
          else localStorage.removeItem('remembered_email');
          navigate('/');
        } else {
          setError(result.error || 'Check your credentials.');
        }
      } else {
        // Registration Logic
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          setIsSubmitting(false);
          return;
        }
        if (selectedSubjects.length === 0) {
          setError('Selecione ao menos uma disciplina.');
          setIsSubmitting(false);
          return;
        }

        const result = await register(name, email, password, selectedSubjects[0], selectedSubjects);
        if (result.success) {
          setSuccess('Conta criada com sucesso! Redirecionando...');
          setTimeout(() => navigate('/'), 1500);
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

  // Google Login Handler
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // Padrão Web seguro
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

  const defaultTheme = {
    primaryColor: 'indigo-500',
    secondaryColor: 'violet-500',
    illustrations: ['school', 'menu_book', 'laptop', 'edit']
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">

      {/* 🖼️ LEFT SIDE: HERO (Desktop Only) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <BackgroundPattern theme={defaultTheme} />
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 text-primary shadow-xl shadow-primary/10"
          >
            <img src="/logo.png" alt="Logo Prof. Acerta+" className="w-16 h-16 object-contain" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-slate-900 dark:text-white mb-4"
          >
            Prof. Acerta+
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-slate-500 dark:text-slate-400 max-w-md"
          >
            A plataforma definitiva para gestão escolar otimizada. Notas, chamadas e planejamento em um só lugar.
          </motion.p>
        </div>
      </div>

      {/* 📝 RIGHT SIDE: FORM */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12 relative">
        <div className="lg:hidden absolute inset-0 z-0">
          <BackgroundPattern theme={defaultTheme} />
        </div>

        <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl lg:shadow-none lg:bg-transparent lg:dark:bg-transparent relative z-10">

          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
              {/* Mobile Logo Icon */}
              <img src="/logo.png" alt="Logo Prof. Acerta+" className="w-10 h-10 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              {activeTab === 'login' ? 'Entre para acessar seu diário.' : 'Comece a usar gratuitamente.'}
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'login' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === 'register' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* REGISTER FIELDS */}
            {activeTab === 'register' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nome</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" placeholder="Seu nome completo" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Disciplinas (Max 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {subjectsList.map(s => (
                      <button key={s} type="button" onClick={() => toggleSubject(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedSubjects.includes(s) ? 'bg-primary border-primary text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">E-mail</label>
              <div className="relative">
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" placeholder="nome@exemplo.com" />
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" placeholder="••••••••" />
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {activeTab === 'register' && (
              <div className="relative">
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" placeholder="Confirmar senha" />
                <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              </div>
            )}

            {activeTab === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberEmail} onChange={e => setRememberEmail(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Lembrar-me</span>
                </label>
                <button type="button" className="text-sm text-primary hover:text-primary-dark font-semibold">Esqueceu?</button>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base">
              {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <>
                  {activeTab === 'login' ? 'Entrar' : 'Criar Conta'} <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* GOOGLE LOGIN */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold tracking-wider">Ou continue com</span></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              Google
            </button>

          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2024 Prof. Acerta+. Ao entrar, você concorda com nossos <a href="#" className="hover:text-primary transition-colors">Termos</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};