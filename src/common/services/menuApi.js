import axios from "axios";
import useAuthStore from "../../auth/store/authStore";

// =====================================================
// MENU API CLIENT
// =====================================================

const menuClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL_MENU,
    timeout: 30000,
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

menuClient.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// =====================================================
// GET SUB MENU
// =====================================================

export const getSubMenu = async (
    employeeId,
    screenType,
    moduleId
) => {
    const response = await menuClient.get(
        "/ScreenAccess/GetSubMenu",
        {
            params: {
                EmployeeId: employeeId,
                Screentype: screenType,
                ModuleId: moduleId,
            },
        }
    );

    return response.data;
};

export default menuClient;