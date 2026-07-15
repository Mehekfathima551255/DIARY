import React, { useState, useEffect, useCallback } from 'react';
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
    return getNotifSent()[key] === new Date().toISOString().slice(0, 10);
}

export async function checkAndCreateNotifications() {
    try {
        const [streak, stats] = await Promise.all([api.getStreak(), api.getStats()]);
        const current = streak?.current_streak ?? 0;
        const weekly  = stats?.weekly_memories  ?? 0;
        const total   = stats?.overview?.total_memories ?? 0;

        for (const m of [3, 7, 14, 30, 60, 100]) {
            if (current >= m && !wasSentToday(`streak_${m}`)) {
                await api.createNotification(`🔥 Amazing! You're on a ${m}-day writing streak! Keep it up!`);
                markNotifSent(`streak_${m}`);
                break;
            }
        }
        if (weekly >= 5 && !wasSentToday('weekly_5')) {
            await api.createNotification('🎉 You wrote 5+ entries this week — your weekly reflection is ready!');
            markNotifSent('weekly_5');
        }
        for (const m of [10, 25, 50, 100, 200]) {
            if (total >= m && !wasSentToday(`mem_${m}`)) {
                await api.createNotification(`📚 You've written ${m} memories! Your AI Insights are getting smarter.`);
                markNotifSent(`mem_${m}`);
                break;
            }
        }
        if (weekly === 0 && !wasSentToday('daily_nudge')) {
            await api.createNotification("✏️ You haven't written today yet — even a short entry counts!");
            markNotifSent('daily_nudge');
        }
    } catch { /* non-critical */ }
}

/* ── Bell button — navigates to notifications page ── */
export default function NotificationBell({ onNavigate }) {
    const [unread, setUnread] = useState(0);

    const loadUnread = useCallback(async () => {
        const data = await api.getNotifications();
        if (Array.isArray(data)) {
            setUnread(data.filter((n) => !n.is_read).length);
        }
    }, []);

    useEffect(() => {
        checkAndCreateNotifications().then(loadUnread);
        const timer = setInterval(() => checkAndCreateNotifications().then(loadUnread), POLL_INTERVAL);
        // Refresh count when a notification is marked read from the page
        window.addEventListener('sd_notif_updated', loadUnread);
        return () => {
            clearInterval(timer);
            window.removeEventListener('sd_notif_updated', loadUnread);
        };
    }, [loadUnread]);

    return (
        <button
            className="icon-btn"
            title="Notifications"
            onClick={() => onNavigate('notifications')}
            aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
            style={{ position: 'relative' }}
        >
            <i className={`bx ${unread > 0 ? 'bxs-bell' : 'bx-bell'}`}
               style={{ color: unread > 0 ? '#c0392b' : undefined }} />
            {unread > 0 && (
                <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 17, height: 17, borderRadius: '50%',
                    background: '#c0392b', color: '#fff',
                    fontSize: '0.62rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid var(--bg-app, #fff)',
                    lineHeight: 1,
                }}>
                    {unread > 9 ? '9+' : unread}
                </span>
            )}
        </button>
    );
}
