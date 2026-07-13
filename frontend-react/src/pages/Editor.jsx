import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Editor = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('Happy');
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/memories/', {
        title,
        content,
        mood,
        favorite: false
      });

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/memories/${res.data.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Failed to save memory.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-gradient">Write a Memory</h1>
      
      <form onSubmit={handleSubmit} className="glass-card" style={{ marginTop: '2rem' }}>
        <div className="input-group">
          <label className="input-label">Title</label>
          <input 
            type="text" 
            className="input-field" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A beautiful day at the park..."
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Mood</label>
          <select 
            className="input-field" 
            value={mood}
            onChange={(e) => setMood(e.target.value)}
          >
            <option value="Happy">Happy 😊</option>
            <option value="Sad">Sad 😢</option>
            <option value="Excited">Excited 🤩</option>
            <option value="Anxious">Anxious 😰</option>
            <option value="Calm">Calm 😌</option>
          </select>
        </div>
        
        <div className="input-group">
          <label className="input-label">Image (Optional)</label>
          <input 
            type="file" 
            className="input-field" 
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Content</label>
          <textarea 
            className="input-field" 
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your thoughts here..."
            required
            style={{ resize: 'vertical' }}
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
          Save Memory
        </button>
      </form>
    </div>
  );
};

export default Editor;
