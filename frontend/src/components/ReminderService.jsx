import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

/* ── In-app reminder toast ── */
function ReminderToast({ message, notifId, onDismiss }) {
    const handleSeen = async () => {
        if (notifId) {
            await api.markNotificationRead(notifId);
            // Tell NotificationBell to refresh its unread count
            window.dispatchEvent(new Event('sd_notif_updated'));
        }
        onDismiss();
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
            background: '#fff',
            border: '1.5px solid rgba(192,57,43,0.4)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '1.25rem 1.5rem',
            maxWidth: '340px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            animation: 'toastSlideIn 0.3s ease-out',
        }}>
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="bx bx-bell" style={{ fontSize: '1.3rem', color: '#c0392b', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-sans, sans-serif)', fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a' }}>
                    Smart Diary Reminder
                </span>
                {/* Close X */}
                <button
                    onClick={onDismiss}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: '1.1rem', lineHeight: 1 }}
                    title="Dismiss"
                >
                    <i className="bx bx-x" />
                </button>
            </div>

            {/* Message */}
            <p style={{
                margin: 0,
                fontFamily: 'var(--font-hand, cursive)',
                fontSize: '1.1rem',
                color: '#333',
                lineHeight: 1.5,
            }}>
                {message}
            </p>

            {/* Mark seen button */}
            <button
                onClick={handleSeen}
                style={{
                    alignSelf: 'flex-end',
                    padding: '0.4rem 1.1rem',
                    borderRadius: '20px',
                    border: '1.5px solid #c0392b',
                    background: 'transparent',
                    color: '#c0392b',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-sans, sans-serif)',
                    transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#c0392b'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c0392b'; }}
            >
                <i className="bx bx-check" /> Mark seen
            </button>
        </div>
    );
}

/* ── Background reminder service ── */
export default function ReminderService() {
    const [toast, setToast] = useState(null); // { message, notifId }

    useEffect(() => {
        const tick = async () => {
            const enabled = localStorage.getItem('sd_reminders_enabled') === 'true';
            if (!enabled) return;

            const timeStr = localStorage.getItem('sd_reminder_time');
            if (!timeStr) return;

            const now      = new Date();
            const hh       = now.getHours().toString().padStart(2, '0');
            const mm       = now.getMinutes().toString().padStart(2, '0');
            const todayStr = now.toISOString().split('T')[0];
            const weekday  = now.getDay(); // 0=Sun … 6=Sat

            if (`${hh}:${mm}` !== timeStr) return;

            // ── Schedule check ──────────────────────────────────
            const schedule = localStorage.getItem('sd_reminder_schedule') || 'everyday';

            if (schedule === 'weekdays' && (weekday === 0 || weekday === 6)) return;
            if (schedule === 'weekends' && weekday !== 0 && weekday !== 6) return;
            if (schedule === 'custom') {
                let days = [1,2,3,4,5];
                try { days = JSON.parse(localStorage.getItem('sd_reminder_days') || '[1,2,3,4,5]'); } catch {}
                if (!days.includes(weekday)) return;
            }

            // "today only" — use a separate fired flag
            if (schedule === 'today') {
                const todayFired = localStorage.getItem('sd_reminder_today_fired');
                if (todayFired === todayStr) return;
            } else {
                // all other schedules: once per calendar day
                const lastNotified = localStorage.getItem('sd_last_notified_date');
                if (lastNotified === todayStr) return;
            }

            const msg = localStorage.getItem('sd_reminder_msg') || 'Time to reflect on your day! 📔';

            try {
                const notif = await api.createNotification(msg);
                window.dispatchEvent(new Event('sd_notif_updated'));
                setToast({ message: msg, notifId: notif?.id ?? null });
            } catch {
                setToast({ message: msg, notifId: null });
            }

            // Mark as fired
            if (schedule === 'today') {
                localStorage.setItem('sd_reminder_today_fired', todayStr);
                // auto-disable after firing
                localStorage.setItem('sd_reminders_enabled', 'false');
            } else {
                localStorage.setItem('sd_last_notified_date', todayStr);
            }
        };

        // Check immediately, then every 60 seconds
        tick();
        const id = setInterval(tick, 60000);

        // Handle test previews from Settings page
        const handleTest = (e) => {
            const msg = e.detail?.message || 'Time to reflect on your day! 📔';
            setToast({ message: msg, notifId: null });
        };
        window.addEventListener('sd_test_reminder', handleTest);

        return () => {
            clearInterval(id);
            window.removeEventListener('sd_test_reminder', handleTest);
        };
    }, []);

    if (!toast) return null;

    return (
        <ReminderToast
            message={toast.message}
            notifId={toast.notifId}
            onDismiss={() => setToast(null)}
        />
    );
}
