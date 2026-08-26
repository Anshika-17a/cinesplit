import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';

interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  genre: string;
  languages: string[];
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  movies?: Movie[];
}

const INITIAL_SUGGESTIONS = [
  "Recommend me something",
  "How do I cancel a booking?",
  "What's a fast-filling show?"
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'bot', text: "Hi! I'm CineSplit's AI assistant. I can help you pick a movie or answer questions about bookings and seats." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: trimmed };
    
    // Extract history to send (last few turns)
    const conversationHistory = messages.map(m => ({ sender: m.role, text: m.text }));
    
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiClient.post('/chatbot/message', {
        message: trimmed,
        conversationHistory
      });
      
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        text: res.data.text,
        movies: res.data.movies
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: err.response?.data?.text || "Sorry, I'm having trouble right now — try browsing by city and language instead."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 'var(--space-xl)', right: 'var(--space-xl)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{ width: '380px', height: '550px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-glass)', marginBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ padding: 'var(--space-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>CineSplit AI</h3>
              <button onClick={() => setIsOpen(false)} style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: 'var(--space-md)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {messages.map((msg, index) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: 'var(--color-text-primary)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', maxWidth: '85%', fontSize: '0.85rem', lineHeight: '1.4'
                  }}>
                    {msg.text}
                  </div>
                  
                  {/* Show initial suggestions if this is the first message */}
                  {index === 0 && messages.length === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', alignItems: 'flex-start' }}>
                      {INITIAL_SUGGESTIONS.map((s, idx) => (
                        <button key={idx} onClick={() => handleSend(s)} style={{ background: 'transparent', border: '1px solid var(--color-accent)', color: 'var(--color-accent)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.movies && msg.movies.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)', width: '100%', maxWidth: '85%' }}>
                      {msg.movies.map(movie => (
                        <div key={movie.id} style={{ display: 'flex', gap: 'var(--space-sm)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--color-border)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)' }}>
                          <img src={movie.posterUrl} alt={movie.title} style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <strong style={{ fontSize: '0.85rem', marginBottom: '2px' }}>{movie.title}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>{movie.genre}</span>
                            <button onClick={() => navigate(`/movies/${movie.id}/shows`)} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', cursor: 'pointer', alignSelf: 'flex-start' }}>Book Now</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--color-surface)', padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                  placeholder="Type a message..."
                  disabled={loading}
                  style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-full)', padding: '0.6rem 1rem', color: 'var(--color-text-primary)', fontSize: '0.85rem', outline: 'none' }}
                />
                <button 
                  onClick={() => handleSend(input)} 
                  disabled={!input.trim() || loading}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: input.trim() && !loading ? 'var(--color-accent)' : 'var(--color-surface)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--color-accent)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px var(--color-border-glow)' }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        )}
      </motion.button>
    </div>
  );
};
