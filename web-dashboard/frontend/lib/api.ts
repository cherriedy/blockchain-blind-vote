import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
    const walletAddress = localStorage.getItem('walletAddress');

    if (walletAddress) {
        config.headers['x-admin-wallet-address'] = walletAddress;
    }

    return config;
});

export default api;