import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PlanningTemplate, PlanningTemplateElement } from '../types';

interface PlanningTemplateRendererProps {
    template: PlanningTemplate;
    initialValues?: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    readOnly?: boolean;
}

export const PlanningTemplateRenderer: React.FC<PlanningTemplateRendererProps> = ({
    template,
    initialValues = {},
    onChange,
    readOnly = false
}) => {
    const [values, setValues] = useState<Record<string, any>>(initialValues);
    const containerRef = useRef<HTMLDivElement>(null);

    // PDF State
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);

    // PDF Imports (Lazy)
    const [Document, setDocument] = useState<any>(null);
    const [Page, setPage] = useState<any>(null);

    useEffect(() => {
        setValues(initialValues);
    }, [initialValues]);

    const isHtml = !!template.structure_url;
    const isPdf = !isHtml && template.background_url?.toLowerCase().endsWith('.pdf');
    const isDocx = !isHtml && !isPdf && template.background_url?.toLowerCase().endsWith('.docx');
    const isImage = !isHtml && !isPdf && !isDocx && !!template.background_url;

    // Load PDF Libs
    useEffect(() => {
        if (isPdf) {
            import('react-pdf').then(module => {
                setDocument(() => module.Document);
                setPage(() => module.Page);
                // Worker setup
                module.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${module.pdfjs.version}/build/pdf.worker.min.js`;
            });
        }
    }, [isPdf]);

    // Handle HTML Structure Rendering (Editable/Saved Version)
    useEffect(() => {
        const renderHtml = async () => {
            if (!isHtml || !template.structure_url || !containerRef.current) return;
            try {
                const response = await fetch(template.structure_url);
                const html = await response.text();
                // Inject HTML
                containerRef.current.innerHTML = html;
            } catch (e) {
                console.error("Error loading HTML structure", e);
                containerRef.current.innerHTML = '<div class="p-4 text-red-500">Erro ao carregar estrutura salva.</div>';
            }
        };
        renderHtml();
    }, [isHtml, template.structure_url]);

    // Handle Raw DOCX Rendering (Fallback)
    useEffect(() => {
        const renderBackground = async () => {
            if (!isDocx || !template.background_url || !containerRef.current) return;

            try {
                // Clean container
                containerRef.current.innerHTML = '';

                const response = await fetch(template.background_url);
                const blob = await response.blob();

                const { renderAsync } = await import('docx-preview');
                await renderAsync(blob, containerRef.current, undefined, {
                    inWrapper: false,
                    ignoreWidth: false, // Let it fit container
                    ignoreHeight: false,
                    experimental: true, // Force experimental for better fidelity
                    useBase64URL: true
                });
            } catch (e) {
                console.error("Error rendering DOCX background", e);
                if (containerRef.current) {
                    containerRef.current.innerHTML = '<div class="flex items-center justify-center h-full text-red-500 text-xs font-bold">Erro ao carregar DOCX</div>';
                }
            }
        };
        renderBackground();
    }, [isDocx, template.background_url]);

    const handleChange = (elementId: string, value: any) => {
        if (readOnly) return;
        const newValues = { ...values, [elementId]: value };
        setValues(newValues);
        onChange(newValues);
    };



    return (
        <div className="w-full overflow-auto bg-gray-100 dark:bg-black/20 p-8 rounded-xl border border-gray-200 dark:border-gray-800">
            {/* Paper Container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`shrink-0 relative bg-white shadow-md mx-auto overflow-hidden ${template.orientation === 'portrait' ? 'w-[210mm] min-h-[297mm]' : 'w-[297mm] min-h-[210mm]'
                    }`}
            >

                {/* 1. Background Layer */}
                <motion.div
                    className="absolute inset-0 z-0 pointer-events-none bg-center bg-no-repeat bg-[length:100%_100%]"
                    animate={{
                        backgroundImage: (isImage && template.background_url) ? `url(${template.background_url})` : 'none'
                    }}
                    ref={containerRef}
                >
                    {isHtml && (
                        <style>{`
                            .docx-wrapper { padding: 0 !important; background: transparent !important; }
                            section.docx { 
                                box-shadow: none !important; 
                                margin-bottom: 0 !important; 
                                min-height: auto !important; 
                                background-color: transparent !important; 
                                padding: 0 !important;
                            }
                             /* Hide docx-preview wrapper background if any */
                             .docx-render-content { background: transparent !important; }
                        `}</style>
                    )}
                    {isPdf && Document && Page && template.background_url && (
                        <div className="w-full h-full">
                            <Document
                                file={template.background_url}
                                onLoadSuccess={({ numPages }: any) => setNumPages(numPages)}
                                className="w-full h-full flex justify-center items-center"
                                loading={<div className="text-xs text-gray-400">Carregando PDF...</div>}
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    width={template.orientation === 'portrait' ? 794 : 1123} // Approx pixels for A4 @ 96 DPI
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        </div>
                    )}
                    {/* DOCX is rendered into containerRef via useEffect */}
                </motion.div>

                {/* 2. Content Layer (Inputs) */}
                <div className="absolute inset-0 z-10">
                    {(template.elements || []).map((element) => {
                        const value = values[element.id] || '';

                        return (
                            <motion.div
                                key={element.id}
                                style={{ position: element.x !== undefined ? 'absolute' : 'relative' }}
                                animate={{
                                    left: element.x,
                                    top: element.y,
                                    width: element.width || (element.type === 'textarea' ? 400 : 200),
                                    height: element.height || (element.type === 'textarea' ? 100 : 40),
                                }}
                                className={`flex flex-col ${!element.x ? 'mb-4 mx-8' : ''}`}
                            >
                                {/* Hover Label */}
                                <label className="text-[10px] font-bold text-gray-500 bg-white/90 px-1 rounded w-fit mb-0.5 select-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 left-0 whitespace-nowrap z-20 shadow-sm pointer-events-none">
                                    {element.name} {element.required && <span className="text-red-500">*</span>}
                                </label>

                                {
                                    element.type === 'textarea' ? (
                                        <textarea
                                            className="w-full h-full bg-transparent hover:bg-white/40 focus:bg-white/90 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none resize-none overflow-hidden transition-all text-gray-900 leading-normal"
                                            value={value}
                                            onChange={(e) => handleChange(element.id, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder={readOnly ? "" : "Digite..."}
                                            title={element.name}
                                        />
                                    ) : element.type === 'date' ? (
                                        <input
                                            type="date"
                                            className="w-full h-full bg-transparent hover:bg-white/40 focus:bg-white/90 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900"
                                            value={value}
                                            onChange={(e) => handleChange(element.id, e.target.value)}
                                            readOnly={readOnly}
                                            title={element.name}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent hover:bg-white/40 focus:bg-white/90 border border-transparent hover:border-blue-300 focus:border-blue-500 rounded p-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-gray-900"
                                            value={value}
                                            onChange={(e) => handleChange(element.id, e.target.value)}
                                            readOnly={readOnly}
                                            placeholder={readOnly ? "" : "Digite..."}
                                            title={element.name}
                                        />
                                    )
                                }
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Page Controls for PDF (Simple) */}
            {
                isPdf && numPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            className="p-2 px-4 rounded-lg bg-white dark:bg-surface-dark shadow text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Anterior
                        </button>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Página {pageNumber} de {numPages}</span>
                        <button
                            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            className="p-2 px-4 rounded-lg bg-white dark:bg-surface-dark shadow text-sm font-bold text-gray-600 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50"
                        >
                            Próxima
                        </button>
                    </div>
                )
            }
        </div >
    );
};
