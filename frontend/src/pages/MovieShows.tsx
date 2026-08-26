import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { apiClient } from '../api/client';

interface Show {
  show_id: number;
  start_time: string;
  movie_title: string;
  cinema_name: string;
  cinema_address: string;
  screen_name: string;
  price_per_seat: string;
}

export const MovieShows: React.FC = () => {
  const { movieId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const city = searchParams.get('city') || 'All Cities';

  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    let url = `/movies/${movieId}/shows`;
    if (city !== 'All Cities') url += `?city=${encodeURIComponent(city)}`;
    
    apiClient.get(url)
      .then(res => setShows(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movieId, city]);

  return (
    <PageTransition>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', marginBottom: 'var(--space-md)' }}
        >
          ← Back to Movies
        </button>
        <h1 style={{ fontSize: '2rem' }}>{shows[0]?.movie_title || 'Available Shows'}</h1>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {[1, 2, 3].map(i => <Card key={i}><Skeleton height="100px" /></Card>)}
        </div>
      ) : shows.length === 0 ? (
        <div style={{ padding: 'var(--space-2xl)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>No shows found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>There are no upcoming shows for this movie in the selected city.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
          {shows.map(show => (
            <Card key={show.show_id} interactive onClick={() => navigate(`/shows/${show.show_id}`)}>
              <h4 style={{ marginBottom: '0.2rem' }}>{show.cinema_name}</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-sm)' }}>
                {show.cinema_address}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                {new Date(show.start_time).toLocaleString()} • {show.screen_name}
              </p>
              <p style={{ marginTop: 'var(--space-xs)', color: 'var(--color-success)', fontWeight: 500 }}>
                ₹{show.price_per_seat}
              </p>
            </Card>
          ))}
        </div>
      )}
    </PageTransition>
  );
};
