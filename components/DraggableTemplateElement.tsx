import React from 'react';
import { motion, useDragControls } from 'framer-motion';
import { Trash2, Asterisk, GripVertical, Maximize2 } from 'lucide-react';
import { PlanningTemplateElement } from '../types';

interface DraggableTemplateElementProps {
    element: PlanningTemplateElement;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<PlanningTemplateElement>) => void;
    onRemove: (id: string) => void;
    scale?: number;
}

export const DraggableTemplateElement: React.FC<DraggableTemplateElementProps> = ({
    element,
    isSelected,
    onSelect,
    onUpdate,
    onRemove,
    scale = 1
}) => {
    const dragControls = useDragControls();

    return (
        <motion.div
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            onPointerDown={(e) => {
                e.stopPropagation();
                onSelect(element.id);
            }}
            // REMOVED initial prop to fix "snap back" glitch. 
            // Framer Motion handles layout animations better without forcing initial on re-renders for simple drags.
            onDragEnd={(_, info) => {
                const newX = (element.x || 0) + (info.offset.x / scale);
                const newY = (element.y || 0) + (info.offset.y / scale);
                onUpdate(element.id, { x: newX, y: newY });
            }}
            style={{
                position: element.x ? 'absolute' : 'relative',
                left: 0,
                top: 0,
                width: element.width || (element.type === 'textarea' ? 400 : 200),
                height: element.height || (element.type === 'textarea' ? 100 : 40),
                marginBottom: element.x ? 0 : 12,
                marginLeft: element.x ? 0 : 32,
                marginRight: element.x ? 0 : 32,
                zIndex: isSelected ? 50 : 10
            }}
            className={`group relative rounded-lg transition-all
                ${isSelected
                    ? 'ring-2 ring-primary bg-white shadow-xl'
                    : 'hover:ring-1 hover:ring-primary/50 bg-white/90 hover:bg-white shadow-sm border border-transparent'}
            `}
        >
            {/* Drag Handle */}
            <div
                className={`absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-primary transition-colors touch-none z-[60] ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                onPointerDown={(e) => {
                    dragControls.start(e);
                }}
            >
                <GripVertical size={20} />
            </div>

            {/* Edit Controls */}
            {isSelected && (
                <div className="absolute -top-3 -right-3 flex gap-1 z-[60] animate-in fade-in zoom-in duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(element.id); }}
                        className="p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-transform hover:scale-110"
                        title="Remover"
                    >
                        <Trash2 size={12} strokeWidth={3} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(element.id, { required: !element.required }); }}
                        className={`p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center ${element.required ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                        title={element.required ? "Obrigatório" : "Tornar Obrigatório"}
                    >
                        <Asterisk size={12} strokeWidth={3} />
                    </button>
                </div>
            )}

            <div className="flex flex-col h-full w-full p-2 relative overflow-hidden">
                <input
                    value={element.name}
                    onChange={(e) => onUpdate(element.id, { name: e.target.value })}
                    className={`
                        font-bold bg-transparent border-none p-0 focus:ring-0 w-full text-xs mb-1
                        ${element.required ? "text-amber-600" : "text-gray-700"}
                        placeholder:text-gray-300
                    `}
                    placeholder="Nome do Campo"
                />

                <div className={`
                    flex-1 w-full rounded border border-gray-200 bg-gray-50/50 flex items-center justify-center
                    ${element.type === 'textarea' ? 'items-start pt-2' : ''}
                `}>
                    {element.type === 'date' && <span className="text-[10px] text-gray-400">DD/MM/AAAA</span>}
                    {element.type === 'textarea' && <span className="text-[10px] text-gray-300">Área de Texto</span>}
                    {element.type === 'text' && <span className="text-[10px] text-gray-300">Texto Curto</span>}
                </div>
            </div>

            {/* Resize Handle */}
            {isSelected && (
                <div
                    className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full cursor-nwse-resize z-[100] flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform touch-none"
                    title="Redimensionar"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        const elementNode = e.currentTarget.parentElement as HTMLElement;
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = element.width || (element.type === 'textarea' ? 400 : 200);
                        const startHeight = element.height || (element.type === 'textarea' ? 100 : 40);

                        const onPointerMove = (moveEvent: PointerEvent) => {
                            const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX) / scale);
                            const newHeight = Math.max(30, startHeight + (moveEvent.clientY - startY) / scale);

                            if (elementNode) {
                                elementNode.style.width = `${newWidth}px`;
                                elementNode.style.height = `${newHeight}px`;
                            }
                        };

                        const onPointerUp = (upEvent: PointerEvent) => {
                            document.removeEventListener('pointermove', onPointerMove);
                            document.removeEventListener('pointerup', onPointerUp);

                            const finalWidth = Math.max(100, startWidth + (upEvent.clientX - startX) / scale);
                            const finalHeight = Math.max(30, startHeight + (upEvent.clientY - startY) / scale);
                            onUpdate(element.id, { width: finalWidth, height: finalHeight });
                        };

                        document.addEventListener('pointermove', onPointerMove);
                        document.addEventListener('pointerup', onPointerUp);
                    }}
                >
                    <Maximize2 size={12} className="text-white rotate-90" />
                </div>
            )}
        </motion.div>
    );
};
