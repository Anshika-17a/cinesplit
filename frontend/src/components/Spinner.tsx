import React from 'react';
import { motion } from 'framer-motion';

export const Spinner: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-md)' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          border: '2px solid var(--color-surface)',
          borderTopColor: 'var(--color-accent)'
        }}
      />
    </div>
  );
};
