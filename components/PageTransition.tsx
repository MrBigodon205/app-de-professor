import React from 'react';
import { motion, Variants } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    type?: string;
    className?: string; // Add className prop for flexibility
}

// ---------------------------------------------------------------------------
// 🌊 PRESETS DE ANIMAÇÃO (Excellence Kit)
// ---------------------------------------------------------------------------

// Curva de Bezier "Apple-like" para movimento natural e responsivo
// Começa rápido e desacelera suavemente
const PREMIUM_EASE: [number, number, number, number] = [0.2, 0, 0.2, 1];

export const containerVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.99
    },
    enter: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: PREMIUM_EASE,
            staggerChildren: 0.05, // Efeito cascata para os filhos
            delayChildren: 0.1,    // Pequeno delay para garantir que o layout montou
        }
    },
    exit: {
        opacity: 0,
        scale: 0.99,
        transition: {
            duration: 0.2,
            ease: "easeIn" // Saída mais rápida
        }
    }
};

// Variante para itens de lista (Cards, Linhas de Tabela, etc.)
// Basta adicionar <motion.div variants={itemVariants}> ao redor do item
export const itemVariants: Variants = {
    initial: {
        opacity: 0,
        y: 10 // Leve deslocamento vertical
    },
    enter: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: {
            duration: 0.2
        }
    }
};

// Variante simplificada para páginas que não precisam de stagger (ex: Login)
const simpleFadeVariants: Variants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: {
            duration: 0.3,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

const PageTransition: React.FC<PageTransitionProps> = ({ children, type = 'default', className = '' }) => {
    // Se "simple" for passado, usa fade simples. Caso contrário, usa o premium com stagger.
    const variants = type === 'simple' ? simpleFadeVariants : containerVariants;

    return (
        <motion.div
            variants={variants}
            initial="initial"
            animate="enter"
            exit="exit"
            className={`w-full h-full flex flex-col will-change-[opacity,transform] ${className}`}
        >
            {children}
        </motion.div>
    );
};

export { PageTransition };
export default React.memo(PageTransition);
