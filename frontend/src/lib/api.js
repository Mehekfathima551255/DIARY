// ============================================================
// Smart Diary API client
// - Real JWT auth against the FastAPI backend
// - Falls back to local demo data when in demo mode OR the
//   backend is unreachable, so the UI always renders.
// ============================================================
import * as demo from './demo';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'sd_token';
const USER_KEY = 'sd_user';
const DEMO_TOKEN = 'demo-token';

class ApiService {
    get token() { return localStorage.getItem(TOKEN_KEY); }
    get isDemo() { return this.token === DEMO_TOKEN; }

    getUser() {
        try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
    }
    _setSession(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (this.token && this.token !== DEMO_TOKEN) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `API Error: ${response.status}`);
        }
        if (response.status === 204) return null;
        return response.json();
    }

    // Try the backend; if it fails (or we're in demo mode) use fallback data.
    async _safe(fn, fallback) {
        if (this.isDemo) return typeof fallback === 'function' ? fallback() : fallback;
        try { return await fn(); }
        catch (err) {
            console.warn('API fallback (using demo data):', err.message);
            return typeof fallback === 'function' ? fallback() : fallback;
        }
    }

    // ---------------- Auth ----------------
    async login(email, password) {
        const body = new URLSearchParams({ username: email, password });
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.detail || 'Invalid email or password.');
        }
        const data = await res.json();
        this._setSession(data.access_token);
        const me = await this.request('/auth/me').catch(() => ({ name: email.split('@')[0], email }));
        this._setSession(data.access_token, me);
        return me;
    }

    async register(name, email, password) {
        await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        return this.login(email, password);
    }

    loginDemo() {
        this._setSession(DEMO_TOKEN, demo.demoUser);
        return demo.demoUser;
    }

    // ---------------- Memories ----------------
    async getMemories() {
        return this._safe(() => this.request('/memories/'), demo.demoMemories);
    }
    async getMemory(id) {
        return this._safe(() => this.request(`/memories/${id}`), () => demo.demoMemories.find((m) => m.id === id));
    }
    async createMemory(data) {
        if (this.isDemo) {
            const mem = { id: Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), favorite: false, ...data };
            demo.demoMemories.unshift(mem);
            return mem;
        }
        return this.request('/memories/', { method: 'POST', body: JSON.stringify(data) });
    }
    async updateMemory(id, data) {
        if (this.isDemo) return { id, ...data };
        return this.request(`/memories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    async deleteMemory(id) {
        if (this.isDemo) {
            const i = demo.demoMemories.findIndex((m) => m.id === id);
            if (i > -1) demo.demoMemories.splice(i, 1);
            return { message: 'deleted' };
        }
        return this.request(`/memories/${id}`, { method: 'DELETE' });
    }
    async searchMemories(q) {
        return this._safe(
            () => this.request(`/memories/search?q=${encodeURIComponent(q)}`),
            () => demo.demoMemories.filter((m) =>
                (m.title + m.content + (m.tags || '')).toLowerCase().includes(q.toLowerCase()))
        );
    }

    // ---------------- Dashboard ----------------
    async getStats() { return this._safe(() => this.request('/dashboard/stats'), demo.demoStats); }
    async getMoodChart() { return this._safe(() => this.request('/dashboard/mood-chart'), demo.demoMoodChart); }
    async getTopTags() { return this._safe(() => this.request('/dashboard/top-tags'), demo.demoTopTags); }
    async getRecent() { return this._safe(() => this.request('/dashboard/recent'), demo.demoMemories.slice(0, 4)); }
    async getStreak() { return this._safe(() => this.request('/dashboard/streak'), demo.demoStreak); }
    async getCalendar() { return this._safe(() => this.request('/dashboard/calendar'), () => this._demoCalendar()); }

    _demoCalendar() {
        // Build a { 'YYYY-MM-DD': count } map from a spread across the month.
        const map = {};
        const now = new Date();
        for (let i = 1; i <= 28; i += 1) {
            if (Math.random() > 0.35) {
                const d = new Date(now.getFullYear(), now.getMonth(), i);
                map[d.toISOString().slice(0, 10)] = 1 + Math.floor(Math.random() * 6);
            }
        }
        return map;
    }

    // ---------------- Per-entry AI tools ----------------
    async aiTool(kind, content) {
        // kind: summarize | mood | title | tags | improve
        const demoOut = {
            summarize: () => ({ result: demo.demoSummary }),
            mood: () => ({ mood: 'Happy' }),
            title: () => ({ result: 'A day worth remembering' }),
            tags: () => ({ tags: ['reflection', 'daily', 'gratitude'] }),
            improve: () => ({ result: content }),
        }[kind];
        return this._safe(
            () => this.request(`/ai/${kind}`, { method: 'POST', body: JSON.stringify({ content }) }),
            demoOut
        );
    }

    // ---------------- Smart AI (Insights) ----------------
    async getWeeklyReflection() { return this._safe(() => this.request('/smart-ai/weekly-reflection'), { result: demo.demoInsights.weekly }); }
    async getMonthlyReflection() { return this._safe(() => this.request('/smart-ai/monthly-reflection'), { result: demo.demoInsights.weekly }); }
    async getMoodAnalysis() { return this._safe(() => this.request('/smart-ai/mood-analysis'), { result: demo.demoInsights.mood }); }
    async getHabitDetection() { return this._safe(() => this.request('/smart-ai/habit-detection'), { result: demo.demoInsights.writing }); }
    async getProductivity() { return this._safe(() => this.request('/smart-ai/productivity'), { result: demo.demoInsights.writing }); }
    async getSuggestions() { return this._safe(() => this.request('/smart-ai/suggestions'), { result: demo.demoInsights.suggestions.join('\n') }); }

    // ---------------- Chat (RAG) ----------------
    async chat(query) {
        return this._safe(
            () => this.request('/chat/ask', { method: 'POST', body: JSON.stringify({ query }) }),
            () => {
                const q = query.toLowerCase();
                const key = q.includes('weekend') ? 'weekend' : q.includes('mood') ? 'mood' : 'default';
                return { result: demo.demoChat[key] };
            }
        );
    }

    // Chat With Diary (Phase 7)
    async askDiary(query) {
        return this._safe(
            () => this.request('/chat/ask', { method: 'POST', body: JSON.stringify({ query }) }),
            () => {
                const q = query.toLowerCase();
                const key = q.includes('weekend') ? 'weekend' : q.includes('mood') ? 'mood' : 'default';
                return { result: demo.demoChat[key] };
            }
        );
    }

    // ---------------- Image Upload ----------------
    async uploadImage(memoryId, file) {
        if (this.isDemo) return null; // no-op in demo mode
        const formData = new FormData();
        formData.append('file', file);
        const url = `${API_BASE_URL}/memories/${memoryId}/image`;
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        const res = await fetch(url, { method: 'POST', headers, body: formData });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.detail || 'Image upload failed.');
        }
        return res.json(); // returns updated memory with image_url
    }

    imageUrl(path) {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    }

    async uploadAudio(memoryId, blob) {
        if (this.isDemo) return null;
        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');
        const url = `${API_BASE_URL}/memories/${memoryId}/audio`;
        const headers = {};
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        const res = await fetch(url, { method: 'POST', headers, body: formData });
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.detail || 'Audio upload failed.');
        }
        return res.json();
    }
    // ---------------- Notifications ----------------
    async getNotifications() {
        if (this.isDemo) return [];
        return this.request('/notifications/').catch(() => []);
    }

    async markNotificationRead(id) {
        if (this.isDemo) return null;
        return this.request(`/notifications/${id}/read`, { method: 'POST' }).catch(() => null);
    }

    async createNotification(message) {
        if (this.isDemo) return null;
        return this.request('/notifications/', {
            method: 'POST',
            body: JSON.stringify({ message }),
        }).catch(() => null);
    }

    async clearReadNotifications() {
        if (this.isDemo) return null;
        return this.request('/notifications/read', { method: 'DELETE' }).catch(() => null);
    }
}

export const api = new ApiService();
