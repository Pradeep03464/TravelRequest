import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

api.interceptors.request.use(
    (config) => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.accessToken) {
                config.headers.Authorization = `Bearer ${user.accessToken}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
