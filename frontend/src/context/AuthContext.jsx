import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const userStr = localStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    });

    useEffect(() => {
        const syncUser = (e) => {
            if (e.key === 'user') {
                setUser(e.newValue ? JSON.parse(e.newValue) : null);
            }
        };
        window.addEventListener('storage', syncUser);
        return () => window.removeEventListener('storage', syncUser);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/signin', { email, password });
            if (res.data.accessToken) {
                localStorage.setItem('user', JSON.stringify(res.data));
                setUser(res.data);
            }
            return res.data;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    };

    const register = async (userData) => {
        try {
            const res = await api.post('/auth/signup', userData);
            return res.data;
        } catch (error) {
            // Prefer explicit server message, fall back to the Axios error message
            const serverMessage = error?.response?.data?.message || error?.response?.data;
            throw serverMessage || error?.message || 'Registration failed';
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
