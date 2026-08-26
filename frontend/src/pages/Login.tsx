import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useToastStore } from '../hooks/useToast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const { addToast } = useToastStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      addToast('Successfully logged in!', 'success');
      navigate('/');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
        <Card style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>
          <form onSubmit={handleLogin}>
            <Input 
              label="Email" 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <Input 
              label="Password" 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <Button fullWidth type="submit" disabled={loading} style={{ marginTop: 'var(--space-md)' }}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
          <p style={{ marginTop: 'var(--space-md)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Don't have an account? <Link to="/signup" style={{ color: 'var(--color-accent)' }}>Sign up</Link>
          </p>
        </Card>
      </div>
    </PageTransition>
  );
};
