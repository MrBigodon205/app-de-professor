import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        // Clear potentially corrupt state if needed
        // localStorage.clear(); // Use with caution, maybe just clear specific keys if we had any
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-display">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-rose-500 text-4xl">error</span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ops! Algo deu errado</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            O aplicativo encontrou um erro inesperado. Isso pode acontecer durante atualizações de código ou devido a uma falha de conexão.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-left overflow-auto max-h-40">
                                <code className="text-xs text-rose-600 dark:text-rose-400">
                                    {this.state.error?.toString()}
                                </code>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">refresh</span>
                            Recarregar Aplicativo
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
