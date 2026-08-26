import React, { useEffect, useState } from 'react';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { apiClient } from '../api/client';
import { useToastStore } from '../hooks/useToast';

interface BookingSeat {
  id: number;
  seat_number: number;
  row_label: string;
}

interface Booking {
  booking_id: number;
  booking_status: string;
  total_amount: string;
  created_at: string;
  show_id: number;
  start_time: string;
  movie_title: string;
  cinema_name: string;
  screen_name: string;
  seats: BookingSeat[];
  snacks?: { name: string; price: number; quantity: number }[];
}

import { useNavigate } from 'react-router-dom';

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { addToast } = useToastStore();

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings/me');
      setUpcoming(res.data.upcoming);
      setPast(res.data.past);
    } catch (e) {
      console.error(e);
      addToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await apiClient.delete(`/bookings/${bookingToCancel}`);
      addToast('Booking cancelled successfully', 'success');
      setCancelModalOpen(false);
      fetchBookings();
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Failed to cancel', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <PageTransition>
      <h1 style={{ marginBottom: 'var(--space-xl)' }}>My Bookings</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {[1, 2, 3].map(i => <Card key={i}><Skeleton height="100px" /></Card>)}
      </div>
    </PageTransition>
  );

  const displayBookings = tab === 'upcoming' ? upcoming : past;

  return (
    <PageTransition>
      <h1 style={{ marginBottom: 'var(--space-xl)' }}>My Bookings</h1>
      
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <button 
          onClick={() => setTab('upcoming')}
          style={{ 
            padding: '0.5rem 1rem', 
            background: tab === 'upcoming' ? 'var(--color-surface)' : 'transparent',
            color: tab === 'upcoming' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer'
          }}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setTab('past')}
          style={{ 
            padding: '0.5rem 1rem', 
            background: tab === 'past' ? 'var(--color-surface)' : 'transparent',
            color: tab === 'past' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer'
          }}
        >
          Past
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {displayBookings.length === 0 ? (
          <div style={{ padding: 'var(--space-2xl)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)', opacity: 0.5 }}>🎟️</div>
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>No {tab} bookings</h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>You don't have any {tab} bookings yet. Head to the home page to browse shows!</p>
          </div>
        ) : (
          displayBookings.map(b => (
            <Card key={b.booking_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: 'var(--space-xs)' }}>{b.movie_title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                  {new Date(b.start_time).toLocaleString()} • {b.cinema_name} ({b.screen_name})
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: 'var(--space-xs)' }}>
                  Seats: {b.seats.map(s => `${s.row_label}${s.seat_number}`).join(', ')} | Total: ₹{b.total_amount}
                </p>
                {b.snacks && b.snacks.length > 0 && (
                  <p style={{ color: '#f472b6', fontSize: '0.8rem', marginTop: '4px' }}>
                    🍿 Snacks: {b.snacks.map(s => `${s.name} x${s.quantity}`).join(', ')}
                  </p>
                )}
                {b.booking_status === 'cancelled' && (
                  <span style={{ display: 'inline-block', marginTop: 'var(--space-sm)', color: 'var(--color-danger)', fontSize: '0.75rem', padding: '0.1rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                    CANCELLED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {b.booking_status !== 'cancelled' && (
                  <>
                    <Button variant="secondary" onClick={() => navigate(`/bookings/${b.booking_id}/confirmation`)}>🎟 Ticket</Button>
                    <Button variant="secondary" onClick={() => {
                      const text = `I'm going to see ${b.movie_title} at ${b.cinema_name} on ${new Date(b.start_time).toLocaleString()}! Join me!`;
                      if (navigator.share) {
                        navigator.share({ title: 'My Ticket', text }).catch(console.error);
                      } else {
                        navigator.clipboard.writeText(text);
                        addToast('Ticket info copied to clipboard!', 'info');
                      }
                    }}>Share 🔗</Button>
                  </>
                )}
                {tab === 'upcoming' && b.booking_status !== 'cancelled' && (
                  <Button variant="ghost" onClick={() => { setBookingToCancel(b.booking_id); setCancelModalOpen(true); }} style={{ color: 'var(--color-danger)' }}>
                    Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Booking">
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Are you sure you want to cancel this booking? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>Keep Booking</Button>
          <Button variant="secondary" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleCancel} disabled={cancelling}>
            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
};
