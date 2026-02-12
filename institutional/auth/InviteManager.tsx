import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Plus, Copy, Check } from 'lucide-react';

interface InviteManagerProps {
    institutionId: string;
}

export const InviteManager: React.FC<InviteManagerProps> = ({ institutionId }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [lastCode, setLastCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, 1, O, 0
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleCreateInvite = async () => {
        if (!currentUser) return;
        setLoading(true);
        const newCode = generateCode();

        try {
            const { error } = await supabase
                .from('institution_invites')
                .insert({
                    institution_id: institutionId,
                    code: newCode,
                    created_by: currentUser.id,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // +24h
                });

            if (error) throw error;

            setLastCode(newCode);
            setCopied(false);

        } catch (err) {
            console.error("Failed to generate invite:", err);
            alert("Erro ao gerar convite");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        if (!lastCode) return;

        try {
            await navigator.clipboard.writeText(lastCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = lastCode;

            // Ensure textArea is not visible but part of DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Fallback copy failed', err);
                alert('Erro ao copiar automaticamente. Por favor, selecione e copie manualmente.');
            }

            document.body.removeChild(textArea);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Convidar Professores</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Gere um código único válido por 24 horas para adicionar um professor à equipe.
            </p>

            {!lastCode ? (
                <button
                    onClick={handleCreateInvite}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Gerar Novo Código
                </button>
            ) : (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-md">
                        <span className="text-2xl font-mono font-bold text-green-800 dark:text-green-400 tracking-widest select-all">
                            {lastCode}
                        </span>
                        <button
                            onClick={copyToClipboard}
                            className="ml-auto p-2 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-full"
                            title="Copiar"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                        ⚠️ Este código expira em 24 horas. Envie para o professor agora.
                    </p>
                    <button
                        onClick={() => setLastCode(null)}
                        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline self-start"
                    >
                        Gerar outro
                    </button>
                </div>
            )}
        </div>
    );
};
