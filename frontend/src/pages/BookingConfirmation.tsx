import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams();

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
        <Card style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-lg)', fontSize: '2rem'
          }}>
            ✓
          </div>
          <h2 style={{ marginBottom: 'var(--space-xs)' }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Your booking ID is <strong style={{ color: 'var(--color-text-primary)' }}>#{bookingId}</strong>.
          </p>
          
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Link to="/bookings">
              <Button variant="secondary">View My Bookings</Button>
            </Link>
            <Link to="/">
              <Button>Book Another</Button>
            </Link>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};
