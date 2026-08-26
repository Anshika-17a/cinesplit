import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Skeleton } from '../components/Skeleton';
import { apiClient } from '../api/client';
import { motion } from 'framer-motion';

interface Movie {
  id: number;
  title: string;
  poster_url: string;
  languages: string[];
  age_rating: string;
}

const MovieCard: React.FC<{ movie: Movie, selectedCity: string }> = ({ movie, selectedCity }) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      onClick={() => navigate(`/movies/${movie.id}/shows?city=${encodeURIComponent(selectedCity)}`)}
      style={{
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ 
        width: '100%', aspectRatio: '2/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-sm)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.4)', background: 'var(--color-surface)', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {imageError || !movie.poster_url ? (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{movie.title}</span>
          </div>
        ) : (
          <img 
            src={movie.poster_url} 
            alt={movie.title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {movie.title}
      </h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
        {movie.age_rating} • {movie.languages?.join(', ')}
      </p>
    </motion.div>
  );
};

export const Home: React.FC = () => {
  const [cities, setCities] = useState<string[]>(['All Cities']);
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const LANGUAGES = ['All', 'Hindi', 'English', 'Telugu', 'Tamil', 'Kannada'];
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch cities for dropdown
    apiClient.get('/cinemas').then(res => {
      const uniqueCities = Array.from(new Set(res.data.map((c: any) => c.city))) as string[];
      setCities(['All Cities', ...uniqueCities]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/movies?';
    if (selectedCity !== 'All Cities') url += `city=${encodeURIComponent(selectedCity)}&`;
    if (selectedLanguage !== 'All') url += `language=${encodeURIComponent(selectedLanguage)}`;
    
    apiClient.get(url)
      .then(res => setMovies(res.data))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, [selectedCity, selectedLanguage]);

  return (
    <PageTransition>
      {/* City Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-xl)' }}>
          <button style={{ color: 'var(--color-text-primary)', fontWeight: 600, borderBottom: '2px solid var(--color-accent)', paddingBottom: '0.2rem', background: 'transparent', cursor: 'pointer', fontSize: '1.25rem' }}>Movies</button>
        </div>
        <div>
          <select 
            value={selectedCity} 
            onChange={e => setSelectedCity(e.target.value)}
            style={{
              background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem', outline: 'none', cursor: 'pointer'
            }}
          >
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-2xl)', flexWrap: 'wrap' }}>
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            style={{
              background: selectedLanguage === lang ? 'var(--color-accent)' : 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: selectedLanguage === lang ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem 1rem',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {lang}
          </button>
        ))}
        <button style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'not-allowed' }} disabled>2D / 3D</button>
      </div>

      {/* Movie Grid */}
      <h1 style={{ marginBottom: 'var(--space-xl)', fontSize: '1.75rem' }}>Recommended Movies</h1>
      
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-xl)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <Skeleton height="330px" borderRadius="var(--radius-lg)" style={{ marginBottom: 'var(--space-sm)' }} />
              <Skeleton height="20px" width="80%" style={{ marginBottom: 'var(--space-xs)' }} />
              <Skeleton height="15px" width="50%" />
            </div>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div style={{ padding: 'var(--space-2xl)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)', opacity: 0.5 }}>🎬</div>
          <h3 style={{ marginBottom: 'var(--space-xs)' }}>No movies found</h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>Try changing your city or language filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-xl)' }}>
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} selectedCity={selectedCity} />
          ))}
        </div>
      )}
    </PageTransition>
  );
};
