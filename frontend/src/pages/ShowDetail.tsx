import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { apiClient } from '../api/client';
import { useToastStore } from '../hooks/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

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

/* ─── SVG Seat Icon ─── */
const SeatIcon: React.FC<{ fill: string; stroke: string; opacity?: number }> = ({ fill, stroke, opacity = 1 }) => (
  <svg width="28" height="28" viewBox="0 0 32 32" style={{ opacity }}>
    <path d="M8 6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V18H8V6Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
    <path d="M6 16C6 14.8954 6.89543 14 8 14V22H6V16Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
    <path d="M26 16C26 14.8954 25.1046 14 24 14V22H26V16Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
    <path d="M7 22H25V25C25 26.1046 24.1046 27 23 27H9C7.89543 27 7 26.1046 7 25V22Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
  </svg>
);

const SNACK_OPTIONS = [
  { id: 'popcorn', name: 'Popcorn (Large)', price: 250, icon: '🍿' },
  { id: 'drink', name: 'Cold Drink', price: 120, icon: '🥤' },
  { id: 'nachos', name: 'Cheese Nachos', price: 200, icon: '🧀' },
  { id: 'combo', name: 'Combo (Popcorn + Drink)', price: 350, icon: '🎬' }
];

export const ShowDetail: React.FC = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [show, setShow] = useState<ShowData | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<Set<number>>(new Set());
  const [selectedSnacks, setSelectedSnacks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const updateSnackQty = (id: string, delta: number) => {
    setSelectedSnacks(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[id];
      } else {
        copy[id] = next;
      }
      return copy;
    });
  };

  const fetchSeatMap = async () => {
    try {
      const res = await apiClient.get(`/shows/${showId}/seats`);
      setSeatMap(res.data);
      // Auto-deselect any seats that got locked or booked by another user
      const unavailableIds = new Set(
        res.data.seats.filter((s: Seat) => s.status !== 'available').map((s: Seat) => s.show_seat_id)
      );
      setSelectedSeats(prev => {
        let changed = false;
        const next = new Set(prev);
        for (const id of prev) {
          if (unavailableIds.has(id)) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    } catch (e) {
      console.error('Failed to fetch seats', e);
    }
  };

  useEffect(() => {
    apiClient.get(`/shows/${showId}`).then(res => setShow(res.data)).catch(console.error);
    fetchSeatMap().finally(() => setLoading(false));

    const interval = setInterval(fetchSeatMap, 2500);
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
    const formattedSnacks = SNACK_OPTIONS
      .filter(s => (selectedSnacks[s.id] || 0) > 0)
      .map(s => ({
        name: s.name,
        price: s.price,
        quantity: selectedSnacks[s.id]
      }));
    
    try {
      const orderRes = await apiClient.post(`/shows/${showId}/create-order`, {
        seatIds: seatIdArray,
        snacks: formattedSnacks
      });
      
      const { orderId, amount, keyId } = orderRes.data;

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
            const verifyRes = await apiClient.post(`/shows/${showId}/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              seatIds: seatIdArray,
              snacks: formattedSnacks
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
            try {
              await apiClient.post(`/shows/${showId}/release-locks`, { seatIds: seatIdArray });
            } catch (e) {
              console.error('Failed to release locks', e);
            }
          }
        },
        theme: {
          color: '#E11D48'
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
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'var(--space-xl)' }}>
        <Skeleton height="40px" width="60%" style={{ marginBottom: 'var(--space-md)' }} />
        <Skeleton height="300px" style={{ marginBottom: 'var(--space-md)' }} />
        <Skeleton height="180px" />
      </div>
    </PageTransition>
  );

  // Group seats by row
  const rows: Record<string, Seat[]> = {};
  seatMap.seats.forEach(seat => {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  });

  const sortedRowLabels = Object.keys(rows).sort();
  const seatsTotal = selectedSeats.size * parseFloat(show.price_per_seat);
  const snackTotal = SNACK_OPTIONS.reduce((sum, s) => sum + (s.price * (selectedSnacks[s.id] || 0)), 0);
  const totalPrice = seatsTotal + snackTotal;
  const showDate = new Date(show.start_time);
  const selectedSeatLabels = seatMap.seats
    .filter(s => selectedSeats.has(s.show_seat_id))
    .map(s => `${s.row_label}${s.seat_number}`)
    .sort();

  const selectedSnacksSummary = SNACK_OPTIONS
    .filter(s => (selectedSnacks[s.id] || 0) > 0)
    .map(s => `${s.name} x${selectedSnacks[s.id]}`)
    .join(', ');

  // Split seats into blocks with aisle gaps
  const getBlocks = (rowSeats: Seat[]) => {
    const sorted = [...rowSeats].sort((a, b) => a.seat_number - b.seat_number);
    const total = sorted.length;
    if (total <= 4) return [sorted];
    const blockSize = Math.ceil(total / 3);
    const blocks: Seat[][] = [];
    for (let i = 0; i < total; i += blockSize) {
      blocks.push(sorted.slice(i, i + blockSize));
    }
    return blocks;
  };

  return (
    <PageTransition>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 var(--space-md)' }}>

        {/* ─── Header ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-primary)' }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{show.title}</h1>
              {show.trailer_url && (
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(!isTrailerOpen)}
                  style={{
                    background: isTrailerOpen ? 'rgba(225,29,72,0.2)' : 'rgba(225,29,72,0.15)',
                    border: `1px solid ${isTrailerOpen ? '#E11D48' : 'rgba(225,29,72,0.4)'}`,
                    color: isTrailerOpen ? '#fb7185' : '#f43f5e',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isTrailerOpen ? '✕ Close Trailer' : '▶ Watch Trailer'}
                </button>
              )}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {show.cinema_name} • {show.screen_name} • {showDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SeatIcon fill="var(--color-accent)" stroke="var(--color-accent)" />
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Seats</span>
          </div>
        </div>

        {/* ─── Expandable Trailer Video Player ─── */}
        <AnimatePresence>
          {isTrailerOpen && show.trailer_url && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                position: 'relative',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid rgba(225,29,72,0.3)',
                background: '#000',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsTrailerOpen(false)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 10,
                    background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  ✕
                </button>

                {show.trailer_url.endsWith('.mp4') ? (
                  <video
                    width="100%"
                    height="360"
                    src={show.trailer_url}
                    controls
                    autoPlay
                    style={{ display: 'block', objectFit: 'cover', background: '#000' }}
                  />
                ) : (
                  <iframe
                    width="100%"
                    height="360"
                    src={show.trailer_url.includes('autoplay') ? show.trailer_url : `${show.trailer_url}${show.trailer_url.includes('?') ? '&' : '?'}autoplay=1`}
                    title={`${show.title} Trailer`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-same-origin allow-scripts allow-presentation allow-popups"
                    style={{ display: 'block', border: 'none' }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Screen Indicator ─── */}
        <div style={{ position: 'relative', marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>
          <div style={{
            width: '80%', height: '6px', margin: '0 auto',
            borderRadius: '0 0 50% 50%',
            background: 'linear-gradient(90deg, transparent 0%, var(--color-accent) 30%, #fff 50%, var(--color-accent) 70%, transparent 100%)',
            boxShadow: '0 4px 30px rgba(225, 29, 72, 0.5), 0 2px 15px rgba(225, 29, 72, 0.3)'
          }} />
          <div style={{
            width: '60%', height: '40px', margin: '-2px auto 0',
            background: 'linear-gradient(to bottom, rgba(225, 29, 72, 0.08) 0%, transparent 100%)',
            borderRadius: '0 0 50% 50%'
          }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', letterSpacing: '0.3em', textTransform: 'uppercase', position: 'relative', top: '-10px' }}>Screen This Way</span>
        </div>

        {/* ─── Seat Grid ─── */}
        <div style={{ overflowX: 'auto', paddingBottom: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center', minWidth: 'max-content' }}>
            {sortedRowLabels.map(rowLabel => {
              const blocks = getBlocks(rows[rowLabel]);
              return (
                <div key={rowLabel} style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                  {/* Row label LEFT */}
                  <span style={{ width: '22px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{rowLabel}</span>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    {blocks.map((block, bIdx) => (
                      <div key={bIdx} style={{ display: 'flex', gap: '4px' }}>
                        {block.map(seat => {
                          const isSelected = selectedSeats.has(seat.show_seat_id);
                          const isBooked = seat.status !== 'available';
                          const isLocked = seat.status === 'locked';

                          let fill = 'transparent';
                          let stroke = 'rgba(255,255,255,0.25)';
                          let opacity = 1;

                          if (seat.status === 'booked') {
                            fill = 'rgba(255,255,255,0.05)';
                            stroke = 'rgba(255,255,255,0.08)';
                            opacity = 0.35;
                          } else if (isLocked) {
                            fill = 'rgba(239,68,68,0.15)';
                            stroke = 'rgba(239,68,68,0.4)';
                            opacity = 0.6;
                          }
                          if (isSelected) {
                            fill = 'var(--color-accent)';
                            stroke = 'var(--color-accent)';
                          }

                          return (
                            <motion.div
                              key={seat.show_seat_id}
                              whileHover={!isBooked ? { scale: 1.15, y: -2 } : {}}
                              whileTap={!isBooked ? { scale: 0.9 } : {}}
                              onClick={() => toggleSeat(seat.show_seat_id, seat.status)}
                              style={{
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title={
                                isLocked 
                                  ? `${seat.row_label}${seat.seat_number} (In checkout by someone else)`
                                  : isBooked 
                                  ? `${seat.row_label}${seat.seat_number} (Booked)` 
                                  : `${seat.row_label}${seat.seat_number}`
                              }
                            >
                              <SeatIcon fill={fill} stroke={stroke} opacity={opacity} />
                              {isSelected && (
                                <span style={{ position: 'absolute', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                                  {seat.seat_number}
                                </span>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Row label RIGHT */}
                  <span style={{ width: '22px', textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{rowLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Legend ─── */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--space-xl)',
          padding: 'var(--space-md) 0', marginBottom: 'var(--space-lg)',
          borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SeatIcon fill="transparent" stroke="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SeatIcon fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" opacity={0.4} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Booked</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SeatIcon fill="var(--color-accent)" stroke="var(--color-accent)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Selected</span>
          </div>
        </div>

        {/* ─── Optional Snacks Add-on Section ─── */}
        <AnimatePresence>
          {selectedSeats.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🍿</span> Add Snacks & Drinks <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 400 }}>(Optional)</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Delivered to your seat before showtime</p>
                </div>
                {snackTotal > 0 && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                    +₹{snackTotal}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-sm)' }}>
                {SNACK_OPTIONS.map(snack => {
                  const qty = selectedSnacks[snack.id] || 0;
                  return (
                    <div
                      key={snack.id}
                      style={{
                        background: qty > 0 ? 'rgba(225,29,72,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${qty > 0 ? 'var(--color-accent)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>{snack.icon}</span>
                        <div>
                          <p style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>{snack.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>₹{snack.price}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => updateSnackQty(snack.id, -1)}
                          disabled={qty === 0}
                          style={{
                            width: '26px', height: '26px', borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                            background: qty > 0 ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: qty > 0 ? '#fff' : 'var(--color-text-secondary)',
                            cursor: qty > 0 ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: 700
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: qty > 0 ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSnackQty(snack.id, 1)}
                          style={{
                            width: '26px', height: '26px', borderRadius: '4px',
                            border: 'none',
                            background: 'var(--color-accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: 700
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Ticket Preview Card ─── */}
        <AnimatePresence>
          {selectedSeats.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{ marginBottom: 'var(--space-lg)' }}
            >
              <div style={{
                background: 'linear-gradient(135deg, rgba(225,29,72,0.15) 0%, rgba(30,30,40,0.9) 100%)',
                border: '1px solid rgba(225,29,72,0.3)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Perforated edge circles */}
                <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-bg)' }} />
                <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-bg)' }} />

                {/* Dashed separator */}
                <div style={{ position: 'absolute', left: '20px', right: '20px', top: '50%', borderTop: '2px dashed rgba(225,29,72,0.3)' }} />

                {/* Top half */}
                <div style={{ padding: 'var(--space-lg) var(--space-xl)', paddingBottom: 'var(--space-lg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>{show.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{show.cinema_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', letterSpacing: '0.1em' }}>TICKET</p>
                      <p style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-accent)' }}>#{showId?.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom half */}
                <div style={{ padding: 'var(--space-lg) var(--space-xl)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
                  <div>
                    <p style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', letterSpacing: '0.1em', marginBottom: '2px' }}>DATE</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{showDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', letterSpacing: '0.1em', marginBottom: '2px' }}>TIME</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{showDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6rem', color: 'var(--color-text-secondary)', letterSpacing: '0.1em', marginBottom: '2px' }}>SEATS</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-accent)' }}>{selectedSeatLabels.join(', ')}</p>
                  </div>
                </div>

                {/* Snacks in ticket preview */}
                {selectedSnacksSummary && (
                  <div style={{ padding: '0 var(--space-xl) var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.8rem' }}>🍿</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>Snacks:</strong> {selectedSnacksSummary}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Bottom Action Bar ─── */}
        <div style={{
          position: 'sticky', bottom: 0,
          padding: 'var(--space-md) 0 var(--space-lg)',
          background: 'linear-gradient(to top, var(--color-bg) 80%, transparent)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <div>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                {selectedSeats.size} {selectedSeats.size === 1 ? 'seat' : 'seats'} selected
              </span>
              {snackTotal > 0 && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginLeft: '6px' }}>
                  (Seats: ₹{seatsTotal.toFixed(0)} + Snacks: ₹{snackTotal})
                </span>
              )}
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>
              ₹{totalPrice.toFixed(0)}
            </span>
          </div>
          <motion.button
            whileHover={selectedSeats.size > 0 && !booking ? { scale: 1.02 } : {}}
            whileTap={selectedSeats.size > 0 && !booking ? { scale: 0.98 } : {}}
            onClick={handleBook}
            disabled={selectedSeats.size === 0 || booking}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              background: selectedSeats.size > 0 && !booking
                ? 'linear-gradient(135deg, #F43F5E 0%, #E11D48 50%, #BE123C 100%)'
                : 'var(--color-surface)',
              color: selectedSeats.size > 0 && !booking ? '#fff' : 'var(--color-text-secondary)',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              cursor: selectedSeats.size > 0 && !booking ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: selectedSeats.size > 0 ? '0 4px 20px rgba(225, 29, 72, 0.4)' : 'none'
            }}
          >
            {booking ? 'Processing...' : selectedSeats.size > 0 ? `Proceed to Pay • ₹${totalPrice.toFixed(0)}` : 'Select your seats'}
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
};
