import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const userData = await api.getMe();
                    setUser(userData);
                } catch (error) {
                    console.error("Failed to authenticate token", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = async (email, password) => {
        const data = await api.login(email, password);
        localStorage.setItem('token', data.access_token);
        const userData = await api.getMe();
        setUser(userData);
    };

    const register = async (name, email, password) => {
        await api.register(name, email, password);
        // After registration, log the user in automatically
        await login(email, password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
