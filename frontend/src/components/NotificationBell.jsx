import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

// Only poll to refresh the unread count — no auto-creating notifications here
const POLL_INTERVAL = 10 * 60 * 1000; // every 10 minutes

// One inactivity check per day — stored in localStorage
const INACTIVITY_KEY = 'sd_inactivity_checked';

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

// The ONLY auto-notification we create: "hey friend, you haven't written in 3+ days"
let inactivityCheckRunning = false;
async function checkInactivity() {
    if (inactivityCheckRunning) return;
    if (localStorage.getItem(INACTIVITY_KEY) === getTodayStr()) return; // already checked today

    inactivityCheckRunning = true;
    try {
        const streak = await api.getStreak();
        const stats  = await api.getStats();

        const daysSinceWrite = streak?.days_since_last ?? null;
        const totalMemories  = stats?.overview?.total_memories ?? 0;

        // Only nudge if user has written before AND hasn't written in 3+ days
        if (totalMemories > 0 && daysSinceWrite !== null && daysSinceWrite >= 3) {
            const days = daysSinceWrite;
            const msg  = days >= 7
                ? `Hey friend, it's been ${days} days since your last entry. Your journal misses you 💙`
                : `Hey! You haven't written in ${days} days — even a few lines count 😊`;
            await api.createNotification(msg);
            window.dispatchEvent(new Event('sd_notif_updated'));
        }

        localStorage.setItem(INACTIVITY_KEY, getTodayStr());
    } catch { /* non-critical */ }
    finally { inactivityCheckRunning = false; }
}

export default function NotificationBell({ onNavigate }) {
    const [unread, setUnread] = useState(0);
    const checkedRef = useRef(false);

    const loadUnread = useCallback(async () => {
        const data = await api.getNotifications();
        if (Array.isArray(data)) {
            setUnread(data.filter((n) => !n.is_read).length);
        }
    }, []);

    useEffect(() => {
        // Load unread count immediately
        loadUnread();

        // Run inactivity check once per session (not on every remount)
        if (!checkedRef.current) {
            checkedRef.current = true;
            checkInactivity().then(loadUnread);
        }

        // Periodic refresh of unread count only
        const timer = setInterval(loadUnread, POLL_INTERVAL);

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
            <i
                className={`bx ${unread > 0 ? 'bxs-bell' : 'bx-bell'}`}
                style={{ color: unread > 0 ? '#c0392b' : undefined }}
            />
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
