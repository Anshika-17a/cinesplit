import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';
import { apiClient } from '../api/client';
import { useAppStore } from '../hooks/useAppStore';
import { Info } from 'lucide-react';

interface Show {
  show_id: number;
  start_time: string;
  price_per_seat: string;
  cinema_name: string;
  cinema_address: string;
  screen_name: string;
  total_seats: number;
  available_seats: number;
  movie_title: string;
  languages: string[];
  age_rating: string;
  duration_minutes: number;
  genre: string;
}

export const MovieShows: React.FC = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const city = useAppStore((state) => state.city);

  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date selection state
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);

  // Filters state
  const [languageFormat, setLanguageFormat] = useState('All');
  const [sortBy, setSortBy] = useState('time');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('date', selectedDate.toISOString().split('T')[0]);
    if (city && city !== 'All Cities' && city !== 'undefined') {
      params.append('city', city);
    }
    const url = `/movies/${movieId}/shows?${params.toString()}`;
    
    apiClient.get(url)
      .then(res => setShows(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movieId, city, selectedDate]);

  // Group shows by cinema
  const cinemasMap: Record<string, { address: string, shows: Show[] }> = {};
  
  // Apply frontend filters
  const filteredShows = shows.filter(s => {
    if (languageFormat !== 'All' && !s.languages.includes(languageFormat)) return false;
    return true;
  });
  
  // Sort
  filteredShows.sort((a, b) => {
    if (sortBy === 'time') return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (sortBy === 'price-low') return parseFloat(a.price_per_seat) - parseFloat(b.price_per_seat);
    if (sortBy === 'price-high') return parseFloat(b.price_per_seat) - parseFloat(a.price_per_seat);
    return 0;
  });

  filteredShows.forEach(s => {
    if (!cinemasMap[s.cinema_name]) {
      cinemasMap[s.cinema_name] = { address: s.cinema_address, shows: [] };
    }
    cinemasMap[s.cinema_name].shows.push(s);
  });

  const movieInfo = shows[0]; // Extract movie details from the first show

  return (
    <PageTransition>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', marginBottom: 'var(--space-md)' }}
        >
          ← Back to Movies
        </button>
        
        {loading && !movieInfo ? (
          <div>
            <Skeleton height="40px" width="50%" style={{ marginBottom: 'var(--space-sm)' }} />
            <Skeleton height="20px" width="30%" />
          </div>
        ) : movieInfo ? (
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>
              {movieInfo.movie_title} - ({movieInfo.languages.join(', ')})
            </h1>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.2rem 0.6rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>{movieInfo.age_rating}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{movieInfo.genre}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>•</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{movieInfo.duration_minutes} mins</span>
            </div>
          </div>
        ) : (
          <h1 style={{ fontSize: '2rem' }}>No Data Available</h1>
        )}
      </div>

      {/* Date Strip */}
      <div className="date-strip" style={{ display: 'flex', gap: 'var(--space-md)', overflowX: 'auto', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-xl)', scrollbarWidth: 'none' }}>
        <style>{`.date-strip::-webkit-scrollbar { display: none; }`}</style>
        {dates.map((d, i) => {
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
          const dateNum = d.getDate();
          const monthName = d.toLocaleDateString('en-US', { month: 'short' });
          
          return (
            <button
              key={i}
              onClick={() => setSelectedDate(d)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px',
                padding: 'var(--space-sm) var(--space-md)', cursor: 'pointer',
                background: isSelected ? 'var(--color-accent)' : 'var(--color-surface)',
                border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
                color: isSelected ? '#fff' : 'var(--color-text-primary)'
              }}
            >
              <span style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '2px' }}>{dayName}</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{dateNum}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{monthName}</span>
            </button>
          );
        })}
      </div>

      {/* Filters & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)', background: 'var(--color-surface)', padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <select 
            value={languageFormat}
            onChange={(e) => setLanguageFormat(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-md)', outline: 'none' }}
          >
            <option value="All">All Languages - 2D</option>
            <option value="Hindi">Hindi - 2D</option>
            <option value="English">English - 2D</option>
            <option value="Telugu">Telugu - 2D</option>
            <option value="Tamil">Tamil - 2D</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 'var(--radius-md)', outline: 'none' }}
          >
            <option value="time">Sort by: Time</option>
            <option value="price-low">Sort by: Price (Low to High)</option>
            <option value="price-high">Sort by: Price (High to Low)</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Available</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-warning)' }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Fast Filling</span>
          </div>
        </div>
      </div>

      {/* Cinemas List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {[1, 2, 3].map(i => <Card key={i}><Skeleton height="100px" /></Card>)}
        </div>
      ) : Object.keys(cinemasMap).length === 0 ? (
        <div style={{ padding: 'var(--space-2xl)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>No shows found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>There are no upcoming shows for this date/filters in {city}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {Object.entries(cinemasMap).map(([cinemaName, data]) => (
            <div key={cinemaName} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{cinemaName}</h3>
                <span title={data.address}>
                  <Info size={16} color="var(--color-text-secondary)" style={{ cursor: 'help' }} />
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>{data.address}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                {data.shows.map(show => {
                  const dateObj = new Date(show.start_time);
                  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  
                  // Fast filling threshold: < 20% seats available
                  const percentAvailable = show.total_seats > 0 ? (show.available_seats / show.total_seats) : 1;
                  const isFastFilling = percentAvailable < 0.20;
                  const borderColor = isFastFilling ? 'var(--color-warning)' : 'var(--color-success)';
                  const textColor = isFastFilling ? 'var(--color-warning)' : 'var(--color-success)';

                  return (
                    <button
                      key={show.show_id}
                      onClick={() => navigate(`/shows/${show.show_id}`)}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${borderColor}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: 'var(--space-sm) var(--space-lg)',
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = `rgba(${isFastFilling ? '245,158,11' : '16,185,129'}, 0.1)` }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ color: textColor, fontWeight: 600, fontSize: '0.9rem' }}>{timeStr}</span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.7rem', marginTop: '2px' }}>{show.screen_name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
};
