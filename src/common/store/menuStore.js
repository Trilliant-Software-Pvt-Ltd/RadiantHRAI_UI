import { create } from "zustand";

import { getSubMenu } from "../../common/services/menuApi";

// =====================================================
// MENU STORE
// =====================================================

const useMenuStore = create((set, get) => ({
    moduleMenus: {},
    loadingModules: {},
    errors: {},

    // =================================================
    // FETCH MENU FOR A MODULE
    // =================================================

    fetchModuleMenu: async (
        moduleId,
        employeeId,
        screenType = "Admin",
        forceRefresh = false
    ) => {
        if (!moduleId || !employeeId) {
            return [];
        }

        // Cache based on EmployeeID + ModuleID + ScreenType
        const cacheKey = `${employeeId}_${moduleId}_${screenType}`;

        if (
            !forceRefresh &&
            Object.prototype.hasOwnProperty.call(
                get().moduleMenus,
                cacheKey
            )
        ) {
            return get().moduleMenus[cacheKey];
        }

        if (get().loadingModules[cacheKey]) {
            return [];
        }

        set((state) => ({
            loadingModules: {
                ...state.loadingModules,
                [cacheKey]: true,
            },
            errors: {
                ...state.errors,
                [cacheKey]: null,
            },
        }));

        try {
            const response = await getSubMenu(
                employeeId,
                screenType,
                moduleId
            );

            const menuData = Array.isArray(response)
                ? response
                : [];

            set((state) => ({
                moduleMenus: {
                    ...state.moduleMenus,
                    [cacheKey]: menuData,
                },
            }));

            return menuData;

        } catch (error) {
            console.error("Failed to fetch submenu:", error);

            set((state) => ({
                errors: {
                    ...state.errors,
                    [cacheKey]:
                        error?.response?.data?.Message ||
                        error?.message ||
                        "Unable to load menu.",
                },
            }));

            return [];

        } finally {
            set((state) => ({
                loadingModules: {
                    ...state.loadingModules,
                    [cacheKey]: false,
                },
            }));
        }
    },

    // =================================================
    // CLEAR MENU DATA
    // =================================================

    clearMenus: () => {
        set({
            moduleMenus: {},
            loadingModules: {},
            errors: {},
        });
    },
}));

export default useMenuStore;