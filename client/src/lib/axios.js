import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
        "X-Requested-With": "XMLHttpRequest",
    },
    timeout: 10000,
});

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // We'll implement automatic token refresh here later.

        return Promise.reject(error);
    },
);

export default api;
