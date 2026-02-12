import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSchool } from '../contexts/SchoolContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    MapPin,
    Download,
    Search,
    User,
    Clock,
    CheckCircle2,
    XCircle,
    Settings,
    Calendar,
    Save,
    Camera
} from 'lucide-react';

interface GeofenceConfig {
    id?: number;
    latitude: number;
    longitude: number;
    radius_meters: number;
    enabled: boolean;
}

interface CheckIn {
    id: number;
    teacher_id: string;
    teacher_name: string;
    check_type: 'entrada' | 'saida';
    checked_at: string;
    is_within_radius: boolean;
    distance_meters: number;
    photo_url?: string;
}

interface TeacherSummary {
    id: string;
    name: string;
    totalCheckins: number;
    withinRadius: number;
    outsideRadius: number;
    lastCheckin?: string;
}

export default function InstitutionalCheckins() {
    const { currentSchool } = useSchool();

    const [checkins, setCheckins] = useState<CheckIn[]>([]);
    const [geofence, setGeofence] = useState<GeofenceConfig>({
        latitude: -12.9714,
        longitude: -38.5014,
        radius_meters: 100,
        enabled: true
    });
    const [loading, setLoading] = useState(true);
    const [showConfig, setShowConfig] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

    // Fetch data
    useEffect(() => {
        if (!currentSchool?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch geofence config
                const { data: geoData } = await supabase
                    .from('institution_geofence')
                    .select('*')
                    .eq('institution_id', currentSchool.id)
                    .single();

                if (geoData) {
                    setGeofence({
                        id: geoData.id,
                        latitude: geoData.latitude,
                        longitude: geoData.longitude,
                        radius_meters: geoData.radius_meters,
                        enabled: geoData.enabled
                    });
                }

                // Date filter
                let dateFilter = null;
                const now = new Date();
                if (dateRange === 'week') {
                    const weekAgo = new Date(now);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    dateFilter = weekAgo.toISOString();
                } else if (dateRange === 'month') {
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    dateFilter = monthAgo.toISOString();
                }

                // Fetch check-ins
                let query = supabase
                    .from('teacher_checkins')
                    .select(`
                        id, user_id, check_type, checked_at, is_within_radius, distance_meters, photo_url,
                        profiles:user_id (name)
                    `)
                    .eq('institution_id', currentSchool.id)
                    .order('checked_at', { ascending: false })
                    .limit(200);

                if (dateFilter) {
                    query = query.gte('checked_at', dateFilter);
                }

                const { data: checkinsData, error } = await query;

                if (error) throw error;

                const processed = (checkinsData || []).map((c: any) => ({
                    id: c.id,
                    teacher_id: c.user_id,
                    teacher_name: c.profiles?.name || 'Professor',
                    check_type: c.check_type,
                    checked_at: c.checked_at,
                    is_within_radius: c.is_within_radius,
                    distance_meters: c.distance_meters || 0,
                    photo_url: c.photo_url
                }));

                setCheckins(processed);
            } catch (err) {
                console.error('Error fetching checkins:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentSchool?.id, dateRange]);

    // Teacher summaries
    const teacherSummaries = useMemo((): TeacherSummary[] => {
        const map = new Map<string, TeacherSummary>();

        checkins.forEach(c => {
            if (!map.has(c.teacher_id)) {
                map.set(c.teacher_id, {
                    id: c.teacher_id,
                    name: c.teacher_name,
                    totalCheckins: 0,
                    withinRadius: 0,
                    outsideRadius: 0
                });
            }
            const summary = map.get(c.teacher_id)!;
            summary.totalCheckins++;
            if (c.is_within_radius) {
                summary.withinRadius++;
            } else {
                summary.outsideRadius++;
            }
            if (!summary.lastCheckin || c.checked_at > summary.lastCheckin) {
                summary.lastCheckin = c.checked_at;
            }
        });

        return Array.from(map.values()).sort((a, b) => b.totalCheckins - a.totalCheckins);
    }, [checkins]);

    // Filter by search
    const filteredCheckins = useMemo(() => {
        if (!searchQuery) return checkins;
        const q = searchQuery.toLowerCase();
        return checkins.filter(c => c.teacher_name.toLowerCase().includes(q));
    }, [checkins, searchQuery]);

    // Save geofence config
    const handleSaveGeofence = async () => {
        if (!currentSchool?.id) return;
        setSaving(true);

        try {
            const payload = {
                institution_id: currentSchool.id,
                latitude: geofence.latitude,
                longitude: geofence.longitude,
                radius_meters: geofence.radius_meters,
                enabled: geofence.enabled,
                updated_at: new Date().toISOString()
            };

            if (geofence.id) {
                await supabase.from('institution_geofence').update(payload).eq('id', geofence.id);
            } else {
                const { data } = await supabase.from('institution_geofence').insert(payload).select().single();
                if (data) setGeofence(prev => ({ ...prev, id: data.id }));
            }
            setShowConfig(false);
        } catch (err) {
            console.error('Error saving geofence:', err);
        } finally {
            setSaving(false);
        }
    };

    // Export PDF
    const handleExportPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Relatório de Registros de Ponto', 14, 15);
        doc.setFontSize(10);
        doc.text(`Escola: ${currentSchool?.name || 'Instituição'}`, 14, 22);
        doc.text(`Período: ${dateRange === 'week' ? 'Última Semana' : dateRange === 'month' ? 'Último Mês' : 'Todos'}`, 14, 28);
        doc.text(`Total: ${filteredCheckins.length} registros`, 14, 34);

        // Summary table
        autoTable(doc, {
            startY: 42,
            head: [['Professor', 'Total', 'Dentro Raio', 'Fora Raio', 'Último Registro']],
            body: teacherSummaries.map(t => [
                t.name,
                t.totalCheckins.toString(),
                t.withinRadius.toString(),
                t.outsideRadius.toString(),
                t.lastCheckin ? new Date(t.lastCheckin).toLocaleDateString('pt-BR') : '-'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`registros_ponto_${new Date().toISOString().split('T')[0]}.pdf`);
    };

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
                        <MapPin className="text-primary" size={28} />
                        Registro de Ponto GPS
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        Acompanhe os registros de chegada e saída dos professores
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowConfig(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-surface-subtle text-text-primary rounded-xl font-medium hover:bg-surface-elevated transition-colors"
                    >
                        <Settings size={18} />
                        Configurar
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Download size={18} />
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap gap-2">
                {(['week', 'month', 'all'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setDateRange(range)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${dateRange === range
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-surface-subtle text-text-secondary hover:bg-surface-elevated'
                            }`}
                    >
                        {range === 'week' ? 'Última Semana' : range === 'month' ? 'Último Mês' : 'Todos'}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">{checkins.length}</div>
                    <div className="text-xs text-text-muted uppercase font-bold">Total Registros</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                        {checkins.filter(c => c.is_within_radius).length}
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Dentro do Raio</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-600 mb-1">
                        {checkins.filter(c => !c.is_within_radius).length}
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Fora do Raio</div>
                </div>
                <div className="bg-surface-card border border-border-default rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-text-primary mb-1">
                        {new Set(checkins.map(c => c.teacher_id)).size}
                    </div>
                    <div className="text-xs text-text-muted uppercase font-bold">Professores</div>
                </div>
            </div>

            {/* Teacher Summary */}
            {teacherSummaries.length > 0 && (
                <div className="bg-surface-card border border-border-default rounded-2xl p-4">
                    <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                        <User size={16} />
                        Resumo por Professor
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-surface-subtle">
                                <tr>
                                    <th className="text-left p-3 font-medium text-text-muted">Professor</th>
                                    <th className="text-center p-3 font-medium text-text-muted">Total</th>
                                    <th className="text-center p-3 font-medium text-text-muted">✓ Dentro</th>
                                    <th className="text-center p-3 font-medium text-text-muted">✗ Fora</th>
                                    <th className="text-center p-3 font-medium text-text-muted">Último</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-default">
                                {teacherSummaries.slice(0, 10).map(t => (
                                    <tr key={t.id} className="hover:bg-surface-subtle/50">
                                        <td className="p-3 font-medium">{t.name}</td>
                                        <td className="p-3 text-center">{t.totalCheckins}</td>
                                        <td className="p-3 text-center text-emerald-600">{t.withinRadius}</td>
                                        <td className="p-3 text-center text-amber-600">{t.outsideRadius}</td>
                                        <td className="p-3 text-center text-text-muted">
                                            {t.lastCheckin ? new Date(t.lastCheckin).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar professor..."
                    className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 pl-12 pr-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
            </div>

            {/* Recent Checkins */}
            <div className="bg-surface-card border border-border-default rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border-default">
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                        <Clock size={16} />
                        Registros Recentes
                    </h3>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-border-default">
                    {filteredCheckins.length === 0 ? (
                        <div className="p-12 text-center text-text-muted">
                            <Clock size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum registro encontrado</p>
                        </div>
                    ) : (
                        filteredCheckins.slice(0, 50).map(checkin => (
                            <motion.div
                                key={checkin.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 flex items-center gap-4"
                            >
                                <div className={`p-2 rounded-xl ${checkin.is_within_radius ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                                    {checkin.is_within_radius ? (
                                        <CheckCircle2 size={20} className="text-emerald-600" />
                                    ) : (
                                        <XCircle size={20} className="text-amber-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-text-primary truncate">{checkin.teacher_name}</h4>
                                    <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(checkin.checked_at).toLocaleString('pt-BR')}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full font-bold ${checkin.check_type === 'entrada' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                            }`}>
                                            {checkin.check_type === 'entrada' ? 'Entrada' : 'Saída'}
                                        </span>
                                    </div>
                                </div>
                                {checkin.photo_url && (
                                    <span title="Com foto">
                                        <Camera size={18} className="text-text-muted" />
                                    </span>
                                )}
                                <span className="text-xs text-text-muted">
                                    {checkin.distance_meters}m
                                </span>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Geofence Config Modal */}
            {showConfig && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowConfig(false)}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="bg-surface-card rounded-2xl max-w-md w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-border-default">
                            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <MapPin size={20} />
                                Configurar Perímetro GPS
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={geofence.latitude}
                                    onChange={e => setGeofence({ ...geofence, latitude: parseFloat(e.target.value) })}
                                    title="Latitude"
                                    placeholder="Ex: -12.9714"
                                    className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="0.0000001"
                                    value={geofence.longitude}
                                    onChange={e => setGeofence({ ...geofence, longitude: parseFloat(e.target.value) })}
                                    title="Longitude"
                                    placeholder="Ex: -38.5014"
                                    className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                                    Raio (metros)
                                </label>
                                <input
                                    type="number"
                                    value={geofence.radius_meters}
                                    onChange={e => setGeofence({ ...geofence, radius_meters: parseInt(e.target.value) })}
                                    title="Raio em metros"
                                    placeholder="Ex: 100"
                                    className="w-full bg-surface-subtle border border-border-default rounded-xl py-3 px-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="geofence-enabled"
                                    checked={geofence.enabled}
                                    onChange={e => setGeofence({ ...geofence, enabled: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-2 border-border-default text-primary focus:ring-primary"
                                />
                                <label htmlFor="geofence-enabled" className="text-text-primary">
                                    Habilitar verificação de perímetro
                                </label>
                            </div>
                            <p className="text-xs text-text-muted">
                                Use o Google Maps para obter as coordenadas da sua escola. Clique com botão direito no mapa e copie as coordenadas.
                            </p>
                        </div>
                        <div className="p-4 border-t border-border-default flex justify-end gap-2">
                            <button
                                onClick={() => setShowConfig(false)}
                                className="px-4 py-2 text-text-secondary hover:bg-surface-subtle rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveGeofence}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Salvar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
}
