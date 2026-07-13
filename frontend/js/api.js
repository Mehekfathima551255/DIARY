const API_BASE_URL = 'http://localhost:8000';
// Mock User ID for now since auth isn't fully set up in frontend
const MOCK_USER_ID = 1; 

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            // In a real app, add Authorization header here
            ...(options.headers || {})
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
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

    // Memories
    async getMemories(skip = 0, limit = 50) {
        return this.request(`/memories/?skip=${skip}&limit=${limit}`);
    }

    async getMemory(id) {
        return this.request(`/memories/${id}`);
    }

    async createMemory(data) {
        // Automatically append user_id for the mock
        return this.request(`/memories/`, {
            method: 'POST',
            body: JSON.stringify({ ...data, user_id: MOCK_USER_ID })
        });
    }

    // AI Tools (Phase 4)
    async summarizeMemory(memoryId) {
        return this.request(`/ai/summarize/${memoryId}`, { method: 'POST' });
    }

    async analyzeMood(memoryId) {
        return this.request(`/ai/analyze_mood/${memoryId}`, { method: 'POST' });
    }

    async generateTags(memoryId) {
        return this.request(`/ai/generate_tags/${memoryId}`, { method: 'POST' });
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

// Export a singleton instance
window.api = new ApiService();
