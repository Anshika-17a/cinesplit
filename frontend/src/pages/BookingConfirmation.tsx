import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { apiClient } from '../api/client';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';

interface TicketData {
  booking_id: number;
  status: string;
  total_amount: string;
  created_at: string;
  show_id: number;
  start_time: string;
  movie_title: string;
  poster_url: string;
  cinema_name: string;
  screen_name: string;
  seats: { seat_number: number; row_label: string }[];
}

export const BookingConfirmation: React.FC = () => {
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, qrRes] = await Promise.all([
          apiClient.get(`/bookings/${bookingId}/ticket`),
          apiClient.get(`/bookings/${bookingId}/qr`)
        ]);
        setTicket(ticketRes.data);
        setQrCode(qrRes.data.qr);
      } catch (err) {
        console.error('Failed to fetch ticket data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [bookingId]);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, { 
        backgroundColor: '#0f0f1a',
        pixelRatio: 2 
      });
      const link = document.createElement('a');
      const seatLabels = ticket?.seats.map(s => `${s.row_label}${s.seat_number}`).join('-') || 'ticket';
      link.download = `${ticket?.movie_title?.replace(/[^a-zA-Z0-9]/g, '_')}_${seatLabels}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate ticket image', err);
    } finally {
      setDownloading(false);
    }
  };

  const showDate = ticket ? new Date(ticket.start_time) : new Date();
  const seatLabels = ticket?.seats.map(s => `${s.row_label}${s.seat_number}`).sort() || [];

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--space-xl)', gap: 'var(--space-xl)', maxWidth: '480px', margin: '0 auto', padding: 'var(--space-xl) var(--space-md)' }}>
        
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ 
            width: '72px', height: '72px', borderRadius: '50%', 
            background: 'rgba(16, 185, 129, 0.15)', 
            color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', border: '2px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          ✓
        </motion.div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '4px' }}>Booking Confirmed!</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Your tickets are ready</p>
        </div>

        {loading ? (
          <Card style={{ width: '100%' }}><Skeleton height="350px" /></Card>
        ) : ticket ? (
          <>
            {/* ─── Downloadable Ticket Card ─── */}
            <div ref={ticketRef} style={{ width: '100%' }}>
              <div style={{
                background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '16px',
                overflow: 'hidden',
                position: 'relative',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {/* Perforated circles */}
                <div style={{ position: 'absolute', left: '-12px', top: '55%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />
                <div style={{ position: 'absolute', right: '-12px', top: '55%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#0f0f1a' }} />

                {/* Accent bar */}
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6)' }} />

                {/* Top section */}
                <div style={{ padding: '20px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#8b5cf6', letterSpacing: '0.2em', fontWeight: 700, marginBottom: '4px' }}>CINESPLIT</p>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{ticket.movie_title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{ticket.cinema_name} • {ticket.screen_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.15em' }}>BOOKING REF</p>
                      <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#8b5cf6', fontWeight: 600 }}>#{ticket.booking_id}</p>
                    </div>
                  </div>
                </div>

                {/* Dashed separator */}
                <div style={{ margin: '0 24px', borderTop: '2px dashed rgba(139,92,246,0.25)' }} />

                {/* Details grid */}
                <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.15em', marginBottom: '2px' }}>DATE</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{showDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.15em', marginBottom: '2px' }}>TIME</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{showDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.15em', marginBottom: '2px' }}>AMOUNT</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>₹{parseFloat(ticket.total_amount).toFixed(0)}</p>
                  </div>
                </div>

                {/* Seats */}
                <div style={{ padding: '0 24px 16px' }}>
                  <p style={{ fontSize: '9px', color: '#6b7280', letterSpacing: '0.15em', marginBottom: '6px' }}>SEATS</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {seatLabels.map(s => (
                      <span key={s} style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{s}</span>
                    ))}
                  </div>
                </div>

                {/* QR Code */}
                {qrCode && (
                  <div style={{ padding: '12px 24px 20px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', background: '#fff', padding: '8px', borderRadius: '8px' }}>
                      <img src={qrCode} alt="QR Code" style={{ width: '140px', height: '140px', display: 'block' }} />
                    </div>
                    <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '8px' }}>Scan at entry for verification</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              <Button onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Generating...' : '⬇ Download Ticket'}
              </Button>
              <Button variant="secondary" onClick={() => {
                const text = `I just booked ${ticket.movie_title} at ${ticket.cinema_name}! Seats: ${seatLabels.join(', ')}. Booking #${ticket.booking_id}`;
                if (navigator.share) {
                  navigator.share({ title: 'CineSplit Ticket', text }).catch(console.error);
                } else {
                  navigator.clipboard.writeText(text);
                  alert('Ticket info copied!');
                }
              }}>
                Share 🔗
              </Button>
              <Link to="/">
                <Button variant="secondary">Book Another</Button>
              </Link>
            </div>
          </>
        ) : (
          <Card style={{ width: '100%', textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <h2>Booking Confirmed!</h2>
            <p style={{ color: 'var(--color-text-secondary)' }}>Booking ID: #{bookingId}</p>
            <Link to="/bookings"><Button variant="secondary" style={{ marginTop: 'var(--space-md)' }}>View Bookings</Button></Link>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};
