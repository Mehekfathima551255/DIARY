import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

const POLL_INTERVAL = 30 * 60 * 1000; // poll every 30 min, not 5
const NOTIF_KEY     = 'sd_notif_sent';
const RUNNING_KEY   = 'sd_notif_running'; // prevent race condition across tabs

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

// Global flag so multiple mounts in the same tab don't double-fire
let isCheckingNotifications = false;

export async function checkAndCreateNotifications() {
    // Prevent concurrent runs
    if (isCheckingNotifications) return;
    isCheckingNotifications = true;

    try {
        const [streak, stats] = await Promise.all([api.getStreak(), api.getStats()]);
        const current = streak?.current_streak ?? 0;
        const weekly  = stats?.weekly_memories  ?? 0;
        const total   = stats?.overview?.total_memories ?? 0;

        // ── Streak milestones — only fire the highest applicable one ──
        const streakMilestones = [100, 60, 30, 14, 7, 3]; // check highest first
        for (const m of streakMilestones) {
            if (current >= m && !wasSentToday(`streak_${m}`)) {
                await api.createNotification(`🔥 You're on a ${m}-day writing streak! Keep going!`);
                markNotifSent(`streak_${m}`);
                break; // only one streak notification per day
            }
        }

        // ── Memory milestones — only fire the highest applicable one ──
        const memMilestones = [200, 100, 50, 25, 10]; // check highest first
        for (const m of memMilestones) {
            if (total >= m && !wasSentToday(`mem_${m}`)) {
                await api.createNotification(`📚 You've written ${m} memories — your journal is growing!`);
                markNotifSent(`mem_${m}`);
                break; // only one memory milestone per day
            }
        }

        // ── Weekly goal — only if 5+ entries this week ──
        if (weekly >= 5 && !wasSentToday('weekly_5')) {
            await api.createNotification('🎉 5 entries this week — great journaling habit!');
            markNotifSent('weekly_5');
        }

        // ── Daily nudge — only once, only if nothing written this week ──
        // Removed the "haven't written today" nudge — too spammy
        // Only show if user hasn't written anything in 3+ days
        if (weekly === 0 && current === 0 && !wasSentToday('inactivity_nudge')) {
            await api.createNotification("📝 It's been a while — even a few lines count!");
            markNotifSent('inactivity_nudge');
        }

    } catch { /* non-critical */ }
    finally {
        isCheckingNotifications = false;
    }
}

export default function NotificationBell({ onNavigate }) {
    const [unread, setUnread] = useState(0);
    const hasCheckedRef = useRef(false); // only check once per page load

    const loadUnread = useCallback(async () => {
        const data = await api.getNotifications();
        if (Array.isArray(data)) {
            setUnread(data.filter((n) => !n.is_read).length);
        }
    }, []);

    useEffect(() => {
        // Only run the notification check ONCE per page load, not on every remount
        if (!hasCheckedRef.current) {
            hasCheckedRef.current = true;
            checkAndCreateNotifications().then(loadUnread);
        } else {
            loadUnread();
        }

        // Poll to refresh unread count only (no new notification creation)
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
