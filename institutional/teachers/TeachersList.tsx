import React, { useEffect, useState } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import { InviteManager } from '../auth/InviteManager';
import { Users, MoreVertical, Shield, UserX, UserCheck } from 'lucide-react';

interface TeacherMember {
    id: string; // member id
    role: string;
    status: string;
    joined_at: string;
    user_id: string;
    profile: {
        name: string;
        email: string;
        photo_url: string;
    };
}

export const TeachersList: React.FC = () => {
    const { currentSchool, isCoordinator } = useSchool();
    const [teachers, setTeachers] = useState<TeacherMember[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeachers = async () => {
        if (!currentSchool) return;

        try {
            // Join institution_teachers with profiles (via user_id)
            const { data, error } = await supabase
                .from('institution_teachers')
                .select(`
                    id, 
                    role, 
                    status, 
                    joined_at, 
                    user_id,
                    profiles:user_id (name, email, photo_url)
                `)
                .eq('institution_id', currentSchool.id)
                .order('joined_at', { ascending: false });

            if (error) throw error;

            console.log("Raw teachers data:", data); // Debugging join

            const formatted: TeacherMember[] = data.map((item: any) => ({
                id: item.id,
                role: item.role,
                status: item.status,
                joined_at: item.joined_at,
                user_id: item.user_id,
                profile: item.profiles || { name: 'Desconhecido', email: 'Sem email', photo_url: '' } // Fallback
            }));

            setTeachers(formatted);

        } catch (err) {
            console.error("Error fetching teachers:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, [currentSchool]);

    const toggleStatus = async (memberId: string, currentStatus: string) => {
        if (!isCoordinator) return;
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

        try {
            const { error } = await supabase
                .from('institution_teachers')
                .update({ status: newStatus })
                .eq('id', memberId);

            if (error) throw error;

            // Optimistic update
            setTeachers(prev => prev.map(t => t.id === memberId ? { ...t, status: newStatus } : t));

        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Erro ao alterar status.");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando corpo docente...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-indigo-600 dark:text-indigo-400" />
                        Corpo Docente
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie os professores e o acesso à plataforma.</p>
                </div>
                {/* Invite Manager Integration */}
                {isCoordinator && currentSchool && (
                    <div className="w-full md:w-auto">
                        <InviteManager institutionId={currentSchool.id} />
                    </div>
                )}
            </div>

            {/* Teaching Staff List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-white/5">
                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Professor</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cargo</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Entrou em</th>
                            {isCoordinator && <th className="p-4 text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {teachers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                                    Nenhum professor encontrado. Gere um convite acima!
                                </td>
                            </tr>
                        ) : (
                            teachers.map((teacher) => (
                                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold overflow-hidden">
                                                {teacher.profile.photo_url ? (
                                                    <img src={teacher.profile.photo_url} alt={teacher.profile.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    teacher.profile.name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{teacher.profile.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{teacher.profile.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {teacher.role === 'admin' || teacher.role === 'coordinator' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300">
                                                <Shield size={12} className="mr-1" /> Coordenação
                                            </span>
                                        ) : (
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Professor</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${teacher.status === 'active'
                                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                                            : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                            }`}>
                                            {teacher.status === 'active' ? 'Ativo' : 'Suspenso'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(teacher.joined_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    {isCoordinator && (
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => toggleStatus(teacher.id, teacher.status)}
                                                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors ${teacher.status === 'active' ? 'text-red-600 hover:text-red-700 dark:text-red-400' : 'text-green-600 hover:text-green-700 dark:text-green-400'
                                                    }`}
                                                title={teacher.status === 'active' ? "Suspender Acesso" : "Reativar Acesso"}
                                            >
                                                {teacher.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
