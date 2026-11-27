
import { useMemo, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

import useAuthStore from "../../../auth/store/authStore";
import useMenuStore from "../../../common/store/menuStore";

import { getScreenAccessMenuApi } from "../../../api/screenAccessApi";

import "./Sidebar.css";

import {
  FiHome,
  FiUserPlus,
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiX,
  FiUser,
  FiFolder,
  FiShield,
  FiFileText,
} from "react-icons/fi";

import SettingsPanel from "../Settings/SettingsPanel";

/* =========================================================
   MENU ICONS
========================================================= */

const MENU_ICONS = {
  FiHome,
  FiUserPlus,
  FiUserCheck,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiFolder,
  FiShield,
  FiFileText,
};

/* =========================================================
   MENU ROUTES
========================================================= */

const MENU_ROUTES = {
  1: {
    user: "/coresettings",
    admin: "/admin/coresettings",
  },

  2: {
    user: "/authorization/roles",
    admin: "/admin/authorization/roleNaccess",
  },

  3: {
    user: "/operation/onboarding/welcome-board",
    admin: "/admin/onboarding",
  },

  4: {
    user: "/attendance",
    admin: "/admin/attendance",
  },

  5: {
    user: "/leave",
    admin: "/admin/leave",
  },

  6: {
    user: "/payroll",
    admin: "/admin/payroll",
  },

  7: {
    user: "/reports",
    admin: "/admin/reports",
  },
};

/* =========================================================
   GET MENU ICON
========================================================= */

const getMenuIcon = (iconName) => {
  return MENU_ICONS[iconName] || FiFolder;
};

/* =========================================================
   GET MENU ROUTE
========================================================= */


const getMenuRoute = (menu, mode) => {
  const menuId = Number(menu.ID);

  const configuredRoute = MENU_ROUTES[menuId]?.[mode];

  if (configuredRoute) {
    return configuredRoute;
  }

  const slug = String(menu.MenuName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  return mode === "admin"
    ? `/admin/${slug}`
    : `/${slug}`;
};


/* =========================================================
   SIDEBAR
========================================================= */

function Sidebar({
  mobileOpen = false,
  setMobileOpen,
  mode = "user",
}) {
  const [showSettings, setShowSettings] = useState(false);

  const [activeModuleId, setActiveModuleId] = useState(null);

  const [isSwitchingPanel, setIsSwitchingPanel] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  /* =====================================================
     AUTH STORE
  ===================================================== */

  const setWorkspace = useAuthStore(
    (state) => state.setWorkspace,
  );

  const employeeId = useAuthStore(
    (state) => state.employeeId,
  );

  const menus = useAuthStore(
    (state) => state.menus,
  );

  const adminMenus = useAuthStore(
    (state) => state.adminMenus,
  );

  const setAdminMenus = useAuthStore(
    (state) => state.setAdminMenus,
  );

  const roleId = useAuthStore(
    (state) => state.roleId,
  );

  /* =====================================================
     MENU STORE
  ===================================================== */

  const fetchModuleMenu = useMenuStore(
    (state) => state.fetchModuleMenu,
  );

  const loadingModules = useMenuStore(
    (state) => state.loadingModules,
  );

  /* =====================================================
     SIDEBAR MODULE ITEMS
     USER  -> EXISTING LOGIN MENUS
     ADMIN -> SCREEN ACCESS API MENUS
  ===================================================== */

  const menuItems = useMemo(() => {
    const currentMenus =
      mode === "admin" ? adminMenus : menus;

    if (!Array.isArray(currentMenus)) {
      return [];
    }

    return [...currentMenus]
      .filter((menu) => menu?.ID && menu?.MenuName)
      .sort((a, b) => {
        const orderA = Number(a.PanelOrder ?? 0);
        const orderB = Number(b.PanelOrder ?? 0);

        return orderA - orderB;
      })
      .map((menu) => ({
        id: menu.ID,
        label: menu.MenuName,
        path: getMenuRoute(menu, mode),
        icon: getMenuIcon(menu.Icon),
        panelType: menu.PanelType,
        panelOrder: menu.PanelOrder,
      }));
  }, [menus, adminMenus, mode]);

  /* =====================================================
     ADMIN MODULE CLICK
     FETCH MODULE-SPECIFIC MENU
  ===================================================== */


const handleAdminModuleClick = async (moduleId) => {
    if (!moduleId || !employeeId) {
        console.error("Module ID or Employee ID is missing.");
        return;
    }

    setActiveModuleId(moduleId);

    try {
        const menuData = await fetchModuleMenu(
            moduleId,
            employeeId,
            "Admin"
        );

        if (!Array.isArray(menuData) || menuData.length === 0) {
            console.error(
                "No submenu data returned for this module."
            );
            return;
        }

        console.log("MODULE SUBMENU RESPONSE:", menuData);

        // API returns PascalCase properties.
        // Navigate to the first accessible screen.
        const firstMenu = [...menuData]
            .filter((item) => item.ScreenName || item.screenName)
            .sort(
                (a, b) =>
                    Number(a.ScreenSequence ?? a.screenSequence ?? 0) -
                    Number(b.ScreenSequence ?? b.screenSequence ?? 0)
            )[0];

        const targetRoute =
            firstMenu?.ScreenName || firstMenu?.screenName;

        if (!targetRoute) {
            console.error(
                "No valid navigation route found in module response."
            );
            return;
        }

        navigate(targetRoute);

        setMobileOpen?.(false);

    } catch (error) {
        console.error(
            "Unable to open Admin module:",
            error?.response?.data || error
        );
    } finally {
        setActiveModuleId(null);
    }
};


  /* =====================================================
     SWITCH USER / ADMIN PANEL
  ===================================================== */

  const handlePanelSwitch = async () => {
    if (isSwitchingPanel) {
      return;
    }

    setShowSettings(false);

    /* ================================================
       ADMIN -> USER
       KEEP EXISTING USER MENUS
    ================================================ */

    if (mode === "admin") {
      setWorkspace("user");

      navigate("/dashboard");

      return;
    }

    /* ================================================
       USER -> ADMIN
       CALL SCREEN ACCESS API
    ================================================ */

    if (!employeeId) {
      console.error("Employee ID is missing.");
      return;
    }

    try {
      setIsSwitchingPanel(true);

      console.log("Fetching Admin Screen Access Menus:", {
        EmployeeId: employeeId,
        Screentype: "Admin",
      });

      const response = await getScreenAccessMenuApi(
        employeeId,
        "Admin",
      );

      // API currently returns a direct array.
      const adminMenuData = Array.isArray(response)
        ? response
        : response?.data ?? [];

      if (
        !Array.isArray(adminMenuData) ||
        adminMenuData.length === 0
      ) {
        console.error(
          "No Admin menus returned from ScreenAccess API.",
        );
        return;
      }

      console.log(
        "ADMIN SCREEN ACCESS MENUS:",
        adminMenuData,
      );

      // Store Admin menus separately.
      setAdminMenus(adminMenuData);

      // Switch workspace after successful API response.
      setWorkspace("admin");

      // Open default Admin dashboard.
      navigate("/admin/coresettings/organization");

    } catch (error) {
      console.error(
        "Unable to fetch Admin menus:",
        error?.response?.data || error,
      );
    } finally {
      setIsSwitchingPanel(false);
    }
  };

  /* =====================================================
     MOBILE MENU
  ===================================================== */

  const handleMenuClick = () => {
    setMobileOpen?.(false);
  };

  /* =====================================================
     SETTINGS
  ===================================================== */

  const handleSettingsOpen = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`hrms-sidebar ${
          mobileOpen ? "mobile-sidebar-open" : ""
        }`}
      >
        {/* MOBILE CLOSE */}

        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setMobileOpen?.(false)}
          aria-label="Close navigation"
          title="Close menu"
        >
          <FiX size={20} />
        </button>

        {/* LOGO */}

        <div className="sidebar-logo-area">
          <img
            src="/CompanyLogo.png"
            alt="Company Logo"
            className="sidebar-logo"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </div>

        {/* MAIN MENU */}

        <nav className="sidebar-menu">

          {/* USER DASHBOARD - EXISTING BEHAVIOUR */}

          {mode === "user" && (
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={handleMenuClick}
            >
              <span className="sidebar-icon">
                <FiHome size={23} strokeWidth={2} />
              </span>

              <span className="sidebar-label">
                Dashboard
              </span>
            </NavLink>
          )}

          {/* ME - HARDCODED USER MAIN MENU */}

          {mode === "user" && (
            <NavLink
              to="/me"
              end
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={handleMenuClick}
            >
              <span className="sidebar-icon">
                <FiUser size={23} strokeWidth={2} />
              </span>

              <span className="sidebar-label">
                ME
              </span>
            </NavLink>
          )}

          {/* MODULE MENUS */}

          {menuItems.map((item) => {
            const Icon = item.icon;

          const isLoading =
    mode === "admin" &&
    activeModuleId === item.id &&
    Boolean(
        loadingModules[
            `${employeeId}_${item.id}_Admin`
        ],
    );

            // USER NAVIGATION:
            // KEEP EXISTING BEHAVIOUR

            if (mode === "user") {
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive ? "active" : ""
                    }`
                  }
                  onClick={handleMenuClick}
                >
                  <span className="sidebar-icon">
                    <Icon size={23} strokeWidth={2} />
                  </span>

                  <span className="sidebar-label">
                    {item.label}
                  </span>
                </NavLink>
              );
            }

            // ADMIN NAVIGATION:
            // FETCH MODULE API MENU

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-link ${
                  activeModuleId === item.id ||
                  location.pathname === item.path ||
                  location.pathname.startsWith(
                    `${item.path}/`,
                  )
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleAdminModuleClick(item.id)
                }
                disabled={isLoading}
              >
                <span className="sidebar-icon">
                  <Icon size={23} strokeWidth={2} />
                </span>

                <span className="sidebar-label">
                  {item.label}
                </span>

                {isLoading && (
                  <span className="sidebar-loading">
                    ...
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* FOOTER SETTINGS */}

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-link sidebar-settings-link"
            onClick={handleSettingsOpen}
            aria-label="Settings"
            title="Settings"
          >
            <span className="sidebar-icon">
              <FiSettings size={23} strokeWidth={2} />
            </span>
          </button>
        </div>
      </aside>

      {/* SETTINGS PANEL */}

      <SettingsPanel
        show={showSettings}
        onClose={handleSettingsClose}
        onAdminPanel={handlePanelSwitch}
        isAdmin={mode === "admin"}
        isSwitchingPanel={isSwitchingPanel}
      />
    </>
  );
}

export default Sidebar;
