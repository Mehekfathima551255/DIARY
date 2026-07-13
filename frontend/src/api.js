const API_BASE_URL = 'http://localhost:8000';
// Mock User ID for now since auth isn't fully set up in frontend
const MOCK_USER_ID = 1; 

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

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

    async getMemories(skip = 0, limit = 50) {
        return this.request(`/memories/?skip=${skip}&limit=${limit}`);
    }

    async getMemory(id) {
        return this.request(`/memories/${id}`);
    }

    async createMemory(data) {
        return this.request(`/memories/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, user_id: MOCK_USER_ID })
        });
    }

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
