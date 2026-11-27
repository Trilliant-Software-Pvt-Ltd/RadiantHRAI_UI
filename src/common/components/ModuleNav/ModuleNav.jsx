
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

import useMenuStore from "../../../common/store/menuStore";
import useAuthStore from "../../../auth/store/authStore";

import {
    ADMIN_MODULE_ROUTES,
    OPERATION_MODULE_ROUTES,
} from "../../../common/utils/moduleConfig";

import { buildMenuTree } from "../../../common/utils/menuMapper";

import "./ModuleNav.css";

// =====================================================
// HARDCODED USER MODULE NAVIGATION
// =====================================================

const userModuleNavigation = {
    "/preboarding": [
        { label: "PREBOARDING", path: "/preboarding" },
        { label: "CANDIDATES", path: "/preboarding/candidates" },
        { label: "OFFER LETTER", path: "/preboarding/offer-letter" },
    ],

    "/me": [
        { label: "Attendance", path: "/me" },
        { label: "Leave", path: "/me/leave" },
    ],

    "/executive-overview": [
        { label: "EXECUTIVE OVERVIEW", path: "/executive-overview" },
        {
            label: "EMPLOYEE ANALYTICS",
            path: "/executive-overview/employee-analytics",
        },
        {
            label: "PAYROLL ANALYTICS",
            path: "/executive-overview/payroll-analytics",
        },
        {
            label: "ATTENDANCE ANALYTICS",
            path: "/executive-overview/attendance-analytics",
        },
    ],

    "/payroll": [
        { label: "PAYROLL", path: "/payroll" },
        { label: "SALARY", path: "/payroll/salary" },
        { label: "PAYSLIP", path: "/payroll/payslip" },
        { label: "PAYROLL PROCESS", path: "/payroll/process" },
    ],
};

// =====================================================
// RECURSIVE API MENU ITEMS
// =====================================================

function ModuleMenuItems({ items }) {
    const location = useLocation();

    return items.map((item) => {
        const hasChildren =
            Array.isArray(item.children) &&
            item.children.length > 0;

        const isActive =
            Boolean(item.path) &&
            (
                location.pathname === item.path ||
                location.pathname.startsWith(
                    `${item.path}/`
                )
            );

        return (
            <div
                key={`${item.id}-${item.subMenuId}`}
                className="admin-module-nav-item"
            >
                {item.path ? (
                    <NavLink
                        to={item.path}
                        className={`module-nav-link ${
                            isActive ? "active" : ""
                        }`}
                    >
                        {item.label}
                    </NavLink>
                ) : (
                    <span className="module-nav-link">
                        {item.label}
                    </span>
                )}

                {hasChildren && (
                    <div className="admin-module-nav-children">
                        <ModuleMenuItems
                            items={item.children}
                        />
                    </div>
                )}
            </div>
        );
    });
}

// =====================================================
// HARDCODED USER MENU ITEMS
// =====================================================

function UserModuleMenuItems({ items }) {
    return items.map((item) => (
        <NavLink
            key={item.path}
            to={item.path}
            end={item.path === getBasePath(item.path)}
            className={({ isActive }) =>
                `module-nav-link ${isActive ? "active" : ""}`
            }
        >
            {item.label}
        </NavLink>
    ));
}

function getBasePath(path) {
    const knownPaths = Object.keys(userModuleNavigation);

    return (
        knownPaths.find(
            (basePath) =>
                path === basePath ||
                path.startsWith(`${basePath}/`)
        ) || path
    );
}

// =====================================================
// MODULE NAV
// =====================================================

function ModuleNav({ mode = "user" }) {
    const location = useLocation();

    // AUTH STORE
    const employeeId = useAuthStore(
        (state) => state.employeeId
    );

    const userMenus = useAuthStore(
        (state) => state.menus
    );

    const adminMenus = useAuthStore(
        (state) => state.adminMenus
    );

    // MENU STORE
    const moduleMenus = useMenuStore(
        (state) => state.moduleMenus
    );

    const loadingModules = useMenuStore(
        (state) => state.loadingModules
    );

    const fetchModuleMenu = useMenuStore(
        (state) => state.fetchModuleMenu
    );

    // GLOBAL DASHBOARD
    const isGlobalDashboard =
        mode === "user" &&
        location.pathname === "/dashboard";

    // =================================================
    // USER HARDCODED NAVIGATION
    // =================================================

    const isHardcodedUserModule =
        mode === "user" &&
        Object.keys(userModuleNavigation).some(
            (basePath) =>
                location.pathname === basePath ||
                location.pathname.startsWith(`${basePath}/`)
        );

    const currentUserBasePath =
        mode === "user"
            ? Object.keys(userModuleNavigation).find(
                (basePath) =>
                    location.pathname === basePath ||
                    location.pathname.startsWith(`${basePath}/`)
            )
            : null;

    const userItems = currentUserBasePath
        ? userModuleNavigation[currentUserBasePath]
        : [];

    // =================================================
    // DYNAMIC ADMIN / OPERATION NAVIGATION
    // =================================================

    const screenType =
        mode === "admin" ? "Admin" : "Operation";

    const availableMenus =
        mode === "admin" ? adminMenus : userMenus;

    const moduleRoutes =
        mode === "admin"
            ? ADMIN_MODULE_ROUTES
            : OPERATION_MODULE_ROUTES;

    const currentModule =
        mode === "user" && isHardcodedUserModule
            ? null
            : Array.isArray(availableMenus)
                ? availableMenus.find((menu) => {
                    const moduleRoute =
                        moduleRoutes[Number(menu.ID)];

                    if (!moduleRoute) return false;

                    return (
                        location.pathname === moduleRoute ||
                        location.pathname.startsWith(
                            `${moduleRoute}/`
                        )
                    );
                })
                : null;

    // CACHE KEY
    const cacheKey =
        currentModule && employeeId
            ? `${employeeId}_${currentModule.ID}_${screenType}`
            : null;

    // =================================================
    // FETCH DYNAMIC SUBMENUS
    // =================================================

    useEffect(() => {
        if (
            !currentModule?.ID ||
            !employeeId ||
            !cacheKey ||
            isGlobalDashboard
        ) {
            return;
        }

        const hasCachedMenu =
            Object.prototype.hasOwnProperty.call(
                moduleMenus,
                cacheKey
            );

        const isLoading = Boolean(
            loadingModules[cacheKey]
        );

        if (!hasCachedMenu && !isLoading) {
            fetchModuleMenu(
                currentModule.ID,
                employeeId,
                screenType
            );
        }
    }, [
        currentModule?.ID,
        employeeId,
        cacheKey,
        screenType,
        isGlobalDashboard,
        moduleMenus,
        loadingModules,
        fetchModuleMenu,
    ]);

    // =================================================
    // RENDER
    // =================================================

    if (isGlobalDashboard) return null;

    // USER HARDCODED MODULES
    if (mode === "user" && isHardcodedUserModule) {
        return (
            <nav className="module-nav">
                <div className="module-nav-scroll">
                    <UserModuleMenuItems items={userItems} />
                </div>
            </nav>
        );
    }

    // ADMIN / OPERATION DYNAMIC MODULES
    if (!currentModule || !cacheKey) return null;

    const rawMenuData =
        moduleMenus[cacheKey] || [];

    const menuTree = buildMenuTree(rawMenuData);

    const isLoading = Boolean(
        loadingModules[cacheKey]
    );

    if (!menuTree.length && !isLoading) {
        return null;
    }

    return (
        <nav className="module-nav">
            <div className="module-nav-scroll">
                {isLoading && !menuTree.length ? (
                    <div className="module-nav-loading">
                        Loading menus...
                    </div>
                ) : (
                    <ModuleMenuItems items={menuTree} />
                )}
            </div>
        </nav>
    );
}

export default ModuleNav;
