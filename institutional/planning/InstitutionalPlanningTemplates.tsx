import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import {
    Save,
    Trash2,
    FileUp,
    Layout
} from 'lucide-react';
import { PlanningTemplate, PlanningTemplateElement } from '../../types';
import { useToast } from '../../components/Toast';



export default function InstitutionalPlanningTemplates() {
    const { currentSchool } = useSchool();
    const { showToast, showConfirm } = useToast();

    // State
    const [templates, setTemplates] = useState<PlanningTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Editor State
    const [currentTemplate, setCurrentTemplate] = useState<Partial<PlanningTemplate>>({
        name: 'Novo Modelo de Planejamento',
        elements: []
    });
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    // Removed legacy state variables




    // Load function
    useEffect(() => {
        if (currentSchool?.id) loadTemplates();
    }, [currentSchool?.id]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('planning_templates')
                .select('*')
                .eq('school_id', currentSchool?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Actions
    const handleNewFileTemplate = () => {
        setCurrentTemplate({
            name: `Modelo ${new Date().getFullYear()}`,
            elements: [],
            type: 'file'
        });
        setIsEditing(true);
    };

    const handleEdit = (tpl: PlanningTemplate) => {
        if (tpl.type !== 'file') {
            showToast("Este modelo foi criado com o editor antigo e não pode ser editado. Por favor, crie um novo modelo usando um arquivo.", 'warning');
            return;
        }

        setCurrentTemplate({
            ...tpl,
            elements: [] // elements not used for file templates
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        showConfirm(
            'Tem certeza? Isso não afetará planos já criados, apenas novas criações.',
            async () => {
                try {
                    const { error } = await supabase.from('planning_templates').delete().eq('id', id);
                    if (error) throw error;
                    setTemplates(prev => prev.filter(t => t.id !== id));
                    showToast('Modelo excluído com sucesso!', 'success');
                } catch (e) {
                    showToast('Erro ao excluir modelo', 'error');
                }
            }
        );
    };

    const handleSave = async () => {
        if (!currentTemplate.name) {
            showToast('Dê um nome ao modelo', 'warning');
            return;
        }

        try {
            const payload = {
                school_id: currentSchool?.id,
                name: currentTemplate.name,
                elements: currentTemplate.elements,
                structure_url: currentTemplate.structure_url,
                type: currentTemplate.type,
                file_url: currentTemplate.file_url
            };

            let error;
            if (currentTemplate.id) {
                // Update
                const { error: err } = await supabase
                    .from('planning_templates')
                    .update(payload)
                    .eq('id', currentTemplate.id);
                error = err;
            } else {
                // Insert
                const { error: err } = await supabase
                    .from('planning_templates')
                    .insert(payload);
                error = err;
            }

            if (error) throw error;

            setIsEditing(false);
            loadTemplates();
            showToast('Modelo salvo com sucesso!', 'success');
        } catch (e: any) {
            showToast('Erro ao salvar: ' + e.message, 'error');
        }
    };

    // Editor Actions




    // --- FILE TEMPLATE EDITOR (ONLY MODE) ---
    const renderFileTemplateEditor = () => (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6 max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between bg-surface-card p-4 rounded-xl border border-border-default shrink-0">
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-surface-subtle rounded-lg flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="text-sm font-bold">Voltar</span>
                </button>
                <h3 className="text-lg font-bold text-text-primary">Novo Modelo (Arquivo)</h3>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="bg-surface-card border border-border-default rounded-2xl p-8 flex flex-col gap-6 shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nome do Modelo</label>
                    <input
                        value={currentTemplate.name}
                        onChange={e => setCurrentTemplate(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-surface-elevated border border-border-subtle rounded-xl px-4 py-3 text-lg font-bold text-text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/50"
                        placeholder="Ex: Planejamento Semanal (Word)"
                        autoFocus
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Arquivo Modelo</label>
                    <div className="border-2 border-dashed border-border-default rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-surface-elevated/50 transition-colors cursor-pointer relative group">
                        <input
                            type="file"
                            accept=".docx,.pdf,.xlsx,.xls"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            aria-label="Upload de Arquivo Modelo"
                            title="Upload de Arquivo Modelo"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !currentSchool?.id) return;

                                setIsProcessingImage(true);
                                try {
                                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`;
                                    const filePath = `${currentSchool.id}/${fileName}`;
                                    const { error } = await supabase.storage
                                        .from('planning-templates')
                                        .upload(filePath, file);

                                    if (error) throw error;

                                    const { data } = supabase.storage
                                        .from('planning-templates')
                                        .getPublicUrl(filePath);

                                    setCurrentTemplate(prev => ({
                                        ...prev,
                                        type: 'file',
                                        file_url: data.publicUrl
                                    }));
                                    alert('Arquivo carregado com sucesso!');
                                } catch (err) {
                                    console.error(err);
                                    alert('Erro ao carregar arquivo.');
                                } finally {
                                    setIsProcessingImage(false);
                                }
                            }}
                        />
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${currentTemplate.file_url ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-elevated text-text-muted group-hover:text-primary group-hover:scale-110'}`}>
                            <FileUp size={32} />
                        </div>
                        <div className="text-center">
                            {currentTemplate.file_url ? (
                                <p className="font-bold text-emerald-600">Arquivo Pronto!</p>
                            ) : (
                                <>
                                    <p className="font-bold text-text-primary">Clique ou arraste o arquivo</p>
                                    <p className="text-xs text-text-muted mt-1">DOCX, PDF, Excel</p>
                                </>
                            )}
                        </div>
                        {isProcessingImage && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    {currentTemplate.file_url && (
                        <div className="text-xs text-text-muted truncate bg-surface-subtle p-2 rounded-lg border border-border-subtle">
                            URL: {currentTemplate.file_url}
                        </div>
                    )}
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!currentTemplate.name || !currentTemplate.file_url}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        Salvar Modelo
                    </button>
                </div>
            </div>
        </div>
    );

    if (isEditing) {
        return renderFileTemplateEditor();
    }

    return (
        <div className="space-y-6">
            {/* DOCX Importer Modal */}
            {/* AnimatePresence removed */}
            {/* isImportingDocx removed */}
            {/* DocxTemplateImporter removed */}

            <div className="flex items-center justify-between">
                <div className="w-32"></div> {/* Spacer to balance header */}
                <h1 className="text-2xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
                    {/* Layout icon removed */}
                    Modelos de Planejamento
                </h1>
                <div className="w-32 flex justify-end">
                    <button
                        onClick={handleNewFileTemplate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-sm"
                    >
                        <FileUp size={18} />
                        Novo Modelo
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(tpl => (
                    <motion.div
                        key={tpl.id}
                        layoutId={tpl.id}
                        className="bg-surface-card border border-border-default rounded-2xl p-6 hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                        onClick={() => handleEdit(tpl)}
                    >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                                className="p-2 bg-surface-elevated hover:bg-red-500 hover:text-white rounded-lg shadow-sm transition-colors text-text-muted"
                                title="Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="size-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4">
                            {tpl.type === 'file' ? <FileUp size={24} /> : <Layout size={24} />}
                        </div>

                        <h3 className="font-bold text-lg text-text-primary mb-1">{tpl.name}</h3>
                        {tpl.type === 'file' ? (
                            <p className="text-sm text-emerald-500 font-medium mb-4">Arquivo para Download</p>
                        ) : (
                            <p className="text-sm text-text-muted mb-4">{tpl.elements?.length || 0} campos configurados</p>
                        )}

                        <div className="space-y-2">
                            {tpl.type !== 'file' && (tpl.elements || []).slice(0, 3).map(el => (
                                <div key={el.id} className="text-xs text-text-secondary flex items-center gap-2">
                                    <div className="size-1.5 rounded-full bg-primary/50"></div>
                                    {el.name}
                                </div>
                            ))}
                            {(tpl.elements?.length || 0) > 3 && (
                                <div className="text-xs text-text-muted italic pl-3.5">
                                    + {(tpl.elements?.length || 0) - 3} outros...
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {templates.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-muted border-2 border-dashed border-border-default rounded-2xl">
                        <Layout size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">Nenhum modelo criado ainda</p>
                        <button onClick={handleNewFileTemplate} className="text-primary font-bold hover:underline mt-2">Criar o primeiro</button>
                    </div>
                )}
            </div>
        </div>
    );
}
