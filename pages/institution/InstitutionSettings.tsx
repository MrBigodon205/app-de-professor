import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VARIANTS } from '../../constants/motion';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
    Institution,
    GradingConfig,
    GradeComponent,
    UnitConfig,
    CalculationType
} from '../../types';

// Default grade components
const DEFAULT_COMPONENTS: GradeComponent[] = [
    { id: '1', name: 'Qualitativo', maxValue: 2.0, weight: 1, variable: 'Q', isDefault: true, order: 1 },
    { id: '2', name: 'Teste', maxValue: 3.0, weight: 1, variable: 'T', isDefault: true, order: 2 },
    { id: '3', name: 'Prova', maxValue: 5.0, weight: 2, variable: 'P', isDefault: true, order: 3 },
];

// Component suggestions
const COMPONENT_SUGGESTIONS = [
    { name: 'Projeto', variable: 'PJ', icon: '🎯' },
    { name: 'Simulado', variable: 'SM', icon: '📋' },
    { name: 'Trabalho', variable: 'TR', icon: '📖' },
    { name: 'Seminário', variable: 'SE', icon: '🎭' },
    { name: 'Redação', variable: 'RE', icon: '✏️' },
];

const DEFAULT_GRADING_CONFIG: GradingConfig = {
    calculationType: 'simple_average',
    roundingMode: 'half_up',
    roundingDecimals: 1,
    units: [
        { id: '1', number: 1, name: '1ª Unidade', components: [...DEFAULT_COMPONENTS], totalPoints: 10 },
        { id: '2', number: 2, name: '2ª Unidade', components: [...DEFAULT_COMPONENTS], totalPoints: 10 },
        { id: '3', number: 3, name: '3ª Unidade', components: [...DEFAULT_COMPONENTS], totalPoints: 10 },
        { id: '4', number: 4, name: '4ª Unidade', components: [...DEFAULT_COMPONENTS], totalPoints: 10 },
    ],
    approval: {
        passingGrade: 6.0,
        council: { enabled: true, maxBonus: 1.0 }
    },
    finalExam: {
        enabled: true,
        triggerType: 'points_needed',
        triggerValue: 2.0,
        maxValue: 10.0,
        minScoreToPass: 5.0,
    },
    recovery: {
        enabled: true,
        clearPreviousGrades: true,
        minScore: 0,
        maxScore: 6.0,
        allowedAttempts: 1
    }
};

export const InstitutionSettings: React.FC = () => {
    const { id: institutionId } = useParams<{ id: string }>();
    const [institution, setInstitution] = useState<Institution | null>(null);
    const [config, setConfig] = useState<GradingConfig>(DEFAULT_GRADING_CONFIG);
    const [activeTab, setActiveTab] = useState<'calc' | 'units' | 'approval'>('calc');
    const [selectedUnit, setSelectedUnit] = useState(0);
    const [saving, setSaving] = useState(false);
    const [showAddComponent, setShowAddComponent] = useState(false);
    const [customComponentName, setCustomComponentName] = useState('');
    const [customFormula, setCustomFormula] = useState('');

    useEffect(() => {
        fetchInstitution();
    }, [institutionId]);

    const fetchInstitution = async () => {
        if (!institutionId) return;

        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .eq('id', institutionId)
            .single();

        if (data) {
            setInstitution(data);
            if (data.settings?.grading_config) {
                setConfig(data.settings.grading_config);
            }
            if (data.settings?.grading_config?.customFormula) {
                setCustomFormula(data.settings.grading_config.customFormula);
            }
        }
    };

    const saveConfig = async () => {
        if (!institutionId || !institution) return;
        setSaving(true);

        const updatedSettings = {
            ...institution.settings,
            grading_config: config
        };

        const { error } = await supabase
            .from('institutions')
            .update({ settings: updatedSettings })
            .eq('id', institutionId);

        if (!error) {
            setInstitution({ ...institution, settings: updatedSettings });
        }

        setSaving(false);
    };

    const updateCalculationType = (type: CalculationType) => {
        setConfig(prev => ({ ...prev, calculationType: type }));
    };

    const generateVariable = (name: string): string => {
        const existing = COMPONENT_SUGGESTIONS.find(s => s.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing.variable;
        // Generate from first 2 letters
        return name.substring(0, 2).toUpperCase();
    };

    const addComponent = (name: string, isCustom = false) => {
        const variable = generateVariable(name);
        const newComponent: GradeComponent = {
            id: Date.now().toString(),
            name,
            maxValue: 2.0,
            weight: 1,
            variable,
            isDefault: false,
            order: config.units[selectedUnit].components.length + 1
        };

        setConfig(prev => ({
            ...prev,
            units: prev.units.map((unit, idx) =>
                idx === selectedUnit
                    ? { ...unit, components: [...unit.components, newComponent] }
                    : unit
            )
        }));

        setShowAddComponent(false);
        setCustomComponentName('');
    };

    const removeComponent = (componentId: string) => {
        setConfig(prev => ({
            ...prev,
            units: prev.units.map((unit, idx) =>
                idx === selectedUnit
                    ? { ...unit, components: unit.components.filter(c => c.id !== componentId) }
                    : unit
            )
        }));
    };

    const updateComponent = (componentId: string, field: keyof GradeComponent, value: any) => {
        setConfig(prev => ({
            ...prev,
            units: prev.units.map((unit, idx) =>
                idx === selectedUnit
                    ? {
                        ...unit,
                        components: unit.components.map(c =>
                            c.id === componentId ? { ...c, [field]: value } : c
                        )
                    }
                    : unit
            )
        }));
    };

    const calculateUnitTotal = (unit: UnitConfig) => {
        return unit.components.reduce((sum, c) => sum + c.maxValue, 0);
    };

    const getFormulaVariables = () => {
        const vars: string[] = [];
        config.units.forEach((unit, idx) => {
            unit.components.forEach(comp => {
                vars.push(`${comp.variable}${idx + 1}`);
            });
            vars.push(`U${idx + 1}`);
        });
        return vars;
    };

    if (!institution) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-page p-6">
            <motion.div
                variants={VARIANTS.fadeUp}
                initial="initial"
                animate="animate"
                className="max-w-5xl mx-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
                            <span className="p-2 bg-primary/10 rounded-xl">
                                <span className="material-symbols-outlined text-primary text-2xl">settings</span>
                            </span>
                            Configurações de Notas
                        </h1>
                        <p className="text-text-secondary mt-2">
                            {institution.name} — Configure o sistema de avaliação da sua instituição
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={saveConfig}
                        disabled={saving}
                        className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Salvar Configurações
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 p-1 bg-surface-card rounded-2xl border border-border-default w-fit">
                    {[
                        { id: 'calc', label: 'Tipo de Cálculo', icon: 'calculate' },
                        { id: 'units', label: 'Unidades e Componentes', icon: 'view_list' },
                        { id: 'approval', label: 'Aprovação', icon: 'check_circle' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-text-secondary hover:bg-surface-elevated'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'calc' && (
                        <motion.div
                            key="calc"
                            variants={VARIANTS.slideHorizontal}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Simple Average */}
                                <CalcTypeCard
                                    type="simple_average"
                                    selected={config.calculationType}
                                    onSelect={updateCalculationType}
                                    title="Média Simples"
                                    description="Média aritmética de todas as unidades"
                                    formula="(U1 + U2 + U3 + U4) / 4"
                                    icon="straighten"
                                />

                                {/* Weighted Average */}
                                <CalcTypeCard
                                    type="weighted_average"
                                    selected={config.calculationType}
                                    onSelect={updateCalculationType}
                                    title="Média Ponderada"
                                    description="Média com pesos diferentes por unidade"
                                    formula="(U1×P1 + U2×P2 + ...) / ΣP"
                                    icon="balance"
                                />

                                {/* Total Sum */}
                                <CalcTypeCard
                                    type="total_sum"
                                    selected={config.calculationType}
                                    onSelect={updateCalculationType}
                                    title="Soma Total"
                                    description="Soma de todos os pontos das unidades"
                                    formula="U1 + U2 + U3 + U4"
                                    icon="add_circle"
                                />

                                {/* Custom Formula */}
                                <CalcTypeCard
                                    type="custom_formula"
                                    selected={config.calculationType}
                                    onSelect={updateCalculationType}
                                    title="Fórmula Personalizada"
                                    description="Crie sua própria fórmula de cálculo"
                                    formula="Você define!"
                                    icon="functions"
                                />
                            </div>

                            {/* Custom Formula Editor */}
                            {config.calculationType === 'custom_formula' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-surface-card rounded-2xl border border-border-default p-6"
                                >
                                    <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">edit</span>
                                        Editor de Fórmula
                                    </h3>

                                    <div className="mb-4">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                            Variáveis Disponíveis
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {getFormulaVariables().map(v => (
                                                <span
                                                    key={v}
                                                    onClick={() => setCustomFormula(prev => prev + v)}
                                                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-mono cursor-pointer hover:bg-primary/20 transition-colors"
                                                >
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customFormula}
                                            onChange={e => {
                                                setCustomFormula(e.target.value);
                                                setConfig(prev => ({ ...prev, customFormula: e.target.value }));
                                            }}
                                            placeholder="Ex: (U1 + U2 + U3 + U4) / 4"
                                            className="w-full bg-surface-elevated border border-border-default rounded-xl py-4 px-5 font-mono text-text-primary focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                                        />
                                    </div>

                                    <p className="text-xs text-text-muted mt-3">
                                        Use operadores: <code className="bg-surface-subtle px-1 rounded">+</code> <code className="bg-surface-subtle px-1 rounded">-</code> <code className="bg-surface-subtle px-1 rounded">*</code> <code className="bg-surface-subtle px-1 rounded">/</code> e parênteses <code className="bg-surface-subtle px-1 rounded">()</code>
                                    </p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'units' && (
                        <motion.div
                            key="units"
                            variants={VARIANTS.slideHorizontal}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* Unit Selector */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {config.units.map((unit, idx) => (
                                    <button
                                        key={unit.id}
                                        onClick={() => setSelectedUnit(idx)}
                                        className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${selectedUnit === idx
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-surface-card border border-border-default text-text-secondary hover:bg-surface-elevated'
                                            }`}
                                    >
                                        {unit.name}
                                        <span className="ml-2 text-xs opacity-70">
                                            ({calculateUnitTotal(unit)} pts)
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Components Grid */}
                            <div className="bg-surface-card rounded-2xl border border-border-default p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">view_module</span>
                                        Componentes da {config.units[selectedUnit].name}
                                    </h3>
                                    <button
                                        onClick={() => setShowAddComponent(true)}
                                        className="px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-500/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg">add</span>
                                        Adicionar Componente
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {config.units[selectedUnit].components.map(component => (
                                        <div
                                            key={component.id}
                                            className="flex items-center gap-4 p-4 bg-surface-elevated rounded-xl border border-border-default"
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${component.isDefault ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600'
                                                }`}>
                                                <span className="font-bold text-sm">{component.variable}</span>
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-bold text-text-primary">{component.name}</div>
                                                <div className="text-xs text-text-muted">
                                                    Variável: <code className="bg-surface-subtle px-1 rounded">{component.variable}{selectedUnit + 1}</code>
                                                    {component.isDefault && <span className="ml-2 text-primary">• Padrão</span>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Valor</label>
                                                    <input
                                                        type="number"
                                                        value={component.maxValue}
                                                        onChange={e => updateComponent(component.id, 'maxValue', parseFloat(e.target.value))}
                                                        step="0.5"
                                                        min="0"
                                                        aria-label={`Valor máximo do componente ${component.name}`}
                                                        className="w-20 bg-surface-card border border-border-default rounded-lg py-2 px-3 text-center font-bold text-text-primary focus:outline-none focus:border-primary"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Peso</label>
                                                    <input
                                                        type="number"
                                                        value={component.weight}
                                                        onChange={e => updateComponent(component.id, 'weight', parseInt(e.target.value))}
                                                        min="1"
                                                        aria-label={`Peso do componente ${component.name}`}
                                                        className="w-16 bg-surface-card border border-border-default rounded-lg py-2 px-3 text-center font-bold text-text-primary focus:outline-none focus:border-primary"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => removeComponent(component.id)}
                                                    aria-label={`Remover componente ${component.name}`}
                                                    title={`Remover ${component.name}`}
                                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="mt-4 pt-4 border-t border-border-default flex items-center justify-between">
                                    <span className="font-bold text-text-secondary">Total da Unidade</span>
                                    <span className="text-2xl font-black text-primary">
                                        {calculateUnitTotal(config.units[selectedUnit])} pts
                                    </span>
                                </div>
                            </div>

                            {/* Add Component Modal */}
                            <AnimatePresence>
                                {showAddComponent && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                        onClick={() => setShowAddComponent(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.95, opacity: 0 }}
                                            onClick={e => e.stopPropagation()}
                                            className="bg-surface-elevated w-full max-w-md rounded-3xl p-6 shadow-2xl"
                                        >
                                            <h3 className="text-xl font-bold text-text-primary mb-4">
                                                Adicionar Componente
                                            </h3>

                                            <div className="space-y-3 mb-6">
                                                <p className="text-sm text-text-secondary">Sugestões:</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {COMPONENT_SUGGESTIONS.map(s => (
                                                        <button
                                                            key={s.name}
                                                            onClick={() => addComponent(s.name)}
                                                            className="p-3 bg-surface-card border border-border-default rounded-xl text-left hover:bg-primary/5 hover:border-primary/30 transition-all group"
                                                        >
                                                            <span className="text-xl">{s.icon}</span>
                                                            <div className="font-bold text-text-primary group-hover:text-primary text-sm mt-1">
                                                                {s.name}
                                                            </div>
                                                            <div className="text-xs text-text-muted">
                                                                Var: {s.variable}1, {s.variable}2...
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-border-default">
                                                <p className="text-sm text-text-secondary mb-3">Ou crie um personalizado:</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={customComponentName}
                                                        onChange={e => setCustomComponentName(e.target.value)}
                                                        placeholder="Nome do componente"
                                                        className="flex-1 bg-surface-card border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:border-primary"
                                                    />
                                                    <button
                                                        onClick={() => customComponentName && addComponent(customComponentName, true)}
                                                        disabled={!customComponentName}
                                                        className="px-4 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {activeTab === 'approval' && (
                        <motion.div
                            key="approval"
                            variants={VARIANTS.slideHorizontal}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            {/* Approval Settings */}
                            <div className="bg-surface-card rounded-2xl border border-border-default p-6">
                                <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-emerald-500/10 rounded-xl">
                                        <span className="material-symbols-outlined text-emerald-500">verified</span>
                                    </span>
                                    Aprovação Direta
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                            Média Mínima para Aprovação
                                        </label>
                                        <input
                                            type="number"
                                            value={config.approval.passingGrade}
                                            onChange={e => setConfig(prev => ({
                                                ...prev,
                                                approval: { ...prev.approval, passingGrade: parseFloat(e.target.value) }
                                            }))}
                                            step="0.5"
                                            min="0"
                                            max="10"
                                            aria-label="Média mínima para aprovação"
                                            className="w-full bg-surface-elevated border border-border-default rounded-xl py-4 px-5 text-2xl font-black text-primary text-center focus:outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl">
                                        <div>
                                            <div className="font-bold text-text-primary">Conselho de Classe</div>
                                            <div className="text-xs text-text-muted">Permite bonificação extra</div>
                                        </div>
                                        <button
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                approval: {
                                                    ...prev.approval,
                                                    council: { ...prev.approval.council, enabled: !prev.approval.council.enabled }
                                                }
                                            }))}
                                            aria-label={config.approval.council.enabled ? 'Desativar conselho de classe' : 'Ativar conselho de classe'}
                                            title={config.approval.council.enabled ? 'Desativar conselho de classe' : 'Ativar conselho de classe'}
                                            className={`w-14 h-8 rounded-full transition-colors ${config.approval.council.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${config.approval.council.enabled ? 'translate-x-7' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Final Exam */}
                            <div className="bg-surface-card rounded-2xl border border-border-default p-6">
                                <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-amber-500/10 rounded-xl">
                                        <span className="material-symbols-outlined text-amber-500">edit_note</span>
                                    </span>
                                    Prova Final
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl">
                                        <div>
                                            <div className="font-bold text-text-primary">Habilitar Prova Final</div>
                                            <div className="text-xs text-text-muted">Segunda chance para aprovação</div>
                                        </div>
                                        <button
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                finalExam: { ...prev.finalExam, enabled: !prev.finalExam.enabled }
                                            }))}
                                            aria-label={config.finalExam.enabled ? 'Desativar prova final' : 'Ativar prova final'}
                                            title={config.finalExam.enabled ? 'Desativar prova final' : 'Ativar prova final'}
                                            className={`w-14 h-8 rounded-full transition-colors ${config.finalExam.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${config.finalExam.enabled ? 'translate-x-7' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    {config.finalExam.enabled && (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                                    Pontos Faltantes para Ativar Final
                                                </label>
                                                <input
                                                    type="number"
                                                    value={config.finalExam.triggerValue}
                                                    onChange={e => setConfig(prev => ({
                                                        ...prev,
                                                        finalExam: { ...prev.finalExam, triggerValue: parseFloat(e.target.value) }
                                                    }))}
                                                    step="0.5"
                                                    aria-label="Pontos faltantes para ativar prova final"
                                                    className="w-full bg-surface-elevated border border-border-default rounded-xl py-3 px-4 font-bold text-text-primary focus:outline-none focus:border-primary"
                                                />
                                                <p className="text-xs text-text-muted mt-1">
                                                    Se faltarem até {config.finalExam.triggerValue} pts, o aluno faz final
                                                </p>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                                    Nota Mínima na Final para Passar
                                                </label>
                                                <input
                                                    type="number"
                                                    value={config.finalExam.minScoreToPass}
                                                    onChange={e => setConfig(prev => ({
                                                        ...prev,
                                                        finalExam: { ...prev.finalExam, minScoreToPass: parseFloat(e.target.value) }
                                                    }))}
                                                    step="0.5"
                                                    aria-label="Nota mínima na prova final para passar"
                                                    className="w-full bg-surface-elevated border border-border-default rounded-xl py-3 px-4 font-bold text-text-primary focus:outline-none focus:border-primary"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Recovery */}
                            <div className="bg-surface-card rounded-2xl border border-border-default p-6 lg:col-span-2">
                                <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                                    <span className="p-2 bg-rose-500/10 rounded-xl">
                                        <span className="material-symbols-outlined text-rose-500">refresh</span>
                                    </span>
                                    Recuperação
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl">
                                        <div>
                                            <div className="font-bold text-text-primary">Habilitar Recuperação</div>
                                            <div className="text-xs text-text-muted">Última chance</div>
                                        </div>
                                        <button
                                            onClick={() => setConfig(prev => ({
                                                ...prev,
                                                recovery: { ...prev.recovery, enabled: !prev.recovery.enabled }
                                            }))}
                                            aria-label={config.recovery.enabled ? 'Desativar recuperação' : 'Ativar recuperação'}
                                            title={config.recovery.enabled ? 'Desativar recuperação' : 'Ativar recuperação'}
                                            className={`w-14 h-8 rounded-full transition-colors ${config.recovery.enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${config.recovery.enabled ? 'translate-x-7' : 'translate-x-1'
                                                }`} />
                                        </button>
                                    </div>

                                    {config.recovery.enabled && (
                                        <>
                                            <div className="flex items-center justify-between p-4 bg-surface-elevated rounded-xl">
                                                <div>
                                                    <div className="font-bold text-text-primary">Zerar Notas</div>
                                                    <div className="text-xs text-text-muted">Limpa notas anteriores</div>
                                                </div>
                                                <button
                                                    onClick={() => setConfig(prev => ({
                                                        ...prev,
                                                        recovery: { ...prev.recovery, clearPreviousGrades: !prev.recovery.clearPreviousGrades }
                                                    }))}
                                                    aria-label={config.recovery.clearPreviousGrades ? 'Desativar zerar notas' : 'Ativar zerar notas'}
                                                    title={config.recovery.clearPreviousGrades ? 'Desativar zerar notas' : 'Ativar zerar notas'}
                                                    className={`w-14 h-8 rounded-full transition-colors ${config.recovery.clearPreviousGrades ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${config.recovery.clearPreviousGrades ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-text-muted uppercase tracking-wide mb-2 block">
                                                    Nota Máxima na Recuperação
                                                </label>
                                                <input
                                                    type="number"
                                                    value={config.recovery.maxScore}
                                                    onChange={e => setConfig(prev => ({
                                                        ...prev,
                                                        recovery: { ...prev.recovery, maxScore: parseFloat(e.target.value) }
                                                    }))}
                                                    step="0.5"
                                                    aria-label="Nota máxima na recuperação"
                                                    className="w-full bg-surface-elevated border border-border-default rounded-xl py-3 px-4 font-bold text-text-primary focus:outline-none focus:border-primary"
                                                />
                                                <p className="text-xs text-text-muted mt-1">
                                                    Aluno que passa na recuperação fica com no máximo {config.recovery.maxScore}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

// Calculation Type Card Component
interface CalcTypeCardProps {
    type: CalculationType;
    selected: CalculationType;
    onSelect: (type: CalculationType) => void;
    title: string;
    description: string;
    formula: string;
    icon: string;
}

const CalcTypeCard: React.FC<CalcTypeCardProps> = ({
    type, selected, onSelect, title, description, formula, icon
}) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(type)}
        className={`relative p-6 rounded-2xl border-2 text-left transition-all ${selected === type
            ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
            : 'bg-surface-card border-border-default hover:border-primary/30'
            }`}
    >
        {selected === type && (
            <div className="absolute top-4 right-4">
                <span className="material-symbols-outlined text-primary">check_circle</span>
            </div>
        )}

        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${selected === type ? 'bg-primary text-white' : 'bg-surface-elevated text-text-secondary'
            }`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>

        <h4 className={`font-bold text-lg mb-1 ${selected === type ? 'text-primary' : 'text-text-primary'
            }`}>
            {title}
        </h4>

        <p className="text-sm text-text-secondary mb-3">{description}</p>

        <code className={`text-xs px-3 py-1.5 rounded-lg ${selected === type ? 'bg-primary/10 text-primary' : 'bg-surface-subtle text-text-muted'
            }`}>
            {formula}
        </code>
    </motion.button>
);

export default InstitutionSettings;
