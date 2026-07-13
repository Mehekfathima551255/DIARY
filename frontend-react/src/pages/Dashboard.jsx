import { useState, useEffect } from 'react';
import api from '../api';

const Dashboard = () => {
  const [memories, setMemories] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const memRes = await api.get('/memories/');
        setMemories(memRes.data);
        
        // Fetch AI Suggestion
        try {
          const sugRes = await api.get('/smart-ai/suggestions');
          setInsights(sugRes.data.result);
        } catch (e) {
          console.log("No AI suggestion right now");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="text-gradient stagger-1">Your Dashboard</h1>
      
      {insights && (
        <div className="glass-card stagger-2" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-primary)' }}>
          <h3 style={{ color: 'var(--accent-primary)' }}>AI Insight</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{insights}</p>
        </div>
      )}

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }} className="stagger-2">Recent Memories</h2>
      
      {loading ? (
        <p>Loading your diary...</p>
      ) : (
        <div className="grid-layout stagger-3">
          {memories.map(m => (
            <div key={m.id} className="glass-card">
              {m.image_url && (
                <img 
                  src={`http://localhost:8000${m.image_url}`} 
                  alt={m.title}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                />
              )}
              <h3>{m.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', marginBottom: '0.5rem' }}>
                {m.mood && `Mood: ${m.mood}`} {m.weather && `| ${m.weather}`}
              </p>
              <p style={{ color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m.content}
              </p>
            </div>
          ))}
          {memories.length === 0 && (
            <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
              <p>You haven't written anything yet. Time to start your journey!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
