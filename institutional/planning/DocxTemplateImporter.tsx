import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save,
    X,
    Type,
    AlignLeft,
    Calendar,
    List,
    Plus,
    MousePointerClick,
    Move,
    ZoomIn,
    ZoomOut,
    Maximize,
    Edit3,
    Eye
} from 'lucide-react';
import { PlanningTemplateElement } from '../../types';

// PDF Worker Setup (Standard for Vite/React)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocxTemplateImporterProps {
    onSave: (elements: PlanningTemplateElement[], file: File | null, type: 'docx' | 'pdf', orientation: 'portrait' | 'landscape', previewBlob?: Blob | null, htmlContent?: string | null) => void;
    onCancel: () => void;
    uploadTempDocx?: (file: File) => Promise<string>;
    schoolId?: string;
    type?: string;
}

export const DocxTemplateImporter: React.FC<DocxTemplateImporterProps> = ({ onSave, onCancel, uploadTempDocx }) => {
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'docx' | 'pdf' | 'html'>('docx');
    const [numPages, setNumPages] = useState<number>(1);
    const [htmlFileContent, setHtmlFileContent] = useState<string | null>(null);

    const [experimentalMode, setExperimentalMode] = useState<boolean>(true);
    const [isEditable, setIsEditable] = useState(false);
    const [viewMode, setViewMode] = useState<'local' | 'office'>('local');
    const [officeUrl, setOfficeUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [elements, setElements] = useState<PlanningTemplateElement[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scale, setScale] = useState(1);

    const handleInternalSave = async () => {
        let blobToSend: Blob | null = null;
        let htmlToSend: string | null = null;

        if (fileType === 'pdf') {
            try {
                const pdfBlob = await file?.arrayBuffer().then(buffer => new Blob([buffer], { type: 'application/pdf' }));
                blobToSend = pdfBlob || null;
            } catch (err) {
                console.error('[DEBUG] Error capturing PDF preview:', err);
            }
        } else if ((fileType === 'docx' || fileType === 'html') && containerRef.current) {
            htmlToSend = containerRef.current.innerHTML;
        }

        // Map 'html' to 'docx' for backend compatibility
        const typeToSend = fileType === 'html' ? 'docx' : fileType;

        onSave(elements, file, typeToSend as any, orientation, blobToSend, htmlToSend);
    };

    // Auto-Scale Logic (Robust)
    useEffect(() => {
        const calculateScale = () => {
            if (file && scrollContainerRef.current) {
                const containerWidth = scrollContainerRef.current.clientWidth;
                // Base width in pixels (approximate for A4 at 96dpi)
                const docWidth = orientation === 'landscape' ? 1122 : 794;

                // Add padding buffer
                const buffer = 48;
                const availableWidth = Math.max(containerWidth - buffer, 300);

                // Calculate scale to fit width, max 1.0
                const newScale = Math.min(1, availableWidth / docWidth);
                setScale(newScale);
            }
        };

        // Run immediately and after a tick to ensure layout is stable
        calculateScale();
        const timer = setTimeout(calculateScale, 100);

        window.addEventListener('resize', calculateScale);
        return () => {
            window.removeEventListener('resize', calculateScale);
            clearTimeout(timer);
        };
    }, [file, orientation]);

    // Drag-to-Scroll Logic (PC "Grab" style)
    const isDraggingRef = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const scrollLeft = useRef(0);
    const scrollTop = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        // Don't drag if clicking a tool or element or if in Edit Mode
        if ((e.target as HTMLElement).closest('.react-draggable') || (isEditable && fileType === 'docx')) return;

        isDraggingRef.current = true;
        startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
        startY.current = e.pageY - scrollContainerRef.current.offsetTop;
        scrollLeft.current = scrollContainerRef.current.scrollLeft;
        scrollTop.current = scrollContainerRef.current.scrollTop;
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleMouseLeave = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = isEditable ? 'text' : 'grab';
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
        if (scrollContainerRef.current) scrollContainerRef.current.style.cursor = isEditable ? 'text' : 'grab';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const y = e.pageY - scrollContainerRef.current.offsetTop;
        const walkX = (x - startX.current) * 1.5; // Scroll speed multiplier
        const walkY = (y - startY.current) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft.current - walkX;
        scrollContainerRef.current.scrollTop = scrollTop.current - walkY;
    };

    // Config for default field sizes
    const DEFAULT_SIZES = {
        text: { w: 200, h: 40 },
        textarea: { w: 400, h: 100 },
        date: { w: 150, h: 40 },
        multiselect: { w: 200, h: 40 }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            const ext = selectedFile.name.split('.').pop()?.toLowerCase();

            if (ext === 'pdf') {
                setFileType('pdf');
            } else if (ext === 'html' || ext === 'htm') {
                setFileType('html');
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        setHtmlFileContent(e.target.result as string);
                        setIsEditable(true); // Auto-enable editing for HTML
                    }
                };
                reader.readAsText(selectedFile);
            } else {
                setFileType('docx');
            }
        }
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Zoom Handlers
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleFitToScreen = () => {
        if (scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth - 80;
            const docWidth = orientation === 'landscape' ? 1122 : 794; // approx px width for A4
            setScale(Math.min(containerWidth / docWidth, 1));
        }
    };

    useEffect(() => {
        if (file && fileType === 'docx' && containerRef.current && viewMode === 'local') {
            const renderDoc = async () => {
                containerRef.current!.innerHTML = ''; // Clear previous
                try {
                    await renderAsync(file, containerRef.current!, undefined, {
                        inWrapper: true,
                        ignoreWidth: false, // Respect document width
                        ignoreHeight: false,
                        experimental: experimentalMode, // Toggle experimental mode
                        useBase64URL: true, // Crucial for images
                        debug: false
                    });
                } catch (err) {
                    console.error("Error rendering DOCX:", err);
                    alert("Erro ao ler o arquivo DOCX. Tente um arquivo mais simples ou converta para PDF.");
                }
            };
            renderDoc();
        }
    }, [file, fileType, experimentalMode, viewMode]);

    const handleToggleOfficeView = async () => {
        if (viewMode === 'office') {
            setViewMode('local');
            return;
        }

        if (officeUrl) {
            setViewMode('office');
            return;
        }

        if (file && uploadTempDocx) {
            setIsUploading(true);
            try {
                const url = await uploadTempDocx(file);
                setOfficeUrl(url);
                setViewMode('office');
            } catch (error) {
                console.error("Error uploading temp file:", error);
                alert("Erro ao preparar visualização Office.");
            } finally {
                setIsUploading(false);
            }
        } else {
            alert("Visualização Office indisponível (falta função de upload).");
        }
    };

    const addElement = (type: 'text' | 'textarea' | 'date' | 'multiselect', x = 50, y = 50) => {
        const id = `field_${Date.now()}`;
        const newEl: PlanningTemplateElement = {
            id,
            name: type === 'textarea' ? 'Nova Área de Texto' : 'Novo Campo',
            type,
            required: false,
            order: elements.length,
            x,
            y,
            width: DEFAULT_SIZES[type].w,
            height: DEFAULT_SIZES[type].h,
            locked: false
        };
        setElements([...elements, newEl]);
        setSelectedId(id);
    };

    const updateElement = (id: string, updates: Partial<PlanningTemplateElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const removeElement = (id: string) => {
        setElements(prev => prev.filter(el => el.id !== id));
    };

    const handleElementClick = (id: string, e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        setSelectedId(id);
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900 backdrop-blur-sm flex flex-col md:flex-row">
            {/* Mobile Header / Desktop Sidebar Header */}
            <div className={`
                ${file ? 'h-16 md:h-auto md:w-72 md:flex-col' : 'h-16 w-full'}
                bg-slate-900 border-b md:border-b-0 md:border-r border-white/10 
                flex md:flex-col items-center justify-between px-4 md:p-6 shrink-0 z-20
                transition-all duration-300 shadow-2xl
            `}>
                <div className="flex md:flex-col items-center md:items-start gap-4 w-full">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors" title="Cancelar">
                            <X size={24} />
                        </button>
                        {/* Mobile Title */}
                        <span className="md:hidden text-sm font-bold text-white ml-2">Importador</span>

                        {/* Mobile Action Buttons */}
                        {file && (
                            <div className="flex md:hidden gap-2">
                                <button
                                    onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                                    className="p-2 bg-white/5 rounded-lg text-white/80"
                                    title="Girar Página"
                                >
                                    <Move className="rotate-90" size={20} />
                                </button>
                                <button
                                    onClick={handleInternalSave}
                                    className="p-2 bg-emerald-500 rounded-lg text-white"
                                    title="Salvar"
                                >
                                    <Save size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block">
                        <h2 className="text-xl font-bold text-white tracking-tight">Importador</h2>
                        <p className="text-xs text-white/40 font-medium">Word & PDF</p>
                    </div>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex flex-col gap-3 w-full mt-8">
                    {!file && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 hover:scale-[1.02] w-full"
                        >
                            <Plus size={18} />
                            Selecionar Arquivo
                        </button>
                    )}
                    {file && (
                        <>
                            {/* Zoom Controls */}
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <button onClick={handleZoomOut} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex justify-center" title="Diminuir Zoom">
                                    <ZoomOut size={18} />
                                </button>
                                <button onClick={handleFitToScreen} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex justify-center" title="Ajustar à Tela">
                                    <Maximize size={18} />
                                </button>
                                <button onClick={handleZoomIn} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex justify-center" title="Aumentar Zoom">
                                    <ZoomIn size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
                                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors w-full border border-white/5"
                            >
                                <Move className={orientation === 'landscape' ? 'rotate-90' : ''} size={18} />
                                {orientation === 'portrait' ? 'Modo Retrato' : 'Modo Paisagem'}
                            </button>

                            {/* Edit Mode Toggle (DOCX & HTML) */}
                            {(fileType === 'docx' || fileType === 'html') && (
                                <button
                                    onClick={() => setIsEditable(!isEditable)}
                                    className={`px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors w-full border border-white/5 ${isEditable
                                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                                        : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {isEditable ? <Edit3 size={18} /> : <Eye size={18} />}
                                    {isEditable ? 'Modo Edição' : 'Modo Visualização'}
                                </button>
                            )}

                            <button
                                onClick={handleInternalSave}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] w-full mt-2"
                            >
                                <Save size={18} />
                                Finalizar Edição
                            </button>
                        </>
                    )}
                </div>

                {/* Desktop Tools List */}
                {file && (
                    <div className="hidden md:flex flex-col gap-3 w-full mt-8 overflow-y-auto pr-2 custom-scrollbar">
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Ferramentas</p>

                        <button onClick={() => addElement('text')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition-all group text-left">
                            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors"><Type size={18} /></div>
                            <div>
                                <span className="block text-white font-bold text-sm">Texto Curto</span>
                                <span className="text-[10px] text-white/40">Para nomes, títulos...</span>
                            </div>
                        </button>

                        <button onClick={() => addElement('textarea')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition-all group text-left">
                            <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors"><AlignLeft size={18} /></div>
                            <div>
                                <span className="block text-white font-bold text-sm">Área de Texto</span>
                                <span className="text-[10px] text-white/40">Para descrições longas...</span>
                            </div>
                        </button>

                        <button onClick={() => addElement('date')} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 transition-all group text-left">
                            <div className="bg-orange-500/20 text-orange-400 p-2 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors"><Calendar size={18} /></div>
                            <div>
                                <span className="block text-white font-bold text-sm">Data</span>
                                <span className="text-[10px] text-white/40">Seletor de calendário...</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Main Area (Canvas) */}
            <div className="flex-1 flex overflow-hidden flex-col relative bg-slate-950/50">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".docx, .pdf, .html, .htm"
                    onChange={handleFileChange}
                    title="Selecionar arquivo"
                />

                {!file ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-white/30 border-2 border-dashed border-white/10 m-8 rounded-3xl bg-slate-900/50">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                            <span className="material-symbols-outlined text-4xl">description</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 text-center">Selecionar Arquivo</h3>
                        <p className="max-w-xs text-center text-sm text-white/40 mb-8 leading-relaxed">Arraste um arquivo Word ou PDF aqui, ou clique para buscar no seu dispositivo.</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg hover:scale-105"
                        >
                            Buscar no dispositivo
                        </button>
                    </div>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="flex-1 overflow-auto relative p-8 md:p-12 flex flex-col items-center cursor-grab active:cursor-grabbing bg-slate-950 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent select-none"
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                    >

                        {fileType === 'docx' && (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 px-4 py-3 rounded-lg mb-8 text-xs font-medium flex flex-col md:flex-row items-start md:items-center gap-4 max-w-xl animate-in fade-in slide-in-from-top-2 sticky top-0 z-50 backdrop-blur-md shadow-lg">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">warning</span>
                                    <div>
                                        <span className="font-bold block text-amber-100">Visualização</span>
                                        {viewMode === 'office'
                                            ? 'Usando Microsoft Office Viewer (Alta Fidelidade). A edição de texto direta não é possível neste modo.'
                                            : 'Word no navegador pode desalinhar. Se estiver ruim, tente o modo Office.'}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                    {viewMode === 'local' && (
                                        <button
                                            onClick={() => setExperimentalMode(!experimentalMode)}
                                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded text-amber-100 border border-amber-500/30 transition-colors uppercase text-[10px] font-bold tracking-wide"
                                        >
                                            {experimentalMode ? 'Fidelidade ++' : 'Padrão'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleToggleOfficeView}
                                        disabled={isUploading}
                                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded text-blue-100 border border-blue-500/30 transition-colors uppercase text-[10px] font-bold tracking-wide flex items-center gap-2"
                                    >
                                        {isUploading ? 'Carregando...' : viewMode === 'office' ? 'Voltar p/ Local' : 'Usar Office Viewer'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <motion.div
                            className={`relative bg-white shadow-2xl origin-top ${orientation === 'landscape'
                                ? 'w-[297mm] min-h-[210mm]'
                                : 'w-[210mm] min-h-[297mm]'
                                }`}
                            onClick={() => setSelectedId(null)}
                            animate={{ scale }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* PDF / DOCX RENDERER */}
                            {fileType === 'pdf' ? (
                                <Document
                                    file={file}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="pdf-document"
                                >
                                    {Array.from(new Array(numPages), (el, index) => (
                                        <Page
                                            key={`page_${index + 1}`}
                                            pageNumber={index + 1}
                                            width={orientation === 'landscape' ? 1122 : 794} // A4 Landscape vs Portrait @ 96dpi
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                            className="mb-4 shadow-sm"
                                        />
                                    ))}
                                </Document>
                            ) : (
                                <>
                                    {/* DOCX / HTML Rendering Layer */}
                                    {viewMode === 'local' ? (
                                        <>
                                            {/* CSS Override for Fidelity */}
                                            <style>{`
                                                    .docx-render-content {
                                                        outline: ${isEditable ? '2px dashed #3b82f6' : 'none'};
                                                        cursor: ${isEditable ? 'text' : 'grab'};
                                                    }
                                                    /* General Resets */
                                                    .docx-render-content .docx-wrapper { padding: 0 !important; background: transparent !important; }
                                                    .docx-render-content section.docx { 
                                                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important; 
                                                        margin-bottom: 2rem !important;
                                                        background: white !important;
                                                        padding: 0 !important; 
                                                        overflow: visible !important;
                                                    }
                                                `}</style>

                                            <div
                                                ref={containerRef}
                                                className="docx-render-content"
                                                contentEditable={isEditable}
                                                suppressContentEditableWarning={true}
                                                dangerouslySetInnerHTML={fileType === 'html' && htmlFileContent ? { __html: htmlFileContent } : undefined}
                                            ></div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full min-h-[inherit] bg-white relative">
                                            {/* Office Embed */}
                                            <iframe
                                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(officeUrl || '')}&wdStartOn=1&wdPrint=0&wdEmbedCode=0`}
                                                className="w-full h-full absolute inset-0 border-none"
                                                title="Office Viewer"
                                            />
                                            {/* Overlay to capture drags/clicks over iframe */}
                                            <div className="absolute inset-0 z-10 bg-transparent" />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* OVERLAYS */}
                            <div className="absolute inset-0 z-10 pointer-events-none">
                                {elements.map(el => (
                                    <Rnd
                                        key={el.id}
                                        size={{ width: el.width || 200, height: el.height || 40 }}
                                        position={{ x: el.x || 0, y: el.y || 0 }}
                                        onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                                        onResizeStop={(e, direction, ref, delta, position) => {
                                            updateElement(el.id, {
                                                width: parseInt(ref.style.width),
                                                height: parseInt(ref.style.height),
                                                ...position,
                                            });
                                        }}
                                        bounds="parent"

                                        // Critical: Only allow dragging/resizing when NOT in edit mode
                                        disableDragging={isEditable}
                                        enableResizing={!isEditable}

                                        className={`group rounded-lg pointer-events-auto ${selectedId === el.id
                                            ? 'border-2 border-blue-500 z-50 bg-blue-500/10 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                                            : 'border border-slate-300/60 hover:border-blue-400 hover:bg-blue-50/10'
                                            } ${isEditable ? 'opacity-50 pointer-events-none' : ''}`}
                                        onClick={(e: React.MouseEvent) => handleElementClick(el.id, e)}
                                        onTouchEnd={(e: React.TouchEvent) => {
                                            // prevent double firing with click, but ensure touch opens drawer
                                            // usually onClick works for tap, but sometimes drag eats it.
                                            // Let's rely on onClick for now, if it fails we add onTouchEnd.
                                        }}
                                    >
                                        <div className="w-full h-full relative p-1 group-hover:opacity-100">
                                            {/* Floating Label (More elegant) */}
                                            <div className={`absolute -top-8 left-0 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-[11px] font-bold transition-all ${selectedId === el.id
                                                ? 'bg-blue-600 text-white translate-y-0 opacity-100'
                                                : 'bg-slate-200 text-slate-600 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
                                                }`}>
                                                <Move size={12} />
                                                <span className="uppercase tracking-wider">{el.name}</span>
                                                <div className="w-px h-3 bg-white/20 mx-1"></div>
                                                <button
                                                    onPointerDown={(e: React.PointerEvent) => { e.stopPropagation(); removeElement(el.id); }}
                                                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                                    title="Remover"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>

                                            {/* Content Preview */}
                                            <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                                <span className={`text-[10px] font-bold uppercase select-none transition-colors ${selectedId === el.id ? 'text-blue-600' : 'text-slate-400'
                                                    }`}>
                                                    {el.type === 'textarea' ? 'Texto Longo' : el.type === 'date' ? 'Data' : 'Texto Curto'}
                                                </span>
                                            </div>

                                            {/* Properties Popover (Light Theme for Comfort) */}
                                            {selectedId === el.id && (
                                                <div className="absolute top-[calc(100%+12px)] left-0 bg-white border border-slate-200 p-5 rounded-2xl shadow-xl z-[60] w-72 text-sm animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5"
                                                    onMouseDown={(e) => e.stopPropagation()} // Prevent dragging from popup
                                                >
                                                    {/* Arrow */}
                                                    <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-t border-l border-slate-200 transform rotate-45"></div>

                                                    <div className="relative z-10 space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nome do Campo</label>
                                                            <input
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300"
                                                                value={el.name}
                                                                onChange={(e) => updateElement(el.id, { name: e.target.value })}
                                                                placeholder="Ex: Título da Aula"
                                                                autoFocus
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-700 font-semibold text-xs">Obrigatório</span>
                                                                    <span className="text-[10px] text-slate-400">O professor deve preencher?</span>
                                                                </div>
                                                                <div className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={el.required}
                                                                        onChange={(e) => updateElement(el.id, { required: e.target.checked })}
                                                                    />
                                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-blue-600"></div>
                                                                </div>
                                                            </label>

                                                            <label className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                                                                        Travar Edição
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400">Impede alterações futuras</span>
                                                                </div>
                                                                <div className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={el.locked}
                                                                        onChange={(e) => updateElement(el.id, { locked: e.target.checked })}
                                                                    />
                                                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:bg-amber-500"></div>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </Rnd>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Mobile Floating Tools (Bottom Bar) */}
                {file && (
                    <div className="md:hidden bg-slate-900 border-t border-white/10 p-4 shrink-0 flex items-center justify-around z-30 safe-area-bottom">
                        <button onClick={() => addElement('text')} className="flex flex-col items-center gap-1 text-blue-400">
                            <div className="p-2 bg-blue-500/20 rounded-lg"><Type size={20} /></div>
                            <span className="text-[10px] font-bold">Texto</span>
                        </button>
                        <button onClick={() => addElement('textarea')} className="flex flex-col items-center gap-1 text-purple-400">
                            <div className="p-2 bg-purple-500/20 rounded-lg"><AlignLeft size={20} /></div>
                            <span className="text-[10px] font-bold">Área</span>
                        </button>
                        <button onClick={() => addElement('date')} className="flex flex-col items-center gap-1 text-orange-400">
                            <div className="p-2 bg-orange-500/20 rounded-lg"><Calendar size={20} /></div>
                            <span className="text-[10px] font-bold">Data</span>
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 16px);
                }
            `}</style>
        </div>
        , document.body);
};
