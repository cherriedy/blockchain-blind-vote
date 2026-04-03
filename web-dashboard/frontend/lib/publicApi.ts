import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const publicApi = axios.create({
    baseURL: `${BACKEND_URL}/api`,
});

export default publicApi;