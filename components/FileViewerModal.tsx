import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { AttachmentFile } from '../types';

interface FileViewerModalProps {
    file: AttachmentFile;
    isOpen: boolean;
    onClose: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, isOpen, onClose }) => {
    // UI State
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#ef4444'); // Red default
    const [lineWidth, setLineWidth] = useState(3);
    const [isDragging, setIsDragging] = useState(false); // For drawing drag

    // State for Drawing History
    interface DrawingPath {
        points: { x: number; y: number }[];
        color: string;
        width: number;
    }
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

    // Refs
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Inner container for canvas/img
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Zoom State for UI display only (library handles actual calc)
    const [currentScale, setCurrentScale] = useState(1);

    // Safety check
    if (!file) return null;

    // Mobile Detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const isImage = file.url.toLowerCase().split('?')[0].match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) || file.url.startsWith('data:image');
    const isPDF = file.url.toLowerCase().split('?')[0].match(/\.pdf$/i) || file.url.startsWith('data:application/pdf');
    const isPPT = file.url.toLowerCase().split('?')[0].match(/\.(ppt|pptx)$/i);
    const isWord = file.url.toLowerCase().split('?')[0].match(/\.(doc|docx)$/i);
    const isExcel = file.url.toLowerCase().split('?')[0].match(/\.(xls|xlsx)$/i);

    // Reset state when file changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setIsDrawingMode(false);
            setPaths([]); // Clear history
            setCurrentPath(null);
            setCurrentScale(1);

            // Clear canvas if it exists
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        }
    }, [isOpen, file]);

    // Redraw all paths
    const redrawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Function to draw a path
        const drawPath = (path: DrawingPath) => {
            if (path.points.length < 2) return;

            ctx.beginPath();
            ctx.strokeStyle = path.color;
            ctx.lineWidth = path.width;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            ctx.stroke();
        };

        paths.forEach(drawPath);
        if (currentPath) drawPath(currentPath);
    };

    // Effect to trigger redraw when paths or currentPath changes
    useEffect(() => {
        redrawCanvas();
    }, [paths, currentPath]);

    const handleImageLoad = () => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (canvas && img) {
            // Wait a tick for layout to stabilize if needed, but usually naturalWidth is ready
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Set dynamic line width based on image size
            const dynamicWidth = Math.max(3, Math.round(img.naturalWidth / 300));
            setLineWidth(dynamicWidth);

            // Re-apply context settings after resize
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = drawingColor;
                ctx.lineWidth = dynamicWidth;
                contextRef.current = ctx;
            }
            if (transformRef.current) {
                // Wait for a frame to ensure the DOM has updated with the new canvas size
                requestAnimationFrame(() => {
                    transformRef.current?.centerView();
                });
            }
            redrawCanvas();
        }
    };

    // --- Interaction Logic ---

    // Drawing Logic
    const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingMode) return;
        // e.preventDefault(); // Prevent scrolling on touch? Library handles disabling.

        const { x, y } = getCanvasCoordinates(e);
        setCurrentPath({
            points: [{ x, y }],
            color: drawingColor,
            width: lineWidth
        });
        setIsDragging(true); // Active drawing
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingMode || !isDragging || !currentPath) return;
        const { x, y } = getCanvasCoordinates(e);

        setCurrentPath(prev => {
            if (!prev) return null;
            return {
                ...prev,
                points: [...prev.points, { x, y }]
            };
        });
    };

    const finishDrawing = () => {
        if (isDrawingMode && currentPath) {
            setPaths(prev => [...prev, currentPath]);
            setCurrentPath(null);
        }
        setIsDragging(false);
    };

    const undo = () => {
        setPaths(prev => prev.slice(0, -1));
    };

    const clearCanvas = () => {
        setPaths([]);
        setCurrentPath(null);
    };

    // Zoom Controls via Ref
    const handleZoomIn = () => {
        if (transformRef.current) {
            transformRef.current.zoomIn();
            // Sync scale state manually or rely on library callback. 
            // Library doesn't expose easy sync state hook without re-renders, 
            // so we might just approximate or ignore precise % display if simpler.
            // But let's try to keep it simple: just trigger action.
        }
    };

    const handleZoomOut = () => {
        if (transformRef.current) transformRef.current.zoomOut();
    };

    const handleReset = () => {
        if (transformRef.current) transformRef.current.resetTransform();
    };


    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200" onTouchMove={(e) => isDrawingMode && e.preventDefault()}>
            {/* Toolbar */}
            <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 shrink-0 z-50 overflow-x-auto no-scrollbar gap-4">
                <div className="flex items-center gap-4 shrink-0">
                    <h3 className="text-white font-bold truncate max-w-[100px] md:max-w-md">{file.name}</h3>
                    <div className="h-6 w-px bg-slate-700 hidden md:block"></div>

                    {/* Zoom Controls for Image Only */}
                    {isImage && (
                        <div className="flex bg-slate-800 rounded-lg p-1 shrink-0">
                            <button onClick={handleZoomOut} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Zoom Out">
                                <span className="material-symbols-outlined text-xl">remove</span>
                            </button>
                            <button onClick={handleReset} className="px-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors font-mono text-xs flex items-center" title="Reset">
                                <span className="material-symbols-outlined text-sm md:hidden">restart_alt</span>
                                <span className="hidden md:inline">Reset</span>
                            </button>
                            <button onClick={handleZoomIn} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Zoom In">
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Drawing Tools (Only for Images) */}
                {isImage && (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 shrink-0">
                        <button
                            onClick={() => setIsDrawingMode(false)}
                            className={`p-2 rounded-md transition-colors ${!isDrawingMode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            title="Modo Mover (Pan)"
                        >
                            <span className="material-symbols-outlined text-xl">open_with</span>
                        </button>
                        <div className="h-6 w-px bg-slate-700 mx-1"></div>
                        <button
                            onClick={() => setIsDrawingMode(true)}
                            className={`p-2 rounded-md transition-colors ${isDrawingMode ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            title="Caneta"
                        >
                            <span className="material-symbols-outlined text-xl">edit</span>
                        </button>

                        {isDrawingMode && (
                            <div className="flex items-center gap-1 mx-2 animate-in fade-in slide-in-from-left-2">
                                <button
                                    onClick={undo}
                                    className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md disabled:opacity-50"
                                    title="Desfazer Último Risco"
                                    disabled={paths.length === 0}
                                >
                                    <span className="material-symbols-outlined text-xl">undo</span>
                                </button>
                                <div className="hidden md:flex gap-1">
                                    {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setDrawingColor(color)}
                                            className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${drawingColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                            title={`Cor ${color}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                <button
                                    className="md:hidden size-6 rounded-full border-2 border-white"
                                    style={{ backgroundColor: drawingColor }}
                                    title="Alterar cor"
                                    onClick={() => {
                                        // Mobile color picker toggle could go here, for now just cycles or static
                                        const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff'];
                                        const nextIdx = (colors.indexOf(drawingColor) + 1) % colors.length;
                                        setDrawingColor(colors[nextIdx]);
                                    }}
                                />

                                <div className="h-6 w-px bg-slate-700 mx-1"></div>
                                <button onClick={clearCanvas} className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-700 rounded-md" title="Limpar Tudo">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-500 rounded-lg transition-colors ml-auto">
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 overflow-hidden relative bg-neutral-900 flex items-center justify-center">
                {/* Image Mode */}
                {isImage && (
                    <TransformWrapper
                        ref={transformRef}
                        initialScale={1}
                        minScale={0.5}
                        maxScale={5}
                        centerOnInit
                        disabled={isDrawingMode} // CRITICAL: Disable zoom logic when drawing
                        wheel={{ disabled: isDrawingMode }}
                        panning={{ disabled: isDrawingMode }}
                        pinch={{ disabled: isDrawingMode }}
                        doubleClick={{ disabled: isDrawingMode }}
                    >
                        {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
                            <TransformComponent
                                wrapperClass="!w-full !h-full flex items-center justify-center bg-black/5"
                                contentClass="flex items-center justify-center p-4"
                                wrapperStyle={{ width: '100%', height: '100%', cursor: isDrawingMode ? 'crosshair' : 'grab' }}
                            >
                                <div
                                    className="relative shadow-2xl flex items-center justify-center bg-white/5 rounded-lg overflow-hidden"
                                // Touch handlers for drawing must be on this container AND canvas
                                // Actually canvas covers image, so we put handlers on canvas or wrapper
                                >
                                    <img
                                        ref={imgRef}
                                        src={file.url}
                                        alt="Visualização"
                                        className="max-w-[95vw] max-h-[85vh] object-contain block pointer-events-none select-none shadow-black/50 shadow-2xl"
                                        onLoad={handleImageLoad}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className={`absolute inset-0 w-full h-full touch-none ${isDrawingMode ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={finishDrawing}
                                        onMouseLeave={finishDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={finishDrawing}
                                    />
                                </div>
                            </TransformComponent>
                        )}
                    </TransformWrapper>
                )}

                {/* PDF Mode */}
                {isPDF && (
                    <div className="size-full flex flex-col items-center justify-center p-4">
                        <iframe
                            src={isMobile && !file.url.startsWith('data:') ? `https://docs.google.com/viewer?url=${encodeURIComponent(file.url)}&embedded=true` : file.url}
                            className="w-full h-full md:w-[90%] md:h-[95%] rounded-lg shadow-2xl bg-white border-0"
                            title="PDF Viewer"
                        />
                        {/* Mobile Warning/Tip */}
                        <div className="md:hidden absolute bottom-20 bg-black/70 px-4 py-2 rounded-full text-white text-xs">
                            Toque para navegar no PDF
                        </div>
                    </div>
                )}

                {/* PPT Mode */}
                {isPPT && (
                    <div className="size-full flex flex-col items-center justify-center p-4">
                        <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                            className="w-full h-full md:w-[90%] md:h-[95%] rounded-lg shadow-2xl bg-white border-0"
                            title="Apresentação PPT"
                        />
                    </div>
                )}

                {/* Unsupported Mode */}
                {!isImage && !isPDF && !isPPT && (
                    <div className="text-white text-center p-6">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">description_off</span>
                        <p className="font-bold text-lg mb-2">Visualização não disponível</p>
                        <p className="text-slate-400 max-w-xs mx-auto">Este formato de arquivo não pode ser visualizado diretamente no navegador.</p>
                        <a href={file.url} download className="mt-4 inline-block px-4 py-2 bg-indigo-600 rounded-lg text-white font-bold">Baixar Arquivo</a>
                    </div>
                )}
            </div>

            {/* Shortcuts / Tips */}
            {isImage && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs text-slate-300 pointer-events-none opacity-0 md:opacity-70 transition-opacity whitespace-nowrap z-[10000]">
                    {isDrawingMode ? 'Modo Desenho Ativo' : 'Use dois dedos para zoom (mobile) ou scroll (PC)'}
                </div>
            )}
        </div>,
        document.body
    );
};

export default FileViewerModal;
