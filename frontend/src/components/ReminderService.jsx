import React, { useEffect } from 'react';
import { api } from '../lib/api';

export default function ReminderService() {
    useEffect(() => {
        // Check for reminders every minute
        const intervalId = setInterval(() => {
            const enabled = localStorage.getItem('sd_reminders_enabled') === 'true';
            if (!enabled || Notification.permission !== 'granted') return;

            const timeStr = localStorage.getItem('sd_reminder_time'); // "HH:MM"
            if (!timeStr) return;

            const now = new Date();
            const currentHours = now.getHours().toString().padStart(2, '0');
            const currentMinutes = now.getMinutes().toString().padStart(2, '0');
            const currentTimeStr = `${currentHours}:${currentMinutes}`;
            const todayStr = now.toISOString().split('T')[0];
            
            // Check if it's the right time
            if (currentTimeStr === timeStr) {
                const lastNotified = localStorage.getItem('sd_last_notified_date');
                
                // Only notify once per day
                if (lastNotified !== todayStr) {
                    const customMsg = localStorage.getItem('sd_reminder_msg') || 'Time to reflect on your day! 📔';
                    
                    api.createNotification(customMsg).then((notif) => {
                        const browserNotif = new Notification('Smart Diary', {
                            body: customMsg,
                            icon: "https://cdn-icons-png.flaticon.com/512/3238/3238015.png"
                        });
                        
                        browserNotif.onclick = () => {
                            window.focus();
                            if (notif && notif.id) {
                                api.markNotificationRead(notif.id).then(() => {
                                    window.dispatchEvent(new Event('sd_notification_read'));
                                });
                            }
                        };
                        
                        localStorage.setItem('sd_last_notified_date', todayStr);
                    }).catch(err => {
                        console.error('Failed to create reminder notification', err);
                    });
                }
            }
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, []);

    return null; // This is a background service component, it renders nothing.
}
