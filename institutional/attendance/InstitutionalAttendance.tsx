import React, { useRef, useState, useCallback } from 'react';
import { useSchool } from '../contexts/SchoolContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { supabase } from '../../lib/supabase';
import { MapPin, Camera, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../components/Toast';

export const InstitutionalAttendance: React.FC = () => {
    const { currentSchool } = useSchool();
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const { coords, error: geoError, loading: geoLoading, calculateDistance, refresh: refreshGeo } = useGeoLocation();

    // Native File Input Ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'GPS_FAIL'>('idle');

    // Handle Native File Capture
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImgSrc(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSubmit = async (type: 'check_in' | 'check_out') => {
        if (!currentSchool || !currentUser || !coords || !imgSrc) return;
        setSubmitting(true);

        try {

            let attendanceStatus = 'pending_validation';

            // Upload Photo - Convert Base64 to Blob
            const res = await fetch(imgSrc);
            const blob = await res.blob();
            const fileName = `attendance/${currentSchool.id}/${currentUser.id}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('attendance-photos')
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            // Insert Record
            const { error: dbError } = await supabase
                .from('teacher_attendance_records')
                .insert({
                    institution_id: currentSchool.id,
                    teacher_id: (await getTeacherId(currentSchool.id, currentUser.id)),
                    [`${type}_time`]: new Date().toISOString(),
                    [`${type}_photo_path`]: fileName,
                    [`${type}_coords`]: `(${coords.lat},${coords.lng})`,
                    status: attendanceStatus
                });

            if (dbError) throw dbError;

            setStatus('success');
            setImgSrc(null);

        } catch (err: any) {
            console.error("Attendance error:", err);
            showToast("Erro ao registrar ponto: " + (err.message || "Erro desconhecido"), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getTeacherId = async (instId: string, userId: string) => {
        const { data } = await supabase.from('institution_teachers')
            .select('id').eq('institution_id', instId).eq('user_id', userId).single();
        return data?.id;
    };

    if (geoLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /> <p className="mt-2 text-sm text-text-muted">Obtendo GPS...</p></div>;

    if (status === 'success') {
        return (
            <div className="p-10 text-center text-green-600 bg-surface-card rounded-2xl border border-border-default shadow-sm m-4">
                <CheckCircle size={64} className="mx-auto mb-4 animate-in zoom-in duration-300" />
                <h2 className="text-2xl font-bold text-text-primary">Ponto Registrado!</h2>
                <p className="text-text-secondary mt-2">Seus dados foram enviados para a coordenação.</p>
                <button onClick={() => setStatus('idle')} className="mt-6 text-primary font-bold hover:underline">Novo Registro</button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <ClockIcon /> Registro de Ponto
            </h1>

            {/* GPS Status */}
            <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 border ${geoError ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400'}`}>
                <MapPin className="shrink-0 mt-1" size={20} />
                <div>
                    <p className="font-bold text-sm">{geoError ? "Erro no GPS" : "Localização Ativa"}</p>
                    <p className="text-xs opacity-80 font-mono mt-0.5">
                        {geoError || (coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Aguardando...")}
                    </p>
                    {!geoError && (
                        <button onClick={refreshGeo} className="text-[10px] font-bold uppercase tracking-wider underline mt-2 hover:text-black dark:hover:text-white">Atualizar GPS</button>
                    )}
                </div>
            </div>

            {/* Native Camera Input (Hidden) */}
            <input
                type="file"
                accept="image/*"
                capture="user"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Camera Preview */}
            <div className="bg-surface-elevated rounded-2xl overflow-hidden shadow-lg aspect-[3/4] relative mb-6 border border-border-default group">
                {imgSrc ? (
                    <img src={imgSrc} alt="Preview" className="w-full h-full object-cover animate-in fade-in duration-500" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-surface-subtle/50">
                        <Camera size={48} className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Toque na câmera abaixo</span>
                    </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pb-2 z-10">
                    {imgSrc ? (
                        <button
                            onClick={() => setImgSrc(null)}
                            className="bg-surface-elevated/80 text-text-primary px-6 py-2.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-md border border-border-default hover:bg-surface-elevated transition-transform active:scale-95"
                        >
                            Tirar Outra
                        </button>
                    ) : (
                        <button
                            onClick={triggerCamera}
                            aria-label="Capturar Foto"
                            className="bg-primary text-white rounded-full p-5 shadow-neon hover:scale-105 active:scale-90 transition-all duration-300"
                        >
                            <Camera size={32} />
                        </button>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleSubmit('check_in')}
                    disabled={!imgSrc || !coords || submitting}
                    className="py-3.5 bg-green-600 text-white rounded-xl font-bold shadow-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : 'ENTRADA'}
                </button>
                <button
                    onClick={() => handleSubmit('check_out')}
                    disabled={!imgSrc || !coords || submitting}
                    className="py-3.5 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : 'SAÍDA'}
                </button>
            </div>
        </div>
    );
};

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
