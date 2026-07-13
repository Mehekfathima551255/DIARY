import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, register } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLoginView) {
                await login(email, password);
            } else {
                if (!name.trim()) {
                    throw new Error("Name is required");
                }
                await register(name, email, password);
            }
        } catch (err) {
            setError(err.message || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <div className="card glass" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <i className='bx bxs-book-heart' style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: '0.5rem' }}></i>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Smart Diary
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {isLoginView ? 'Welcome back! Please login.' : 'Create your account.'}
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid var(--danger)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {!isLoginView && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required={!isLoginView}
                            />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={4}
                        />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? <i className='bx bx-loader-alt bx-spin'></i> : null}
                        {isLoginView ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        {isLoginView ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); setIsLoginView(!isLoginView); setError(''); }}
                        style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 500 }}
                    >
                        {isLoginView ? 'Sign Up' : 'Sign In'}
                    </a>
                </div>
            </div>
        </div>
    );
}
