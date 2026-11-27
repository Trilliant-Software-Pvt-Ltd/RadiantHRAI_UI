import axios from "axios";
import useAuthStore from "../auth/store/authStore";

const menuClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL_MENU,
    headers: {
        "Content-Type": "application/json",
    },
});

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

menuClient.interceptors.request.use(
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

menuClient.interceptors.response.use(
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

export default menuClient;