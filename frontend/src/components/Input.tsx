import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
      {label && <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</label>}
      <input
        style={{
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          color: 'var(--color-text-primary)',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color var(--transition-fast)'
        }}
        onFocus={e => !error && (e.target.style.borderColor = 'var(--color-accent)')}
        onBlur={e => !error && (e.target.style.borderColor = 'var(--color-border)')}
        {...props}
      />
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  );
};
