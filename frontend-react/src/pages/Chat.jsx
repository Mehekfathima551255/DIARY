import { useState } from 'react';
import api from '../api';

const Chat = () => {
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hello! Ask me anything about your past memories.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/ask', { query: userMsg });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.result }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error while searching your diary.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-gradient">Chat with your Diary</h1>
      
      <div className="glass-card" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', height: '60vh' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              background: msg.sender === 'user' ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
              padding: '0.8rem 1.2rem',
              borderRadius: '12px',
              maxWidth: '80%',
              border: msg.sender === 'ai' ? '1px solid var(--border-subtle)' : 'none'
            }}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)' }}>
              AI is thinking...
            </div>
          )}
        </div>
        
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What was I worried about last month?"
            style={{ marginBottom: 0 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
