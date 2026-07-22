import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Settings() {
    const { user, logout } = useAuth();
    const [name, setName]         = useState(user?.name || '');
    const [email]                 = useState(user?.email || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileNote, setProfileNote]     = useState('');

    const fileInputRef  = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    /* ── Profile save ── */
    const handleSaveProfile = async () => {
        if (!name.trim()) { setProfileNote('Name cannot be empty.'); return; }
        setSavingProfile(true); setProfileNote('');
        try {
            await api.updateProfile(name.trim());
            setProfileNote('✓ Profile saved!');
            setTimeout(() => setProfileNote(''), 2500);
        } catch {
            setProfileNote('Failed to save. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    /* ── Export / Import ── */
    const handleExport = async () => {
        try { await api.exportMemories(); }
        catch (err) { alert('Export failed: ' + err.message); }
    };
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            await api.importMemories(file);
            alert('Imported successfully! Reloading…');
            window.location.reload();
        } catch (err) {
            alert('Import failed: ' + err.message);
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '2rem', padding: '1rem' }}>

            {/* Header */}
            <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '1.5rem', textAlign: 'center', position: 'relative', transform: 'rotate(-1deg)', boxShadow: 'var(--shadow)' }}>
                <div className="tape top-center" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink-0)', margin: 0 }}>Journal Settings</h2>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Manage your preferences and backups.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* ── Profile ── */}
                <div className="torn-edge" style={{ background: 'var(--paper-0)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(1deg)' }}>
                    <div className="tape top-left" style={{ width: '40px' }} />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '2px solid var(--ink-0)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Profile</h3>

                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Name</label>
                    <input
                        value={name} onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--ink-0)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />

                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Email</label>
                    <input
                        value={email} disabled
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />

                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        style={{ background: 'var(--accent-terra)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', cursor: 'pointer', transform: 'rotate(-2deg)' }}
                    >
                        {savingProfile ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-check" /> Save Changes</>}
                    </button>

                    {profileNote && (
                        <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-hand)', fontSize: '1rem', color: profileNote.startsWith('✓') ? 'var(--accent-olive)' : 'var(--danger)' }}>
                            {profileNote}
                        </div>
                                    )}
                </div>

                {/* ── Archives ── */}
                <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(2deg)' }}>
                    <div className="tape top-center" style={{ width: '40px' }} />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '2px solid var(--ink-0)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Archives</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}>Export Journal</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Download a JSON backup</div>
                            </div>
                            <button onClick={handleExport} className="stamp blue" style={{ cursor: 'pointer', transform: 'rotate(-2deg)' }}>
                                <i className="bx bx-download" /> Export
                            </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}>Import Journal</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Restore from backup</div>
                            </div>
                            <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                            <button onClick={handleImportClick} disabled={isImporting} className="stamp green" style={{ cursor: 'pointer', transform: 'rotate(1deg)' }}>
                                {isImporting ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-upload" />} Import
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Sign out ── */}
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button onClick={logout} style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.3)', padding: '1rem 2rem', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px' }}>
                        <i className="bx bx-log-out" /> Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
