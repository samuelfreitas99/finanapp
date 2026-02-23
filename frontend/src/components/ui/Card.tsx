import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    className?: string;
    gradient?: boolean;
}

export function Card({ children, className, gradient = false, ...props }: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
                "rounded-2xl border p-6 shadow-xl relative overflow-hidden",
                gradient
                    ? "bg-gradient-to-br from-slate-900 to-slate-800 border-white/10"
                    : "bg-slate-900 border-white/5",
                className
            )}
            {...props}
        >
            {/* Subtle top glare effect */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
}
