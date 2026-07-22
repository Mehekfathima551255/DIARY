import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

function fmt(iso) {
    if (!iso) return '';
    let str = String(iso);
    // Treat bare timestamps (no timezone) as UTC
    if (!str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
        str += 'Z';
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';

    const today = new Date();
    const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) return timeStr;                               // e.g. "6:33 PM"
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' • ' + timeStr;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading]             = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const markRead = async (n) => {
        if (n.is_read) return;
        await api.markNotificationRead(n.id);
        setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    };

    const markAllRead = async () => {
        const unread = notifications.filter((n) => !n.is_read);
        await Promise.all(unread.map((n) => api.markNotificationRead(n.id)));
        setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    };

    const clearRead = async () => {
        await api.clearReadNotifications();
        setNotifications((list) => list.filter((n) => !n.is_read));
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

            {/* ── Page header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                        Notifications
                    </h1>
                    {unreadCount > 0 && (
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.05rem', color: '#c0392b', marginTop: '0.25rem' }}>
                            {unreadCount} unread
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} style={BTN_SEC}>
                            <i className="bx bx-check-double" /> Mark all as seen
                        </button>
                    )}
                    {notifications.some((n) => n.is_read) && (
                        <button onClick={clearRead} style={{ ...BTN_SEC, color: 'var(--text-muted)' }}>
                            <i className="bx bx-trash" /> Clear seen
                        </button>
                    )}
                </div>
            </div>

            {/* ── List ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2rem' }} />
                    <p style={{ marginTop: '0.75rem', fontFamily: 'var(--font-hand)', fontSize: '1.1rem' }}>Loading…</p>
                </div>
            ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <i className="bx bx-bell-off" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }} />
                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem' }}>No notifications yet</p>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                        Streak milestones and reminders will appear here.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {notifications.map((n) => (
                        <NotifCard key={n.id} n={n} onMarkRead={markRead} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Individual notification card ── */
function NotifCard({ n, onMarkRead }) {
    const unread = !n.is_read;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1rem 1.25rem',
            borderRadius: '10px',
            border: unread
                ? '1.5px solid rgba(192,57,43,0.35)'
                : '1.5px solid var(--border-color, rgba(0,0,0,0.08))',
            background: unread
                ? 'rgba(192,57,43,0.04)'
                : 'var(--bg-card, #fff)',
            boxShadow: unread ? '0 2px 8px rgba(192,57,43,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
            transition: 'all 0.2s',
        }}>

            {/* Dot indicator */}
            <div style={{
                flexShrink: 0,
                width: 10, height: 10,
                borderRadius: '50%',
                marginTop: '0.45rem',
                background: unread ? '#c0392b' : 'transparent',
                border: unread ? 'none' : '1.5px solid var(--border-color, #ccc)',
                transition: 'background 0.2s',
            }} />

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    lineHeight: 1.55,
                    color: unread ? '#c0392b' : 'var(--text-primary, #222)',
                    fontWeight: unread ? 600 : 400,
                    fontFamily: 'var(--font-sans)',
                }}>
                    {n.message}
                </p>
                <span style={{
                    display: 'block',
                    marginTop: '0.3rem',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted, #999)',
                    fontFamily: 'var(--font-sans)',
                }}>
                    {fmt(n.created_at)}
                </span>
            </div>

            {/* Seen button — only on unread */}
            {unread && (
                <button
                    onClick={() => onMarkRead(n)}
                    style={{
                        flexShrink: 0,
                        padding: '0.35rem 0.85rem',
                        borderRadius: '20px',
                        border: '1.5px solid #c0392b',
                        background: 'transparent',
                        color: '#c0392b',
                        cursor: 'pointer',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-sans)',
                        transition: 'all 0.18s',
                        whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c0392b'; }}
                >
                    Mark seen
                </button>
            )}

            {/* Seen badge — already read */}
            {!unread && (
                <span style={{
                    flexShrink: 0,
                    fontSize: '0.72rem',
                    color: 'var(--text-muted, #999)',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}>
                    <i className="bx bx-check" style={{ fontSize: '0.9rem' }} /> Seen
                </span>
            )}
        </div>
    );
}

const BTN_SEC = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #ddd)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: 'var(--text-secondary, #555)',
    transition: 'all 0.18s',
};
