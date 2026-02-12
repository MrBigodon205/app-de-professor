import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, School, MapPin } from 'lucide-react';

export const CreateInstitutionForm: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setLoading(true);
        setError('');

        try {
            // 1. Create Institution
            const { data: school, error: schoolError } = await supabase
                .from('institutions')
                .insert({
                    name,
                    owner_id: currentUser.id
                })
                .select()
                .single();

            if (schoolError) throw schoolError;

            // 2. Add creator as Admin Member
            const { error: memberError } = await supabase
                .from('institution_teachers')
                .insert({
                    institution_id: school.id,
                    user_id: currentUser.id,
                    role: 'admin',
                    status: 'active'
                });

            if (memberError) throw memberError;

            // 3. Navigate to Institutional Dashboard
            navigate(`/institution/${school.id}/dashboard`);

        } catch (err: any) {
            console.error('Error creating institution:', err);
            setError(err.message || 'Falha ao criar instituição.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-transparent dark:border-white/10">
            <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
                <School size={28} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Nova Escola</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nome da Instituição *
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-white/10 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white"
                        placeholder="Ex: Escola Estadual São Paulo"
                    />
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 rounded-md text-sm">
                    <MapPin size={16} className="inline mr-1 mb-1" />
                    <strong>Nota:</strong> Você será cadastrado como Diretor/Coordenador desta instituição.
                </div>

                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2 font-medium"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Criar Instituição'}
                </button>
            </form>
        </div>
    );
};
