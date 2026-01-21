import React, { useState } from 'react';
import { useClass } from '../contexts/ClassContext';
import { useTheme } from '../hooks/useTheme';
import { Student } from '../types';

interface TransferStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    onSuccess?: () => void;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
    const { classes, transferStudent } = useClass();
    const theme = useTheme();
    const [targetSeriesId, setTargetSeriesId] = useState<string>('');
    const [targetSection, setTargetSection] = useState<string>('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const selectedClass = classes.find(c => c.id === targetSeriesId);

    const handleTransfer = async () => {
        if (!targetSeriesId || !targetSection) return;

        setLoading(true);
        try {
            const success = await transferStudent(student.id, targetSeriesId, targetSection);
            if (success) {
                onSuccess?.();
                onClose();
            }
        } catch (error) {
            alert('Erro ao transferir aluno. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className={`p-8 bg-gradient-to-br from-${theme.primaryColor} to-${theme.secondaryColor} text-white relative`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 size-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>

                    <div className="flex items-center gap-4 mb-2">
                        <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">move_up</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Transferir Aluno</h2>
                    </div>
                    <p className="text-white/80 font-medium text-sm">
                        Movendo <span className="text-white font-black">{student.name}</span> para uma nova turma.
                    </p>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Selecione a Nova Série</label>
                            <select
                                value={targetSeriesId}
                                title="Selecione a nova série para o aluno"
                                onChange={(e) => {
                                    setTargetSeriesId(e.target.value);
                                    setTargetSection('');
                                }}
                                className={`w-full h-14 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-black text-slate-700 dark:text-slate-200 focus:border-${theme.primaryColor} focus:ring-4 focus:ring-${theme.primaryColor}/10 transition-all cursor-pointer`}
                            >
                                <option value="">Escolha a Série...</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {selectedClass && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block tracking-widest">Selecione a Turma</label>
                                <div className="flex flex-wrap gap-3">
                                    {selectedClass.sections.map(section => (
                                        <button
                                            key={section}
                                            onClick={() => setTargetSection(section)}
                                            style={targetSection === section ? { backgroundColor: theme.primaryColorHex, boxShadow: `0 10px 15px -3px ${theme.primaryColorHex}4d` } : {}}
                                            className={`size-12 rounded-xl flex items-center justify-center font-black transition-all ${targetSection === section
                                                ? `text-white shadow-lg`
                                                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                                                }`}
                                        >
                                            {section}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Information Box */}
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex gap-3 items-start">
                        <span className="material-symbols-outlined text-amber-500 text-xl">info</span>
                        <div>
                            <p className="text-amber-800 dark:text-amber-400 text-xs font-bold leading-relaxed">
                                Nenhum dado será perdido!
                            </p>
                            <p className="text-amber-700/70 dark:text-amber-400/70 text-[10px] font-medium leading-relaxed mt-1">
                                Notas, presenças e ocorrências continuarão vinculadas ao histórico do aluno nesta nova turma.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black hover:bg-slate-200 dark:hover:bg-slate-800 transition-all uppercase tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={loading || !targetSeriesId || !targetSection}
                        className={`flex-[2] h-14 rounded-2xl bg-${theme.primaryColor} text-white font-black hover:opacity-90 transition-all shadow-xl shadow-${theme.primaryColor}/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 uppercase tracking-widest text-xs`}
                    >
                        {loading ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                Confirmar Mudança
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
