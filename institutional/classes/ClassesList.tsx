import React, { useEffect, useState } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InstitutionalClass {
    id: string;
    name: string;
    grade: string;
    shift: string | null;
    created_at: string;
}

export const ClassesList: React.FC = () => {
    const { currentSchool, isCoordinator } = useSchool();
    const navigate = useNavigate();
    const [classes, setClasses] = useState<InstitutionalClass[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchClasses = async () => {
        if (!currentSchool) return;

        try {
            const { data, error } = await supabase
                .from('institutional_classes')
                .select('*')
                .eq('institution_id', currentSchool.id)
                .order('name', { ascending: true });

            if (error) throw error;
            setClasses(data || []);
        } catch (err) {
            console.error("Error fetching classes:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, [currentSchool]);

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará todas as disciplinas e matrículas vinculadas.')) return;

        try {
            const { error } = await supabase.from('institutional_classes').delete().eq('id', id);
            if (error) throw error;
            setClasses(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error("Delete failed:", err);
            alert("Erro ao excluir turma.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando turmas...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="text-indigo-600 dark:text-indigo-400" />
                        Turmas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie as turmas e séries da escola.</p>
                </div>
                {isCoordinator && (
                    <button
                        onClick={() => navigate(`/institution/${currentSchool?.id}/classes/new`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Nova Turma
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-300 dark:border-white/10">
                        <p className="text-gray-500 dark:text-gray-400">Nenhuma turma cadastrada.</p>
                        {isCoordinator && (
                            <button
                                onClick={() => navigate(`/institution/${currentSchool?.id}/classes/new`)}
                                className="mt-2 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                            >
                                Criar a primeira turma
                            </button>
                        )}
                    </div>
                ) : (
                    classes.map((cls) => (
                        <div key={cls.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{cls.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{cls.grade} • {cls.shift || 'Sem turno'}</p>
                                </div>
                                {isCoordinator && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/institution/${currentSchool?.id}/classes/${cls.id}/subjects`)}
                                            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded"
                                            title="Gerenciar Disciplinas"
                                        >
                                            <BookOpen size={16} />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/institution/${currentSchool?.id}/classes/${cls.id}/edit`)}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cls.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Disciplinas: --</span>
                                <span className="text-gray-500 dark:text-gray-400">Alunos: --</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
