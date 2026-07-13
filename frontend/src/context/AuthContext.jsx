import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => (api.token ? api.getUser() : null));
    const [loading] = useState(false);

    const login = useCallback(async (email, password) => {
        const u = await api.login(email, password);
        setUser(u);
        return u;
    }, []);

    const register = useCallback(async (name, email, password) => {
        const u = await api.register(name, email, password);
        setUser(u);
        return u;
    }, []);

    const loginDemo = useCallback(() => {
        const u = api.loginDemo();
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(() => {
        api.logout();
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginDemo, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Separate export so Fast Refresh works cleanly
export function useAuth() {
    return useContext(AuthContext);
}
