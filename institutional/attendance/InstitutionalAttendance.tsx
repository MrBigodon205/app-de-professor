import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
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

    const webcamRef = useRef<Webcam>(null);
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'GPS_FAIL'>('idle');

    const capture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const handleSubmit = async (type: 'check_in' | 'check_out') => {
        if (!currentSchool || !currentUser || !coords || !imgSrc) return;
        setSubmitting(true);

        try {
            // 1. GPS Validation (Simple check against first perimeter for now)
            // Ideally currentSchool.geo_perimeters should be checked.
            // Assuming for Phase 4 we just store status based on ANY tolerance.
            // Let's assume a default perimeter at coords if none set (just for testing flow)
            // In prod: check against currentSchool.geo_perimeters

            // Simulating Validation Logic
            // If school has NO perimeters, we assume "Pending Validation" or "OK" depending on policy.
            // Using "Pending Validation" as safe default if no perimeters defined.
            // If perimeters exist, we check range.

            let attendanceStatus = 'pending_validation';

            // Upload Photo
            const blob = await fetch(imgSrc).then(res => res.blob());
            const fileName = `attendance/${currentSchool.id}/${currentUser.id}/${Date.now()}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('attendance-photos') // Bucket must exist!
                .upload(fileName, blob);

            if (uploadError) throw uploadError;

            const photoUrl = supabase.storage.from('attendance-photos').getPublicUrl(fileName).data.publicUrl;

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

        } catch (err) {
            console.error("Attendance error:", err);
            showToast("Erro ao registrar ponto via App. Verifique sua conexão e tente novamente.", 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getTeacherId = async (instId: string, userId: string) => {
        const { data } = await supabase.from('institution_teachers')
            .select('id').eq('institution_id', instId).eq('user_id', userId).single();
        return data?.id;
    };

    if (geoLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /> Obtendo GPS...</div>;

    if (status === 'success') {
        return (
            <div className="p-10 text-center text-green-600">
                <CheckCircle size={64} className="mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Ponto Registrado!</h2>
                <p>Seus dados foram enviados para a coordenação.</p>
                <button onClick={() => setStatus('idle')} className="mt-6 text-indigo-600 underline">Voltar</button>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <ClockIcon /> Registro de Ponto
            </h1>

            {/* GPS Status */}
            <div className={`p-4 rounded-lg mb-6 flex items-start gap-3 ${geoError ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'}`}>
                <MapPin className="shrink-0 mt-1" size={20} />
                <div>
                    <p className="font-semibold">{geoError ? "Erro no GPS" : "Localização Ativa"}</p>
                    <p className="text-xs opacity-80">
                        {geoError || (coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Aguardando...")}
                    </p>
                    {!geoError && (
                        <button onClick={refreshGeo} className="text-xs underline mt-1">Atualizar</button>
                    )}
                </div>
            </div>

            {/* Camera */}
            <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-[3/4] relative mb-6">
                {imgSrc ? (
                    <img src={imgSrc} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: "user" }}
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Overlay Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center pb-2">
                    {imgSrc ? (
                        <button
                            onClick={() => setImgSrc(null)}
                            className="bg-white/90 text-gray-800 px-6 py-2 rounded-full text-sm font-medium shadow-sm backdrop-blur-sm"
                        >
                            Tirar Outra
                        </button>
                    ) : (
                        <button
                            onClick={capture}
                            aria-label="Capturar Foto"
                            className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
                        >
                            <Camera size={32} className="text-indigo-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() => handleSubmit('check_in')}
                    disabled={!imgSrc || !coords || submitting}
                    className="py-3 bg-green-600 text-white rounded-lg font-bold shadow-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {submitting ? <Loader2 className="animate-spin" /> : 'ENTRADA'}
                </button>
                <button
                    onClick={() => handleSubmit('check_out')}
                    disabled={!imgSrc || !coords || submitting}
                    className="py-3 bg-red-600 text-white rounded-lg font-bold shadow-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
