import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../hooks/useAppStore';
import { CitySelectorModal } from './CitySelectorModal';
import { MapPin, ChevronDown } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const city = useAppStore((state) => state.city);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--color-surface)', backdropFilter: 'var(--backdrop-blur)',
        borderBottom: '1px solid var(--color-border)',
        padding: 'var(--space-md) var(--space-xl)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
          <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            CINE<span style={{ color: 'var(--color-accent)' }}>SPLIT</span>
          </Link>
          
          <button 
            onClick={() => setIsCityModalOpen(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', 
              padding: '6px 12px', borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-primary)', cursor: 'pointer',
              fontSize: '0.9rem', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <MapPin size={16} color="var(--color-accent)" />
            {city}
            <ChevronDown size={16} color="var(--color-text-secondary)" />
          </button>
        </div>

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
                <button onClick={() => { logout(); navigate('/login'); }} style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', cursor: 'pointer', background: 'none', border: 'none' }}>Logout</button>
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

      <CitySelectorModal isOpen={isCityModalOpen} onClose={() => setIsCityModalOpen(false)} />
    </div>
  );
};
