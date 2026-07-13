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
                        <i className="bx bxs-book-heart" /> Smart Diary
                    </div>
                    <p className="auth-tagline">Your memories. Your story. Your diary.</p>

                    <form className="auth-form" onSubmit={submit}>
                        {mode === 'signup' && (
                            <div className="input-icon">
                                <i className="bx bx-user" />
                                <input placeholder="Full name" value={name}
                                    onChange={(e) => setName(e.target.value)} required />
                            </div>
                        )}
                        <div className="input-icon">
                            <i className="bx bx-envelope" />
                            <input type="email" placeholder="Email address" value={email}
                                onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="input-icon">
                            <i className="bx bx-lock-alt" />
                            <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                                onChange={(e) => setPassword(e.target.value)} required />
                            <i className={`bx ${showPw ? 'bx-hide' : 'bx-show'} toggle-eye`}
                                onClick={() => setShowPw(!showPw)} />
                        </div>

                        <div className="auth-row">
                            <label>
                                <input type="checkbox" checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)} />
                                Remember me
                            </label>
                            <span className="auth-link">Forgot password?</span>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button className="btn btn-primary btn-block" disabled={busy}>
                            {busy ? <><i className="bx bx-loader-alt bx-spin" /> Please wait…</>
                                : mode === 'signup' ? 'Create account' : 'Sign In'}
                        </button>

                        <button type="button" className="btn btn-secondary btn-block" onClick={loginDemo}>
                            <i className="bx bx-play-circle" /> Try the demo
                        </button>
                    </form>

                    <div className="auth-row" style={{ justifyContent: 'center', marginTop: '1.25rem' }}>
                        <span className="muted" style={{ fontSize: '.85rem' }}>
                            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <span className="auth-link"
                                onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>
                                {mode === 'signup' ? 'Sign in' : 'Sign up'}
                            </span>
                        </span>
                    </div>

                    <div className="auth-foot">Made with ❤️ for your memories</div>
                </div>

                <div className="auth-right">
                    <i className="bx bxs-book-heart" style={{ fontSize: '4.5rem', color: 'var(--accent-primary)' }} />
                    <h3>Reflect. Grow. Remember.</h3>
                    <p>Capture your days, track your moods, and let AI reveal the patterns in your story.</p>
                </div>
            </div>
        </div>
    );
}
