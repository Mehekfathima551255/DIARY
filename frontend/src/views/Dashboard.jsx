import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function Dashboard({ setCurrentView }) {
    const [stats, setStats] = useState(null);
    const [moodData, setMoodData] = useState([]);
    const [topTags, setTopTags] = useState([]);
    const [recentMemories, setRecentMemories] = useState([]);
    const [streak, setStreak] = useState(null);
    const [calendar, setCalendar] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#0984e3', '#e17055', '#d63031'];

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [
                    statsRes, 
                    moodRes, 
                    tagsRes, 
                    recentRes,
                    streakRes,
                    calendarRes
                ] = await Promise.all([
                    api.getDashboardStats(),
                    api.getMoodChart(),
                    api.getTopTags(),
                    api.getRecentMemories(),
                    api.getStreak(),
                    api.getCalendar()
                ]);

                setStats(statsRes);
                
                // Format mood data for Recharts
                const formattedMood = Object.keys(moodRes).map(key => ({
                    name: key,
                    value: moodRes[key]
                }));
                setMoodData(formattedMood);
                
                setTopTags(tagsRes);
                setRecentMemories(recentRes);
                setStreak(streakRes);
                setCalendar(calendarRes);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: 'var(--accent-primary)' }}></i>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Statistics Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                <div className="card glass stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(108, 92, 231, 0.1)', padding: '1rem', borderRadius: '50%', color: 'var(--accent-primary)' }}>
                        <i className='bx bx-book' style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Memories</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.total_memories || 0}</h3>
                    </div>
                </div>

                <div className="card glass stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0, 184, 148, 0.1)', padding: '1rem', borderRadius: '50%', color: '#00b894' }}>
                        <i className='bx bxs-flame' style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Current Streak</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{streak?.current_streak || 0} Days</h3>
                    </div>
                </div>

                <div className="card glass stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(253, 121, 168, 0.1)', padding: '1rem', borderRadius: '50%', color: '#fd79a8' }}>
                        <i className='bx bxs-heart' style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Favorites</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.favorites || 0}</h3>
                    </div>
                </div>

                <div className="card glass stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(9, 132, 227, 0.1)', padding: '1rem', borderRadius: '50%', color: '#0984e3' }}>
                        <i className='bx bx-text' style={{ fontSize: '1.5rem' }}></i>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Words</p>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats?.total_words || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                
                {/* Mood Analytics */}
                <div className="card glass" style={{ minHeight: '350px' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Mood Distribution</h3>
                    {moodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie 
                                    data={moodData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                >
                                    {moodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>Not enough data for mood chart.</p>
                    )}
                </div>

                {/* Calendar Heatmap (Simplified) */}
                <div className="card glass">
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Writing Activity</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '1rem' }}>
                        {calendar && Object.keys(calendar).slice(-60).map(date => {
                            const count = calendar[date];
                            const intensity = count === 0 ? 'var(--bg-secondary)' : count === 1 ? '#a29bfe' : count === 2 ? '#6c5ce7' : '#4834d4';
                            return (
                                <div 
                                    key={date} 
                                    title={`${date}: ${count} entries`}
                                    style={{ width: '15px', height: '15px', borderRadius: '3px', background: intensity }}
                                />
                            );
                        })}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>Showing up to last 60 days of activity.</p>
                </div>

                {/* Top Tags */}
                <div className="card glass">
                    <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Most Used Tags</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {Object.keys(topTags).length > 0 ? Object.keys(topTags).map(tag => (
                            <span key={tag} style={{ 
                                background: 'rgba(108, 92, 231, 0.1)', 
                                color: 'var(--accent-primary)', 
                                padding: '0.5rem 1rem', 
                                borderRadius: '2rem', 
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                #{tag} <span style={{ background: 'var(--accent-primary)', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>{topTags[tag]}</span>
                            </span>
                        )) : (
                            <p style={{ color: 'var(--text-secondary)' }}>No tags used yet.</p>
                        )}
                    </div>
                </div>

                {/* Recent Memories */}
                <div className="card glass">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', margin: 0 }}>Recent Memories</h3>
                        <button onClick={() => setCurrentView('memories')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                            View All <i className='bx bx-right-arrow-alt'></i>
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {recentMemories.length > 0 ? recentMemories.map(memory => (
                            <div key={memory.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{memory.title}</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(memory.created_at).toLocaleDateString()}</p>
                                </div>
                                <span style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent-primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                    {memory.mood}
                                </span>
                            </div>
                        )) : (
                            <p style={{ color: 'var(--text-secondary)' }}>No memories yet. Write your first one!</p>
                        )}
                    </div>
                </div>
                
            </div>
        </div>
    );
}
