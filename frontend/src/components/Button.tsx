import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ComponentProps<typeof motion.button> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth, 
  style, 
  ...props 
}) => {
  const getBackground = () => {
    switch (variant) {
      case 'primary': return 'var(--color-accent)';
      case 'secondary': return 'var(--color-surface)';
      case 'ghost': return 'transparent';
    }
  };

  const getHoverBackground = () => {
    switch (variant) {
      case 'primary': return 'var(--color-accent-hover)';
      case 'secondary': return 'var(--color-surface-hover)';
      case 'ghost': return 'var(--color-surface)';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: getBackground(),
        color: 'var(--color-text-primary)',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        fontWeight: 500,
        fontSize: '0.9rem',
        border: variant === 'secondary' ? '1px solid var(--color-border)' : 'none',
        width: fullWidth ? '100%' : 'auto',
        boxShadow: variant === 'primary' ? '0 0 20px var(--color-border-glow)' : 'none',
        ...style
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
};
