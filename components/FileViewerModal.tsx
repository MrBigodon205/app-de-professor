import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AttachmentFile } from '../types';

interface FileViewerModalProps {
    file: AttachmentFile;
    isOpen: boolean;
    onClose: () => void;
}

const FileViewerModal: React.FC<FileViewerModalProps> = ({ file, isOpen, onClose }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [drawingColor, setDrawingColor] = useState('#ef4444'); // Red default
    const [lineWidth, setLineWidth] = useState(3);
    // State for Drawing History
    interface DrawingPath {
        points: { x: number; y: number }[];
        color: string;
        width: number;
    }
    const [paths, setPaths] = useState<DrawingPath[]>([]);
    const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Safety check
    if (!file) return null;

    // Reset state when file changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setIsDrawingMode(false);
            setPaths([]); // Clear history
            setCurrentPath(null);

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
                // Use quadratic curves for smoother lines could be better, 
                // but lineTo is faster and standard for pixel art feeling or simple annotation
                // Let's stick to lineTo for now, but ensure high density of points
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
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            // Set dynamic line width based on image size to ensure visibility and quality
            // Base: 4px for a 1000px wide image seems reasonable
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
            redrawCanvas(); // Redraw if there were existing paths (e.g. from history if we preserved it, though here we reset)
        }
    };

    // ... (Zoom Handlers, same as before)
    // Zoom Handlers
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 5));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Wheel Zoom to Cursor
    const handleWheel = (e: React.WheelEvent) => {
        if (!isImage) return;

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(scale + delta, 0.5), 5);

        // Calculate mouse position relative to window center (which is 0,0 for our position state)
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const mouseX = e.clientX - cx;
        const mouseY = e.clientY - cy;

        // Calculate new position to keep mouse point stable
        // Formula: newPos = mouse - (mouse - oldPos) * (newScale / oldScale)
        const scaleRatio = newScale / scale;
        const newPos = {
            x: mouseX - (mouseX - position.x) * scaleRatio,
            y: mouseY - (mouseY - position.y) * scaleRatio
        };

        setScale(newScale);
        setPosition(newPos);
    };

    // Pan Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDrawingMode) {
            startDrawing(e);
            return;
        }
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDrawingMode) {
            draw(e);
            return;
        }
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        if (isDrawingMode) finishDrawing();
        setIsDragging(false);
    };

    // Drawing Logic
    const getCanvasCoordinates = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDrawing = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoordinates(e);
        setCurrentPath({
            points: [{ x, y }],
            color: drawingColor,
            width: lineWidth
        });
        setIsDragging(true); // Active drawing
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDragging || !currentPath) return; // Must be "dragging" (drawing) and have a path
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
        if (currentPath) {
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

    if (!isOpen) return null;

    const isImage = file.url.match(/\.(jpg|jpeg|png|webp)$/i) || file.url.startsWith('data:image');
    const isPDF = file.url.match(/\.pdf$/i) || file.url.startsWith('data:application/pdf');
    const isPPT = file.url.match(/\.(ppt|pptx)$/i);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
            {/* Toolbar */}
            <div className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <h3 className="text-white font-bold truncate max-w-md">{file.name}</h3>
                    <div className="h-6 w-px bg-slate-700"></div>
                    {/* Zoom Controls for Image Only */}
                    {isImage && (
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button onClick={handleZoomOut} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Zoom Out">
                                <span className="material-symbols-outlined text-xl">remove</span>
                            </button>
                            <button onClick={handleReset} className="px-3 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors font-mono text-xs flex items-center" title="Reset">
                                {Math.round(scale * 100)}%
                            </button>
                            <button onClick={handleZoomIn} className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors" title="Zoom In">
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Drawing Tools (Only for Images) */}
                {isImage && (
                    <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1">
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
                                <div className="h-6 w-px bg-slate-700 mx-1"></div>

                                {['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#ffffff'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setDrawingColor(color)}
                                        className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${drawingColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div className="h-6 w-px bg-slate-700 mx-1"></div>
                                <button onClick={clearCanvas} className="p-2 text-slate-300 hover:text-red-400 hover:bg-slate-700 rounded-md" title="Limpar Tudo">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-500 rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 overflow-hidden relative cursor-crosshair bg-neutral-900 flex items-center justify-center p-4">
                {/* Image Mode */}
                {isImage && (
                    <div
                        ref={containerRef}
                        className={`relative origin-center bg-white shadow-2xl select-none ${!isDragging ? 'transition-transform duration-75' : ''} ${!isDrawingMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            touchAction: 'none' // Prevent touch scrolling
                        }}
                        onWheel={handleWheel}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent image selection/ghost dragging
                            handleMouseDown(e);
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            ref={imgRef}
                            src={file.url}
                            alt="Visualização"
                            className="max-w-[none] pointer-events-none block" // pointer-events-none to let container handle events
                            onLoad={handleImageLoad}
                            style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain' }} // Initial fit
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full pointer-events-none" // pointer-events-none? NO.
                        // Actually, if container handles events, canvas doesn't need to be interactive directly.
                        // But for drawing, we need mapped coordinates.
                        // If pointer-events-none, image/container gets event.
                        />
                    </div>
                )}

                {/* PDF Mode */}
                {isPDF && (
                    <div className="size-full flex flex-col items-center justify-center">
                        <iframe
                            src={file.url}
                            className="w-[90%] h-[95%] rounded-lg shadow-2xl bg-white"
                            title="PDF Viewer"
                        />
                        <p className="mt-4 text-slate-400 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">info</span>
                            Para desenhar, converta seu documento para Imagem (JPG/PNG).
                        </p>
                    </div>
                )}

                {/* PPT Mode */}
                {isPPT && (
                    <div className="size-full flex flex-col items-center justify-center">
                        <iframe
                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`}
                            className="w-[90%] h-[95%] rounded-lg shadow-2xl bg-white"
                            title="Apresentação PPT"
                        />
                        <p className="mt-4 text-slate-400 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-yellow-500">info</span>
                            Para desenhar slide a slide, salve sua apresentação como Imagens (JPG).
                        </p>
                    </div>
                )}

                {/* Unsupported Mode */}
                {!isImage && !isPDF && !isPPT && (
                    <div className="text-white text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">sentiment_dissatisfied</span>
                        <p>Formato não suportado para visualização rápida.</p>
                        <a href={file.url} download className="mt-4 inline-block px-4 py-2 bg-indigo-600 rounded-lg text-white font-bold">Baixar Arquivo</a>
                    </div>
                )}
            </div>

            {/* Shortcuts / Tips */}
            {isImage && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs text-slate-300 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
                    {isDrawingMode ? 'Modo Desenho: Clique e arraste para riscar' : 'Modo Pan: Clique e arraste para mover • Use toolbar para Zoom'}
                </div>
            )}
        </div>,
        document.body
    );
};

export default FileViewerModal;
