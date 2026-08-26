import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';
import { useToastStore } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';

interface CastMember {
  actorName: string;
  characterName: string;
  photoUrl: string;
}

interface ShowData {
  show_id: number;
  title: string;
  description?: string;
  movie_cast?: CastMember[];
  genre?: string;
  age_rating?: string;
  languages?: string[];
  duration_minutes: number;
  start_time: string;
  price_per_seat: string;
  cinema_name: string;
  screen_name: string;
  trailer_url?: string;
}

interface Seat {
  show_seat_id: number;
  seat_id: number;
  seat_number: number;
  row_label: string;
  status: 'available' | 'locked' | 'booked';
}

interface SeatMapData {
  availableCount: number;
  totalSeats: number;
  seats: Seat[];
}

export const ShowDetail: React.FC = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [show, setShow] = useState<ShowData | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [isTrailerOpen, setIsTrailerOpen] = useState(true);

  const fetchSeatMap = async () => {
    try {
      const res = await apiClient.get(`/shows/${showId}/seats`);
      setSeatMap(res.data);
    } catch (e) {
      console.error('Failed to fetch seats', e);
    }
  };

  useEffect(() => {
    apiClient.get(`/shows/${showId}`).then(res => setShow(res.data)).catch(console.error);
    fetchSeatMap().finally(() => setLoading(false));

    const interval = setInterval(fetchSeatMap, 5000);
    return () => clearInterval(interval);
  }, [showId]);

  const toggleSeat = (showSeatId: number, status: string) => {
    if (status !== 'available') return;
    setSelectedSeats(prev => {
      const next = new Set(prev);
      if (next.has(showSeatId)) next.delete(showSeatId);
      else next.add(showSeatId);
      return next;
    });
  };

  const handleBook = async () => {
    if (selectedSeats.size === 0) return;
    setBooking(true);
    
    const seatIdArray = Array.from(selectedSeats);
    
    try {
      // 1. Create Order and Lock Seats
      const orderRes = await apiClient.post(`/shows/${showId}/create-order`, {
        seatIds: seatIdArray
      });
      
      const { orderId, amount, keyId } = orderRes.data;

      // 2. Configure Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: 'INR',
        name: 'CineSplit',
        description: `Booking for ${show?.title}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setBooking(true);
            addToast('Verifying payment...', 'info');
            // 3. Verify Payment and Commit Booking
            const verifyRes = await apiClient.post(`/shows/${showId}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              seatIds: seatIdArray
            });
            
            addToast('Payment and Booking successful!', 'success');
            navigate(`/bookings/${verifyRes.data.id}/confirmation`);
          } catch (verifyErr: any) {
            console.error('Verify err:', verifyErr);
            addToast(verifyErr.response?.data?.message || 'Payment verification failed.', 'error');
            fetchSeatMap();
            setSelectedSeats(new Set());
          } finally {
            setBooking(false);
          }
        },
        modal: {
          ondismiss: async function() {
            setBooking(false);
            addToast('Payment cancelled.', 'info');
            // Release locks
            try {
              await apiClient.post(`/shows/${showId}/release-locks`, { seatIds: seatIdArray });
            } catch (e) {
              console.error('Failed to release locks', e);
            }
          }
        },
        theme: {
          color: '#8b5cf6'
        }
      };

      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please disable ad-blockers and try again.');
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        addToast(response.error.description || 'Payment failed', 'error');
      });
      rzp.open();

    } catch (err: any) {
      if (err.response?.status === 409) {
        addToast(err.response.data.message || 'Some seats are no longer available.', 'error');
        const failedSeats = err.response.data.seats || [];
        setSelectedSeats(prev => {
          const next = new Set(prev);
          failedSeats.forEach((id: number) => next.delete(id));
          return next;
        });
        fetchSeatMap();
      } else {
        addToast(err.response?.data?.message || err.message || 'Failed to initialize payment', 'error');
      }
      setBooking(false);
    }
  };

  if (loading || !show || !seatMap) return (
    <PageTransition>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
        <div>
          <Skeleton height="40px" width="70%" style={{ marginBottom: 'var(--space-md)' }} />
          <Skeleton height="20px" width="40%" style={{ marginBottom: 'var(--space-xl)' }} />
          <Card><Skeleton height="400px" /></Card>
        </div>
        <Card><Skeleton height="200px" /></Card>
      </div>
    </PageTransition>
  );

  // Group seats by row
  const rows: Record<string, Seat[]> = {};
  seatMap.seats.forEach(seat => {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  });

  const totalPrice = selectedSeats.size * parseFloat(show.price_per_seat);

  return (
    <PageTransition>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'start' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
            <h1 style={{ fontSize: '2.5rem' }}>{show.title}</h1>
            {show.trailer_url && !isTrailerOpen && (
              <Button variant="secondary" onClick={() => setIsTrailerOpen(true)}>Watch Trailer</Button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
            <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>{show.age_rating}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{show.genre}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>•</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{show.duration_minutes} mins</span>
          </div>

          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {show.description}
          </p>

          {show.movie_cast && show.movie_cast.length > 0 && (
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
              <style>{`
                .cast-container {
                  display: flex;
                  overflow-x: auto;
                  gap: var(--space-md);
                  padding-bottom: var(--space-md);
                  scrollbar-width: none; /* Firefox */
                }
                .cast-container::-webkit-scrollbar {
                  display: none; /* Chrome/Safari */
                }
                @media (max-width: 768px) {
                  .cast-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                    overflow-x: visible;
                  }
                }
              `}</style>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-md)', letterSpacing: '0.05em' }}>Cast</h3>
              <div className="cast-container">
                {show.movie_cast.map((cast, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.05 }}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', 
                      textAlign: 'center', minWidth: '120px', padding: 'var(--space-sm)',
                      background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer'
                    }}
                  >
                    <img 
                      src={cast.photoUrl} 
                      alt={cast.actorName} 
                      style={{ 
                        width: '80px', height: '80px', objectFit: 'cover', 
                        borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)' 
                      }} 
                    />
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px', color: 'var(--color-text-primary)' }}>
                      {cast.actorName}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                      as {cast.characterName}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'var(--color-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{show.cinema_name} — {show.screen_name}</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{new Date(show.start_time).toLocaleString()}</p>
            </div>
          </div>

          <AnimatePresence>
            {isTrailerOpen && show.trailer_url && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 'var(--space-xl)' }}
              >
                <Card style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
                  <button 
                    onClick={() => setIsTrailerOpen(false)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, border: '1px solid rgba(255,255,255,0.2)' }}
                  >
                    ✕
                  </button>
                  {show.trailer_url.endsWith('.mp4') ? (
                    <video 
                      width="100%" 
                      height="400" 
                      src={show.trailer_url} 
                      controls 
                      autoPlay 
                      muted 
                      style={{ display: 'block', objectFit: 'cover', background: 'black' }}
                    />
                  ) : (
                    <iframe 
                      width="100%" 
                      height="400" 
                      src={show.trailer_url} 
                      title={`${show.title} Trailer`} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen 
                      sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
                      style={{ display: 'block' }}
                    ></iframe>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card style={{ padding: 'var(--space-xl)', overflowX: 'auto' }}>
            <div style={{ width: '100%', minWidth: '300px', height: '30px', borderTop: '4px solid var(--color-border)', borderRadius: '50% 50% 0 0', margin: '0 auto var(--space-xl)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.75rem', paddingTop: 'var(--space-xs)' }}>SCREEN</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', alignItems: 'center', minWidth: 'max-content' }}>
              {Object.keys(rows).sort().map(rowLabel => (
                <div key={rowLabel} style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                  <span style={{ width: '20px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{rowLabel}</span>
                  {rows[rowLabel].map(seat => {
                    const isSelected = selectedSeats.has(seat.show_seat_id);
                    let bg = 'var(--color-surface)';
                    if (seat.status !== 'available') bg = 'rgba(255,0,0,0.2)';
                    if (isSelected) bg = 'var(--color-accent)';

                    return (
                      <motion.div
                        key={seat.show_seat_id}
                        whileHover={seat.status === 'available' ? { scale: 1.1 } : {}}
                        whileTap={seat.status === 'available' ? { scale: 0.9 } : {}}
                        onClick={() => toggleSeat(seat.show_seat_id, seat.status)}
                        style={{
                          width: '32px', height: '32px',
                          background: bg,
                          border: isSelected ? 'none' : '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: seat.status === 'available' ? 'pointer' : 'not-allowed',
                          fontSize: '0.75rem',
                          opacity: seat.status === 'available' ? 1 : 0.5
                        }}
                      >
                        {seat.seat_number}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ position: 'sticky', top: '100px' }}>
          <Card>
            <h3 style={{ marginBottom: 'var(--space-md)' }}>Booking Summary</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Selected Seats:</span>
              <span>{selectedSeats.size}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Total Price:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{totalPrice.toFixed(2)}</span>
            </div>
            <Button 
              fullWidth 
              disabled={selectedSeats.size === 0 || booking} 
              onClick={handleBook}
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};
