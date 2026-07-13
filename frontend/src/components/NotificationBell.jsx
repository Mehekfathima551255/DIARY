import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

// How long (ms) between automatic notification checks
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

// localStorage key so we don't re-create the same notification in the same session
const NOTIF_KEY = 'sd_notif_sent';

function getNotifSent() {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; }
}
function markNotifSent(key) {
    const sent = getNotifSent();
    sent[key] = new Date().toISOString().slice(0, 10); // today's date
    localStorage.setItem(NOTIF_KEY, JSON.stringify(sent));
}
function wasSentToday(key) {
    const sent = getNotifSent();
    return sent[key] === new Date().toISOString().slice(0, 10);
}

// Auto-generate smart notifications based on streak + stats
async function checkAndCreateNotifications() {
    try {
        const [streak, stats] = await Promise.all([api.getStreak(), api.getStats()]);

        const current = streak?.current_streak ?? 0;
        const weekly  = stats?.weekly_memories  ?? 0;
        const total   = stats?.overview?.total_memories ?? 0;

        // Streak milestones
        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const m of streakMilestones) {
            const key = `streak_${m}`;
            if (current >= m && !wasSentToday(key)) {
                await api.createNotification(`🔥 Amazing! You're on a ${m}-day writing streak! Keep it up!`);
                markNotifSent(key);
                break; // one at a time
            }
        }

        // Weekly summary nudge
        if (weekly >= 5 && !wasSentToday('weekly_5')) {
            await api.createNotification('🎉 You wrote 5+ entries this week — your weekly reflection is ready!');
            markNotifSent('weekly_5');
        }

        // Total memory milestones
        const memMilestones = [10, 25, 50, 100, 200];
        for (const m of memMilestones) {
            const key = `mem_${m}`;
            if (total >= m && !wasSentToday(key)) {
                await api.createNotification(`📚 You've written ${m} memories! Your AI Insights are getting smarter.`);
                markNotifSent(key);
                break;
            }
        }

        // Daily writing nudge — only if user hasn't written today yet
        if (weekly === 0 && !wasSentToday('daily_nudge')) {
            await api.createNotification("✏️ You haven't written today yet — even a short entry counts!");
            markNotifSent('daily_nudge');
        }
    } catch {
        // Silent — notifications are non-critical
    }
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen]                   = useState(false);
    const dropdownRef                       = useRef(null);

    const unread = notifications.filter((n) => !n.is_read).length;

    const load = useCallback(async () => {
        const data = await api.getNotifications();
        setNotifications(Array.isArray(data) ? data : []);
    }, []);

    // Initial load + auto-generate + periodic refresh
    useEffect(() => {
        // Generate smart notifications once on mount
        checkAndCreateNotifications().then(load);

        const timer = setInterval(() => {
            checkAndCreateNotifications().then(load);
        }, POLL_INTERVAL);

        return () => clearInterval(timer);
    }, [load]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleOpen = () => {
        setOpen((v) => !v);
        if (!open) load(); // refresh when opening
    };

    const markRead = async (n) => {
        if (n.is_read) return;
        await api.markNotificationRead(n.id);
        setNotifications((list) =>
            list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
    };

    const markAllRead = async () => {
        const unreadItems = notifications.filter((n) => !n.is_read);
        await Promise.all(unreadItems.map((n) => api.markNotificationRead(n.id)));
        setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    };

    const clearRead = async () => {
        await api.clearReadNotifications();
        setNotifications((list) => list.filter((n) => !n.is_read));
    };

    const fmt = (iso) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = Math.floor((now - d) / 1000);
        if (diff < 60)   return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                className="icon-btn"
                title="Notifications"
                onClick={toggleOpen}
                style={{ position: 'relative' }}
            >
                <i className={`bx ${unread > 0 ? 'bxs-bell' : 'bx-bell'}`} style={{ color: unread > 0 ? 'var(--accent-primary)' : undefined }} />
                {unread > 0 && (
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 17, height: 17, borderRadius: '50%',
                        background: 'var(--danger)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-app)',
                        lineHeight: 1,
                    }}>
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 340, maxHeight: 440, overflowY: 'auto',
                    background: 'var(--bg-card)', backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--border-strong)', borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)', zIndex: 500,
                    display: 'flex', flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.9rem 1rem 0.75rem',
                        borderBottom: '1px solid var(--border-color)',
                        position: 'sticky', top: 0,
                        background: 'var(--bg-card)', zIndex: 1,
                    }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem' }}>
                            Notifications {unread > 0 && <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '20px', padding: '0.1rem 0.45rem', fontSize: '0.7rem', marginLeft: '0.3rem' }}>{unread}</span>}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {unread > 0 && (
                                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Mark all read
                                </button>
                            )}
                            {notifications.some((n) => n.is_read) && (
                                <button onClick={clearRead} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
                                    Clear read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <i className="bx bx-bell-off" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }} />
                            <span style={{ fontSize: '0.88rem' }}>No notifications yet</span>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => markRead(n)}
                                style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                    padding: '0.85rem 1rem',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: n.is_read ? 'transparent' : 'rgba(124,108,255,0.06)',
                                    cursor: n.is_read ? 'default' : 'pointer',
                                    transition: 'background 0.2s',
                                }}
                            >
                                {/* Unread dot */}
                                <div style={{ paddingTop: '0.35rem', flexShrink: 0 }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: n.is_read ? 'transparent' : 'var(--accent-primary)',
                                        border: n.is_read ? '1.5px solid var(--border-color)' : 'none',
                                    }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.87rem', lineHeight: 1.5, margin: 0, color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                        {n.message}
                                    </p>
                                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                                        {fmt(n.created_at)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
