import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-xl)',
      right: 'var(--space-xl)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-sm)',
      zIndex: 1000
    }}>
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'var(--color-surface)',
              backdropFilter: 'var(--backdrop-blur)',
              border: `1px solid ${toast.type === 'error' ? 'var(--color-danger)' : toast.type === 'success' ? 'var(--color-success)' : 'var(--color-border)'}`,
              padding: '1rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glass)',
              fontSize: '0.9rem'
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
