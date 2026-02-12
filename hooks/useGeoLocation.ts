import { useState, useEffect } from 'react';

interface Coordinates {
    lat: number;
    lng: number;
}

interface GeoState {
    coords: Coordinates | null;
    error: string | null;
    loading: boolean;
}

export const useGeoLocation = () => {
    const [state, setState] = useState<GeoState>({
        coords: null,
        error: null,
        loading: true
    });

    const getPosition = () => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, error: 'Geolocalização não suportada', loading: false }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setState({
                    coords: {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    },
                    error: null,
                    loading: false
                });
            },
            (err) => {
                let msg = 'Erro ao obter localização';
                if (err.code === 1) msg = 'Permissão de GPS negada';
                if (err.code === 2) msg = 'Sinal de GPS indisponível';
                if (err.code === 3) msg = 'Tempo limite esgotado';

                setState(prev => ({ ...prev, error: msg, loading: false }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    useEffect(() => {
        getPosition();
    }, []);

    // Haversine Formula: Calculate distance in meters
    const calculateDistance = (targetLat: number, targetLng: number) => {
        if (!state.coords) return Infinity;

        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371e3; // Earth radius in meters

        const lat1 = toRad(state.coords.lat);
        const lat2 = toRad(targetLat);
        const dLat = toRad(targetLat - state.coords.lat);
        const dLng = toRad(targetLng - state.coords.lng);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    };

    return { ...state, refresh: getPosition, calculateDistance };
};
