import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { apiClient } from '../api/client';
import { useToastStore } from '../hooks/useToast';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/auth/signup', { name, email, password });
      addToast('Account created! Please log in.', 'success');
      navigate('/login');
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-2xl)' }}>
        <Card style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ marginBottom: 'var(--space-md)', fontSize: '1.5rem', textAlign: 'center' }}>Create Account</h2>
          <form onSubmit={handleSignup}>
            <Input 
              label="Name" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
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
              {loading ? 'Creating...' : 'Sign Up'}
            </Button>
          </form>
          <p style={{ marginTop: 'var(--space-md)', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--color-accent)' }}>Login</Link>
          </p>
        </Card>
      </div>
    </PageTransition>
  );
};
