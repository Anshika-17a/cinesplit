import React, { useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';
import { useToastStore } from '../hooks/useToast';
import { motion } from 'framer-motion';

export const PlaceholderPage: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const { addToast } = useToastStore();

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 'var(--space-xs)' }}>
            Design System <span style={{ color: 'var(--color-accent)' }}>Preview</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Confirming the dark glassmorphism direction before building screens.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          <Card interactive>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Interactive Glass Card</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Hover over this card to see the smooth scale and lift animation powered by framer-motion.
            </p>
            <Button fullWidth onClick={() => addToast('Action completed successfully!', 'success')}>
              Trigger Success Toast
            </Button>
          </Card>

          <Card>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Static Elements</h3>
            <Input label="Email Address" placeholder="hello@cinesplit.com" />
            <Input label="Password" type="password" error="Password is too short" />
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <Button variant="secondary" onClick={() => setModalOpen(true)}>Open Modal</Button>
              <Button variant="ghost" onClick={() => addToast('Seat A5 was just booked by someone else.', 'error')}>
                Error Toast
              </Button>
            </div>
          </Card>

          <Card>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Seat Selection Pulse</h3>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {[1, 2, 3].map(seat => (
                <motion.div
                  key={seat}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  animate={seat === 2 ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0px var(--color-accent)', '0 0 15px var(--color-accent)', '0 0 0px var(--color-accent)'] } : {}}
                  transition={seat === 2 ? { repeat: Infinity, duration: 2 } : {}}
                  style={{
                    width: '40px', height: '40px', 
                    background: seat === 2 ? 'var(--color-accent)' : 'var(--color-surface)',
                    border: seat === 2 ? 'none' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
                  }}
                >
                  A{seat}
                </motion.div>
              ))}
            </div>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Loading state:</p>
              <Spinner />
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Confirm Booking">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Are you sure you want to book these seats? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={() => setModalOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </PageTransition>
  );
};
