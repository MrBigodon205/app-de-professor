import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Calendar,
    Download,
    Search,
    Plus,
    Edit2,
    Trash2,
    X,
    Save,
    Eye,
    Clock,
    Users,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

interface SchoolEvent {
    id: string;
    title: string;
    description: string;
    event_type: string;
    start_date: string;
    end_date: string;
    start_time?: string | null;
    end_time?: string | null;
    created_at: string;
    views_count?: number;
}

const EVENT_TYPES = [
    { id: 'reuniao', label: 'Reunião', color: 'bg-blue-500' },
    { id: 'feriado', label: 'Feriado', color: 'bg-red-500' },
    { id: 'evento', label: 'Evento', color: 'bg-emerald-500' },
    { id: 'prova', label: 'Prova', color: 'bg-amber-500' },
    { id: 'projeto', label: 'Projeto', color: 'bg-purple-500' },
    { id: 'outro', label: 'Outro', color: 'bg-gray-500' },
];

export default function InstitutionalEvents() {
    const { currentSchool } = useSchool();

    const [events, setEvents] = useState<SchoolEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_type: 'evento',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: ''
    });

    // Fetch events
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Fetch events with view counts
                const { data: eventsData, error: eventsError } = await supabase
                    .from('school_events')
                    .select(`
                        id, title, description, event_type, start_date, end_date, 
                        start_time, end_time, created_at
                    `)
                    .eq('school_id', currentSchool.id)
                    .order('start_date', { ascending: false });

                if (eventsError) throw eventsError;

                // Get view counts for each event
                const eventsWithViews = await Promise.all(
                    (eventsData || []).map(async (event: any) => {
                        const { count } = await supabase
                            .from('event_views')
                            .select('*', { count: 'exact', head: true })
                            .eq('event_id', event.id);

                        return { ...event, views_count: count || 0 };
                    })
                );

                setEvents(eventsWithViews);
            } catch (err) {
                console.error('Error fetching events:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [currentSchool?.id]);

    // Filter events
    const filteredEvents = useMemo(() => {
        let result = events;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(e =>
                e.title.toLowerCase().includes(q) ||
                e.description?.toLowerCase().includes(q)
            );
        }

        if (filterType !== 'all') {
            result = result.filter(e => e.event_type === filterType);
        }

        return result;
    }, [events, searchQuery, filterType]);

    // Stats
    const stats = useMemo(() => {
        const upcoming = events.filter(e => new Date(e.start_date) >= new Date()).length;
        const past = events.filter(e => new Date(e.end_date) < new Date()).length;
        const totalViews = events.reduce((sum, e) => sum + (e.views_count || 0), 0);
        return { total: events.length, upcoming, past, totalViews };
    }, [events]);

    // Open form for new event
    const openNewEventForm = () => {
        setEditingEvent(null);
        setFormData({
            title: '',
            description: '',
            event_type: 'evento',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            start_time: '',
            end_time: ''
        });
        setShowForm(true);
    };

    // Open form for editing
    const openEditForm = (event: SchoolEvent) => {
        setEditingEvent(event);
        setFormData({
            title: event.title,
            description: event.description || '',
            event_type: event.event_type,
            start_date: event.start_date,
            end_date: event.end_date,
            start_time: event.start_time || '',
            end_time: event.end_time || ''
        });
        setShowForm(true);
    };

    // Save event
    const handleSaveEvent = async () => {
        if (!currentSchool?.id || !formData.title.trim() || !formData.start_date) {
            setError('Preencha os campos obrigatórios');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const payload = {
                school_id: currentSchool.id,
                title: formData.title.trim(),
                description: formData.description.trim(),
                event_type: formData.event_type,
                start_date: formData.start_date,
                end_date: formData.end_date || formData.start_date,
                start_time: formData.start_time || null,
                end_time: formData.end_time || null
            };

            if (editingEvent) {
                const { error } = await supabase
                    .from('school_events')
                    .update(payload)
                    .eq('id', editingEvent.id);

                if (error) throw error;

                setEvents(prev => prev.map(e =>
                    e.id === editingEvent.id
                        ? { ...e, ...payload }
                        : e
                ));
                setSuccess('Evento atualizado com sucesso!');
            } else {
                const { data, error } = await supabase
                    .from('school_events')
                    .insert(payload)
                    .select()
                    .single();

                if (error) throw error;

                setEvents(prev => [{ ...data, views_count: 0 }, ...prev]);
                setSuccess('Evento criado com sucesso!');
            }

            setTimeout(() => {
                setShowForm(false);
                setSuccess(null);
            }, 1500);
        } catch (err: any) {
            console.error('Error saving event:', err);
            setError(err.message || 'Erro ao salvar evento');
        } finally {
            setSaving(false);
        }
    };

    // Delete event
    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        try {
            const { error } = await supabase
                .from('school_events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            setEvents(prev => prev.filter(e => e.id !== eventId));
        } catch (err: any) {
            console.error('Error deleting event:', err);
            setError(err.message || 'Erro ao excluir evento');
        }
    };

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Calendário de Eventos', 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Total: ${events.length} eventos`, 14, 28);

        autoTable(doc, {
            startY: 36,
            head: [['Evento', 'Tipo', 'Data Início', 'Data Fim', 'Visualizações']],
            body: filteredEvents.map(e => [
                e.title,
                EVENT_TYPES.find(t => t.id === e.event_type)?.label || e.event_type,
                new Date(e.start_date).toLocaleDateString('pt-BR'),
                new Date(e.end_date).toLocaleDateString('pt-BR'),
                e.views_count?.toString() || '0'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`eventos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Get event type info
    const getEventType = (typeId: string) =>
        EVENT_TYPES.find(t => t.id === typeId) || { id: typeId, label: typeId, color: 'bg-gray-500' };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <Calendar className="text-primary" size={28} />
                        Eventos da Instituição
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Gerencie eventos, feriados e atividades escolares
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-subtle text-text-primary rounded-xl font-medium hover:bg-surface-elevated transition-colors"
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={openNewEventForm}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} />
                        Novo Evento
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{stats.total}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Total Eventos</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">{stats.upcoming}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Próximos</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-text-secondary mb-1">{stats.past}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Realizados</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">{stats.totalViews}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Visualizações</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar evento..."
                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    title="Filtrar por tipo"
                    className="bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                    <option value="all">Todos os tipos</option>
                    {EVENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                </select>
            </div>

            {/* Events List */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="max-h-[500px] overflow-y-auto divide-y divide-border-default">
                    {filteredEvents.length === 0 ? (
                        <div className="p-12 text-center text-text-muted">
                            <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum evento encontrado</p>
                        </div>
                    ) : (
                        filteredEvents.map(event => {
                            const typeInfo = getEventType(event.event_type);
                            const isUpcoming = new Date(event.start_date) >= new Date();
                            return (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 flex items-center gap-4 hover:bg-surface-subtle/50 transition-colors"
                                >
                                    <div className={`w-1 h-12 rounded-full ${typeInfo.color}`}></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-text-primary truncate">{event.title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                                            <span className={`px-2 py-0.5 rounded-full ${typeInfo.color}/10 ${typeInfo.color.replace('bg-', 'text-')}`}>
                                                {typeInfo.label}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(event.start_date).toLocaleDateString('pt-BR')}
                                                {event.start_date !== event.end_date && (
                                                    <> → {new Date(event.end_date).toLocaleDateString('pt-BR')}</>
                                                )}
                                            </span>
                                            {event.start_time && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {event.start_time}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <Eye size={14} />
                                        {event.views_count || 0}
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${isUpcoming
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {isUpcoming ? 'Próximo' : 'Realizado'}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => openEditForm(event)}
                                            title="Editar evento"
                                            className="p-2 hover:bg-surface-subtle rounded-lg text-text-muted hover:text-primary transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            title="Excluir evento"
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-text-muted hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Event Form Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-surface-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-border-default flex items-center justify-between">
                                <h2 className="text-xl font-bold text-text-primary">
                                    {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                                </h2>
                                <button
                                    onClick={() => setShowForm(false)}
                                    title="Fechar"
                                    className="p-2 hover:bg-surface-subtle rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Nome do evento"
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Detalhes do evento..."
                                        rows={3}
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                        Tipo *
                                    </label>
                                    <select
                                        value={formData.event_type}
                                        onChange={e => setFormData({ ...formData, event_type: e.target.value })}
                                        title="Tipo de evento"
                                        className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    >
                                        {EVENT_TYPES.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                            Data Início *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                            title="Data de início"
                                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                            Data Fim
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                            title="Data de fim"
                                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                            Hora Início
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                            title="Hora de início"
                                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                            Hora Fim
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                            title="Hora de fim"
                                            className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-600">
                                        <AlertCircle size={18} />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                )}
                                {success && (
                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-emerald-600">
                                        <CheckCircle2 size={18} />
                                        <span className="text-sm">{success}</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-border-default flex justify-end gap-2">
                                <button
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-text-secondary hover:bg-surface-subtle rounded-xl"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveEvent}
                                    disabled={saving || !formData.title.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    {editingEvent ? 'Atualizar' : 'Criar Evento'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
