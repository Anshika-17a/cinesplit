import React from 'react';
import { motion } from 'framer-motion';

export const Skeleton: React.FC<{ width?: string; height?: string; borderRadius?: string; style?: React.CSSProperties }> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = 'var(--radius-md)',
  style
}) => {
  return (
    <motion.div
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--color-surface-hover)',
        ...style
      }}
    />
  );
};
