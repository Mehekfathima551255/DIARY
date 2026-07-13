const API_BASE_URL = 'http://localhost:8000';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        // Attach JWT token if it exists
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...options, headers });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        // FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
        const url = `${API_BASE_URL}/auth/login`;
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Login failed");
        }

        return await response.json();
    }

    async register(name, email, password) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    // Memories
    async getMemories(skip = 0, limit = 50) {
        return this.request(`/memories/?skip=${skip}&limit=${limit}`);
    }

    async getMemory(id) {
        return this.request(`/memories/${id}`);
    }

    async createMemory(data) {
        return this.request(`/memories/`, {
            method: 'POST',
            body: JSON.stringify(data) 
        });
    }

    async updateMemory(id, data) {
        return this.request(`/memories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async searchMemories(query) {
        return this.request(`/memories/search?q=${encodeURIComponent(query)}`);
    }

    async getMemoriesByMood(mood) {
        return this.request(`/memories/filter/mood?mood=${encodeURIComponent(mood)}`);
    }

    async getFavoriteMemories() {
        return this.request(`/memories/filter/favorite`);
    }

    async getMemoriesByTag(tag) {
        return this.request(`/memories/filter/tag?tag=${encodeURIComponent(tag)}`);
    }

    // Dashboard (Phase 4)
    async getDashboardStats() {
        return this.request('/dashboard/stats');
    }

    async getMoodChart() {
        return this.request('/dashboard/mood-chart');
    }

    async getTopTags() {
        return this.request('/dashboard/top-tags');
    }

    async getRecentMemories() {
        return this.request('/dashboard/recent');
    }

    async getStreak() {
        return this.request('/dashboard/streak');
    }

    async getCalendar() {
        return this.request('/dashboard/calendar');
    }

    // Smart AI Features (Phase 5)
    async getSuggestions() {
        return this.request('/smart-ai/suggestions');
    }

    async getWeeklyReflection() {
        return this.request('/smart-ai/weekly-reflection');
    }

    async getMonthlyReflection() {
        return this.request('/smart-ai/monthly-reflection');
    }
    
    async getAggregateMoodAnalysis() {
        return this.request('/smart-ai/mood-analysis');
    }
}

export const api = new ApiService();
