import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import getCroppedImg from '../utils/cropImage'
import { useThemeContext } from '../contexts/ThemeContext'

interface ImageCropperModalProps {
    isOpen: boolean
    imageSrc: string | null
    onClose: () => void
    onCropComplete: (croppedBlob: Blob) => void
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
    const theme = useThemeContext();
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop)
    }

    const onZoomChange = (zoom: number) => {
        setZoom(zoom)
    }

    const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return

        setLoading(true)
        try {
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            )
            if (croppedImageBlob) {
                onCropComplete(croppedImageBlob)
                onClose()
            }
        } catch (e) {
            console.error(e)
            alert('Erro ao recortar imagem')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
                    <h3 className="font-bold text-slate-800 dark:text-white">Ajustar Foto</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                <div className="relative flex-1 bg-slate-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteHandler}
                        onZoomChange={onZoomChange}
                        objectFit="contain"
                    />
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-slate-400 text-sm">remove</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            title="Ajustar Zoom"
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary"
                        />
                        <span className="material-symbols-outlined text-slate-400 text-sm">add</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all bg-${theme.primaryColor} hover:bg-${theme.primaryColor}/90`}
                        style={{ backgroundColor: theme.primaryColorHex }}
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <span className="material-symbols-outlined">check</span>
                        )}
                        Confirmar Recorte
                    </button>
                </div>
            </div>
        </div>
    )
}
