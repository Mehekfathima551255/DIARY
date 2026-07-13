import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '1rem 0',
      marginBottom: '2rem',
      borderBottom: '1px solid var(--border-subtle)'
    }}>
      <Link to="/" style={{ fontSize: '1.5rem', fontWeight: 'bold' }} className="text-gradient">
        Smart Diary
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-primary)' }}>Dashboard</Link>
        <Link to="/write" style={{ color: 'var(--text-primary)' }}>Write</Link>
        <Link to="/chat" style={{ color: 'var(--text-primary)' }}>AI Chat</Link>
        <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 1rem', marginLeft: '1rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
