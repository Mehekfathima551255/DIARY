import React, { useEffect } from 'react';

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
                    new Notification('Smart Diary', {
                        body: "Time to reflect on your day! 📔",
                        icon: "https://cdn-icons-png.flaticon.com/512/3238/3238015.png"
                    });
                    localStorage.setItem('sd_last_notified_date', todayStr);
                }
            }
        }, 60000); // 60 seconds

        return () => clearInterval(intervalId);
    }, []);

    return null; // This is a background service component, it renders nothing.
}
