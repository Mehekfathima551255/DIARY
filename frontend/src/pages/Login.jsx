import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login, register, loginDemo } = useAuth();
    const [mode, setMode] = useState('login'); // login | signup
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [remember, setRemember] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (mode === 'signup') await register(name, email, password);
            else await login(email, password);
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <div className="auth-left">
                    <div className="auth-brand">
                        <i className="bx bxs-book-heart" style={{color: 'var(--accent-terra)'}} /> Smart Diary
                    </div>
                    <p className="auth-tagline">My Personal Journal</p>

                    <form className="auth-form" onSubmit={submit}>
                        {mode === 'signup' && (
                            <div>
                                <label className="field-label">Full Name</label>
                                <input placeholder="e.g. Jane Doe" value={name}
                                    onChange={(e) => setName(e.target.value)} required />
                            </div>
                        )}
                        <div>
                            <label className="field-label">Email Address</label>
                            <input type="email" placeholder="you@example.com" value={email}
                                onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div style={{position: 'relative'}}>
                            <label className="field-label">Password</label>
                            <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password}
                                onChange={(e) => setPassword(e.target.value)} required />
                            <i className={`bx ${showPw ? 'bx-hide' : 'bx-show'}`}
                                style={{position: 'absolute', right: '1rem', bottom: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)'}}
                                onClick={() => setShowPw(!showPw)} />
                        </div>

                        <div className="between" style={{fontSize: '0.85rem', margin: '0.5rem 0 1rem'}}>
                            <label className="flex-center gap-sm" style={{cursor: 'pointer'}}>
                                <input type="checkbox" checked={remember} style={{width: 'auto'}}
                                    onChange={(e) => setRemember(e.target.checked)} />
                                Remember me
                            </label>
                            <span style={{color: 'var(--accent-blue)', cursor: 'pointer'}}>Forgot password?</span>
                        </div>

                        {error && <div style={{color: 'red', fontSize: '0.85rem', marginBottom: '1rem'}}>{error}</div>}

                        <button className="btn btn-primary" style={{width: '100%', marginBottom: '0.5rem'}} disabled={busy}>
                            {busy ? 'Please wait...' : mode === 'signup' ? 'Create Journal' : 'Open Journal'}
                        </button>

                        <button type="button" className="btn btn-secondary" style={{width: '100%'}} onClick={loginDemo}>
                            Try the demo
                        </button>
                    </form>

                    <div style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem'}}>
                        <span className="muted">
                            {mode === 'signup' ? 'Already have a journal?' : "Don't have a journal yet?"}{' '}
                            <span style={{color: 'var(--accent-terra)', cursor: 'pointer', fontWeight: 600}}
                                onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>
                                {mode === 'signup' ? 'Sign in' : 'Create one'}
                            </span>
                        </span>
                    </div>
                </div>

                <div className="auth-right">
                    <i className="bx bxs-book-heart" style={{ fontSize: '4.5rem', marginBottom: '1rem' }} />
                    <h3>Your story,<br/>beautifully preserved.</h3>
                    <p style={{maxWidth: '80%', margin: '0 auto'}}>A quiet place to reflect, write, and remember.</p>
                </div>
            </div>
        </div>
    );
}
