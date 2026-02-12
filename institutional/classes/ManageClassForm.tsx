import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

export const ManageClassForm: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const { currentSchool, isCoordinator } = useSchool();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        grade: '',
        shift: 'Matutino'
    });

    const isEditing = !!classId;

    useEffect(() => {
        if (isEditing && classId) {
            fetchClassData();
        }
    }, [classId]);

    const fetchClassData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('institutional_classes')
                .select('*')
                .eq('id', classId)
                .single();

            if (error) throw error;
            setFormData({
                name: data.name,
                grade: data.grade,
                shift: data.shift || 'Matutino'
            });
        } catch (err) {
            console.error("Fetch error:", err);
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSchool) return;

        setLoading(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('institutional_classes')
                    .update({ ...formData })
                    .eq('id', classId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('institutional_classes')
                    .insert({
                        ...formData,
                        institution_id: currentSchool.id
                    });
                if (error) throw error;
            }
            navigate(`/institution/${currentSchool.id}/classes`);
        } catch (err: any) {
            console.error("Save error:", err);
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isCoordinator) return <div className="p-10 text-center">Apenas coordenação.</div>;

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={18} /> Voltar
            </button>

            <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    {isEditing ? 'Editar Turma' : 'Nova Turma'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome da Turma *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white"
                            placeholder="Ex: 9º Ano A"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Série/Ano *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.grade}
                                onChange={e => setFormData({ ...formData, grade: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white"
                                placeholder="Ex: 9º Ano"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Turno
                            </label>
                            <select
                                id="shift-select"
                                aria-label="Turno da Turma"
                                value={formData.shift}
                                onChange={e => setFormData({ ...formData, shift: e.target.value })}
                                className="w-full p-2.5 border border-gray-300 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white"
                            >
                                <option value="Matutino">Matutino</option>
                                <option value="Vespertino">Vespertino</option>
                                <option value="Noturno">Noturno</option>
                                <option value="Integral">Integral</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 font-medium"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Salvar Turma
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
