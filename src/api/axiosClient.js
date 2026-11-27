import axios from "axios";
import useAuthStore from "../auth/store/authStore";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL_LOGIN,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000,
});

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

axiosClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);
/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const { isAuthenticated, logout } =
                useAuthStore.getState();

            if (isAuthenticated) {
                logout();
            }
        }

        return Promise.reject(error);
    }
);
export default axiosClient;