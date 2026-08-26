import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Building2, Crosshair, Landmark, Castle, Building, Home, Tent } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';

interface CitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_CITIES = [
  { name: 'Bangalore', icon: Building2 },
  { name: 'Mumbai', icon: Building },
  { name: 'Gurugram', icon: Landmark },
  { name: 'Hyderabad', icon: Castle },
  { name: 'Delhi', icon: Landmark },
  { name: 'Chennai', icon: Tent },
  { name: 'Pune', icon: Home },
  { name: 'Ahmedabad', icon: Building2 },
  { name: 'Vizag', icon: MapPin },
  { name: 'Coimbatore', icon: Building },
];

export const CitySelectorModal: React.FC<CitySelectorModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [detecting, setDetecting] = useState(false);
  const setCity = useAppStore((state) => state.setCity);
  const activeCity = useAppStore((state) => state.city);

  const filteredCities = POPULAR_CITIES.filter((city) =>
    city.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (cityName: string) => {
    setCity(cityName);
    onClose();
  };

  const detectLocation = () => {
    setDetecting(true);
    // Simulate reverse geocoding to a random seeded city for the demo
    setTimeout(() => {
      setDetecting(false);
      handleSelect('Bangalore'); // Mock result
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              zIndex: 1000
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(30, 30, 35, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-2xl)',
              width: '90%', maxWidth: '800px',
              zIndex: 1001,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: 'var(--space-xl)' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} size={20} />
              <input
                type="text"
                placeholder="Search for your city"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--color-text-primary)',
                  fontSize: '1.1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Detect Location */}
            <button
              onClick={detectLocation}
              disabled={detecting}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
                color: 'var(--color-accent)', background: 'transparent',
                border: 'none', cursor: detecting ? 'wait' : 'pointer',
                fontSize: '1rem', fontWeight: 500, marginBottom: 'var(--space-2xl)',
                opacity: detecting ? 0.7 : 1
              }}
            >
              <Crosshair size={18} />
              {detecting ? 'Detecting your location...' : 'Detect my location'}
            </button>

            {/* Popular Cities Grid */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Popular Cities
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 'var(--space-md)'
              }}>
                {filteredCities.map((city) => {
                  const Icon = city.icon;
                  const isActive = activeCity === city.name;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={city.name}
                      onClick={() => handleSelect(city.name)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 'var(--space-sm)', padding: 'var(--space-md)',
                        background: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        color: isActive ? '#fff' : 'var(--color-text-primary)',
                        cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={32} opacity={isActive ? 1 : 0.8} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{city.name}</span>
                    </motion.button>
                  );
                })}
              </div>
              
              {filteredCities.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: 'var(--space-xl) 0' }}>
                  No popular cities found matching "{search}"
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSelect('All Cities')}
              style={{
                display: 'block', width: '100%', marginTop: 'var(--space-2xl)', padding: '12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)',
                cursor: 'pointer', fontSize: '1rem', transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              View All Cities
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
