import React from 'react';
import { motion } from 'framer-motion';

interface CardProps extends React.ComponentProps<typeof motion.div> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, interactive = false, style, ...props }) => {
  return (
    <motion.div
      whileHover={interactive ? { scale: 1.02, y: -4 } : {}}
      style={{
        background: 'var(--color-surface)',
        backdropFilter: 'var(--backdrop-blur)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        boxShadow: 'var(--shadow-glass)',
        cursor: interactive ? 'pointer' : 'default',
        ...style
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
