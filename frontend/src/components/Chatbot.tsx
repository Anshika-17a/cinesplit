import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  isFallback?: boolean;
}

const TOPICS = [
  {
    keywords: ['cancel', 'cancellation', 'refund', 'money back'],
    response: "You can cancel upcoming bookings by navigating to 'My Bookings' and clicking Cancel. The refund will be automatically processed to your original payment method."
  },
  {
    keywords: ['unavailable', 'locked', 'taken', 'seat', 'grey'],
    response: "If a seat is unavailable, it means someone else has either already booked it, or is currently in the process of booking it. We temporarily lock seats for a few seconds to prevent double bookings!"
  },
  {
    keywords: ['pay', 'payment', 'card', 'upi', 'cash', 'checkout'],
    response: "We accept all major credit cards, UPI, and digital wallets. Payment is processed securely at the confirmation step."
  },
  {
    keywords: ['contact', 'support', 'help', 'email', 'phone', 'customer service'],
    response: "You can reach our support team at support@cinesplit.com or call 1-800-CINESPLIT."
  },
  {
    // Keeping this last acts as a general fallback for booking questions
    keywords: ['book', 'buy', 'ticket', 'reserve', 'booking'],
    response: "To book a seat, browse the cinemas on the home page, select a show, click the available seats on the map, and click 'Confirm Booking'."
  }
];

const SUGGESTIONS = [
  "How do I book a ticket?",
  "What is the refund policy?",
  "Why is a seat unavailable?"
];

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', role: 'bot', text: 'Hi there! Need help with your booking?' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (text: string) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    // Add user message
    const newMessages: Message[] = [...messages, { id: Date.now().toString(), role: 'user', text: userMsg }];
    setMessages(newMessages);
    setInput('');

    // Process bot response
    const lowerInput = userMsg.toLowerCase();
    let bestMatch = null;

    for (const topic of TOPICS) {
      if (topic.keywords.some(kw => lowerInput.includes(kw))) {
        bestMatch = topic;
        break;
      }
    }

    setTimeout(() => {
      if (bestMatch) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'bot', text: bestMatch.response }]);
      } else {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'bot', 
          text: "I'm not quite sure how to answer that. Try asking one of these questions instead:",
          isFallback: true
        }]);
      }
    }, 400); // slight delay to feel natural
  };

  return (
    <>
      <div style={{ position: 'fixed', bottom: 'var(--space-xl)', right: 'var(--space-xl)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              style={{
                width: '350px',
                height: '450px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-glass)',
                marginBottom: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Support Chat</h3>
                <button onClick={() => setIsOpen(false)} style={{ color: 'var(--color-text-secondary)', cursor: 'pointer' }}>✕</button>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: 'var(--space-md)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      padding: '0.5rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      maxWidth: '85%',
                      fontSize: '0.85rem'
                    }}>
                      {msg.text}
                    </div>
                    
                    {/* Render suggested chips if fallback */}
                    {msg.isFallback && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginTop: 'var(--space-sm)', alignItems: 'flex-start' }}>
                        {SUGGESTIONS.map((s, idx) => (
                          <button 
                            key={idx}
                            onClick={() => handleSend(s)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--color-accent)',
                              color: 'var(--color-accent)',
                              padding: '0.4rem 0.8rem',
                              borderRadius: 'var(--radius-full)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{ padding: 'var(--space-sm)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-sm)', background: 'var(--color-surface)' }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(input); }}
                  placeholder="Type your question..."
                  style={{
                    flex: 1,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0.5rem 1rem',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={() => handleSend(input)}
                  disabled={!input.trim()}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: input.trim() ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  ↑
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--color-accent)', color: 'white', fontSize: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 0 20px var(--color-border-glow)'
          }}
        >
          {isOpen ? '✕' : '💬'}
        </motion.button>
      </div>
    </>
  );
};
