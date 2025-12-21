import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Subject } from '../types';

const SUBJECTS: Subject[] = [
  'Filosofia', 'Educação Física', 'Matemática', 'Física', 'História', 'Geografia',
  'Artes', 'Projeto de Vida', 'Literatura', 'Português', 'Redação', 'Química', 'Ciências'
];

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
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
    <div className="flex w-full h-screen font-display bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col bg-white dark:bg-slate-900 lg:w-1/2 overflow-y-auto relative z-10 shadow-xl h-full">
        <div className="relative bg-header-dark w-full pt-16 pb-12 flex flex-col items-center justify-center shrink-0 rounded-b-[2rem] shadow-2xl overflow-hidden z-20">
          <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 bg-primary p-4 rounded-2xl mb-5 shadow-lg shadow-green-900/30 transform transition-transform hover:scale-105 duration-300">
            <span className="material-symbols-outlined text-white text-[40px]">school</span>
          </div>
          <h1 className="relative z-10 text-3xl md:text-4xl font-bold text-white tracking-tight text-center">
            Prof. Acerta<span className="text-primary">+ 3.1</span>
          </h1>
          <p className="relative z-10 text-[11px] tracking-[0.2em] text-slate-400 mt-3 font-medium uppercase opacity-80">
            Inteligência Pedagógica
          </p>
        </div>

        <div className="flex flex-1 flex-col px-6 lg:px-20 xl:px-28 pt-10 pb-6">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-slate-900 dark:text-white text-2xl font-bold uppercase tracking-tight mb-2">
                Painel de Acesso
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Retome sua jornada pedagógica agora.
              </p>
            </div>

            <div className="mb-6">
              <nav aria-label="Tabs" className="flex gap-6 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`${activeTab === 'login' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'} whitespace-nowrap border-b-2 py-2 px-1 text-sm transition-colors`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`${activeTab === 'register' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-400 hover:text-slate-600'} whitespace-nowrap border-b-2 py-2 px-1 text-sm transition-colors`}
                >
                  Cadastrar
                </button>
              </nav>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-bold border border-rose-100 dark:border-rose-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {activeTab === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1" htmlFor="name">Nome Completo</label>
                    <input className="block w-full rounded-xl border-0 bg-input-bg dark:bg-slate-800 py-4 px-5 text-slate-700 dark:text-white shadow-sm ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all sm:text-sm sm:leading-6" id="name" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1">Disciplinas</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 max-h-48 overflow-y-auto">
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${selectedSubjects.includes(s)
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {selectedSubjects.includes(s) ? 'check_circle' : 'add_circle'}
                          </span>
                          {s}
                        </button>
                      ))}
                    </div>
                    {selectedSubjects.length > 0 && (
                      <p className="mt-2 text-[10px] text-slate-400 italic flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        A primeira selecionada ({selectedSubjects[0]}) será seu tema principal.
                      </p>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1" htmlFor="email">E-mail Institucional</label>
                <div className="relative">
                  <input className="block w-full rounded-xl border-0 bg-input-bg dark:bg-slate-800 py-4 px-5 text-slate-700 dark:text-white shadow-sm ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all sm:text-sm sm:leading-6" id="email" name="email" placeholder="seuemail@escola.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1" htmlFor="password">Senha</label>
                <div className="relative">
                  <input
                    className="block w-full rounded-xl border-0 bg-input-bg dark:bg-slate-800 py-4 pl-5 pr-12 text-slate-700 dark:text-white shadow-sm ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all sm:text-sm sm:leading-6"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer group"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 ml-1" htmlFor="confirm-password">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      className="block w-full rounded-xl border-0 bg-input-bg dark:bg-slate-800 py-4 pl-5 pr-12 text-slate-700 dark:text-white shadow-sm ring-0 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all sm:text-sm sm:leading-6"
                      id="confirm-password"
                      name="confirm-password"
                      placeholder="••••••••"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer group"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors text-[20px]">
                        {showConfirmPassword ? "visibility" : "visibility_off"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start pt-2 pl-1">
                <div className="flex h-6 items-center">
                  <input className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-700" id="terms" name="terms" type="checkbox" />
                </div>
                <div className="ml-3 text-sm leading-6">
                  <label className="font-medium text-slate-600 dark:text-slate-400" htmlFor="terms">Aceito os <a className="font-semibold text-primary hover:text-green-600" href="#">Termos de Uso</a> e <a className="font-semibold text-primary hover:text-green-600" href="#">Política</a>.</label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center items-center gap-2 rounded-xl bg-primary px-3 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-500/30 hover:bg-primary-hover hover:shadow-green-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 ease-in-out transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processando...' : (activeTab === 'login' ? 'Sincronizar' : 'Cadastrar')}
                  {!isSubmitting && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                </button>
              </div>


            </form>
          </div>
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              © 2024 Prof. Acerta+. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="relative hidden w-0 flex-1 lg:block h-full">
        <img alt="Students working" className="absolute inset-0 h-full w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrAlNuF6ZP1tJpJKto4XTfCHrpLMCd27FPQDUKlPcYfP9h2ptLPCACau3zIRXxxZ2VRS5vJSQTlqvOv4y2XCFJUxiocnuQV-BtI_VdVqkp050szRF8QgrRb4rVE1QoV6rKH4_VW4viVV6-CoJepbeflbT88MCnohDBM5SEW8xj8d4-SvMvmAGbhTZX3fDWZSIFq4p9iR81krG3mRV79WaKeyD1RbKQJ1i4o31ndHtawpTcqs_QZyEae7af91dSwl7jFRWmZNbOqsKX" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 to-primary/40 mix-blend-multiply"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-20 z-20">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg">
              <span className="material-symbols-outlined text-3xl">school</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl drop-shadow-md">
              Educação organizada, futuro garantido.
            </h2>
            <p className="mt-6 text-lg leading-8 text-emerald-50 drop-shadow-sm font-light">
              Plataforma completa para gestão escolar. Acompanhe notas, presenças e atividades em um só lugar.
            </p>
            <div className="mt-10 flex gap-4">
              <div className="flex items-center gap-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/20">
                <span className="material-symbols-outlined text-white text-sm">verified</span>
                <span className="text-sm font-medium text-white">Seguro</span>
              </div>
              <div className="flex items-center gap-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm border border-white/20">
                <span className="material-symbols-outlined text-white text-sm">speed</span>
                <span className="text-sm font-medium text-white">Rápido</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};