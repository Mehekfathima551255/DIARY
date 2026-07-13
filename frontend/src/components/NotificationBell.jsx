import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

const POLL_INTERVAL = 5 * 60 * 1000;
const NOTIF_KEY     = 'sd_notif_sent';

function getNotifSent() {
    try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}'); } catch { return {}; }
}
function markNotifSent(key) {
    const sent = getNotifSent();
    sent[key] = new Date().toISOString().slice(0, 10);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(sent));
}
function wasSentToday(key) {
    const sent = getNotifSent();
    return sent[key] === new Date().toISOString().slice(0, 10);
}

async function checkAndCreateNotifications() {
    try {
        const [streak, stats] = await Promise.all([api.getStreak(), api.getStats()]);
        const current = streak?.current_streak ?? 0;
        const weekly  = stats?.weekly_memories  ?? 0;
        const total   = stats?.overview?.total_memories ?? 0;

        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const m of streakMilestones) {
            const key = `streak_${m}`;
            if (current >= m && !wasSentToday(key)) {
                await api.createNotification(`🔥 Amazing! You're on a ${m}-day writing streak! Keep it up!`);
                markNotifSent(key);
                break;
            }
        }
        if (weekly >= 5 && !wasSentToday('weekly_5')) {
            await api.createNotification('🎉 You wrote 5+ entries this week — your weekly reflection is ready!');
            markNotifSent('weekly_5');
        }
        const memMilestones = [10, 25, 50, 100, 200];
        for (const m of memMilestones) {
            const key = `mem_${m}`;
            if (total >= m && !wasSentToday(key)) {
                await api.createNotification(`📚 You've written ${m} memories! Your AI Insights are getting smarter.`);
                markNotifSent(key);
                break;
            }
        }
        if (weekly === 0 && !wasSentToday('daily_nudge')) {
            await api.createNotification("✏️ You haven't written today yet — even a short entry counts!");
            markNotifSent('daily_nudge');
        }
    } catch { /* non-critical */ }
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

    useEffect(() => {
        checkAndCreateNotifications().then(load);
        const timer = setInterval(() => checkAndCreateNotifications().then(load), POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const toggleOpen = () => { setOpen((v) => !v); if (!open) load(); };

    const markRead = async (n) => {
        if (n.is_read) return;
        await api.markNotificationRead(n.id);
        setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    };
    const markAllRead = async () => {
        const unreadItems = notifications.filter((n) => !n.is_read);
        await Promise.all(unreadItems.map((n) => api.markNotificationRead(n.id)));
        setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    };
    const fmt = (iso) => {
        const d = new Date(iso);
        const diff = Math.floor((Date.now() - d) / 1000);
        if (diff < 60)    return 'just now';
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div ref={dropdownRef} className="nb-wrap">
            {/* ── Bell trigger button ───────────────────────────── */}
            <button
                className={`nb-bell-btn ${open ? 'nb-bell--open' : ''}`}
                title="Notifications"
                onClick={toggleOpen}
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            >
                <i className={`bx ${unread > 0 ? 'bxs-bell' : 'bx-bell'}`} />
                {unread > 0 && (
                    <span className="nb-badge">{unread > 9 ? '9+' : unread}</span>
                )}
            </button>

            {/* ── Sticky-note dropdown ──────────────────────────── */}
            {open && (
                <div className="nb-dropdown">
                    {/* Top washi tape */}
                    <div className="nb-tape" aria-hidden="true" />

                    {/* Header */}
                    <div className="nb-header">
                        <span className="nb-header-title">
                            <i className="bx bx-bell" />
                            Notes
                            {unread > 0 && <span className="nb-count">{unread}</span>}
                        </span>
                        <div className="nb-header-actions">
                            {unread > 0 && (
                                <button className="nb-action-btn" onClick={markAllRead}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ruled lines background */}
                    <div className="nb-body">
                        {notifications.length === 0 ? (
                            <div className="nb-empty">
                                <i className="bx bx-bell-off" />
                                <span>No notes yet</span>
                                <span className="nb-empty-sub">Streak milestones will appear here</span>
                            </div>
                        ) : (
                            notifications.map((n, idx) => (
                                <div
                                    key={n.id}
                                    className={`nb-item ${n.is_read ? 'nb-item--read' : 'nb-item--unread'}`}
                                    onClick={() => markRead(n)}
                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                >
                                    <div className="nb-item-dot" />
                                    <div className="nb-item-body">
                                        <p className="nb-item-msg">{n.message}</p>
                                        <span className="nb-item-time">{fmt(n.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Folded corner — paper effect */}
                    <div className="nb-corner" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}
