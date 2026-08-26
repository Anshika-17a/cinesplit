import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--color-surface)', backdropFilter: 'var(--backdrop-blur)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-md) var(--space-xl)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)'
      }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
          CINE<span style={{ color: 'var(--color-accent)' }}>SPLIT</span>
        </Link>
        <nav style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <>
              <Link to="/bookings" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', transition: 'color var(--transition-fast)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-text-primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
                My Bookings
              </Link>
              <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>Logout</button>
              </div>
            </>
          ) : (
            <Link to="/login" style={{ fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Login</Link>
          )}
        </nav>
      </header>
      
      <main style={{ flex: 1, padding: 'var(--space-2xl) var(--space-xl)', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
};
