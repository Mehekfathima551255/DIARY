import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

// Only poll to refresh the unread count — no auto-creating notifications here
const POLL_INTERVAL = 10 * 60 * 1000; // every 10 minutes

// One inactivity check per day — stored in localStorage
const INACTIVITY_KEY = 'sd_inactivity_checked';

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

// Auto-notification: streak expiry warning after 5 days of no writing
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

        // Only fire if user has entries AND hasn't written in 5+ days
        if (totalMemories > 0 && daysSinceWrite !== null && daysSinceWrite >= 5) {
            const days = daysSinceWrite;
            let msg;
            if (days >= 14) {
                msg = `😔 Your streak has reset after ${days} days away. A new streak starts the moment you write — come back!`;
            } else if (days >= 7) {
                msg = `⚠️ It's been ${days} days since your last entry. Your streak is fading — write today to revive it!`;
            } else {
                msg = `⚠️ Your streak is expiring — you haven't written anything in ${days} days. Even one line keeps it alive!`;
            }
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
