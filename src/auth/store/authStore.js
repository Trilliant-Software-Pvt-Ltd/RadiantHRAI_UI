import { create } from "zustand";

/* =========================================================
   AUTH STORAGE KEYS
========================================================= */

const AUTH_STORAGE_KEYS = [
  "auth",
  "user",
  "token",
  "refreshToken",
  "accessId",
  "workspace",
  "employeeId",
  "employeeName",
  "roleId",
  "selectedRoleId",
  "sourceID",
  "menus",
  "adminMenus",
];

/* =========================================================
   CLEAR LEGACY LOCAL STORAGE
========================================================= */

const clearLegacyAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
};

/* =========================================================
   CLEAR AUTH STORAGE
========================================================= */

const clearAuthStorage = () => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  });
};

/* =========================================================
   GET STORED USER MENUS
========================================================= */

const getStoredMenus = (user) => {
  try {
    const storedMenus = sessionStorage.getItem("menus");

    if (storedMenus) {
      return JSON.parse(storedMenus);
    }

    return Array.isArray(user?.Menus) ? user.Menus : [];
  } catch {
    return [];
  }
};

/* =========================================================
   GET STORED ADMIN MENUS
========================================================= */

const getStoredAdminMenus = () => {
  try {
    const storedMenus = sessionStorage.getItem("adminMenus");

    return storedMenus ? JSON.parse(storedMenus) : [];
  } catch {
    return [];
  }
};

/* =========================================================
   AUTH STORE
========================================================= */

const useAuthStore = create((set) => ({
  user: null,
  token: null,

  // Logged-in employee details
  employeeId: null,
  employeeName: "",

  // Logged-in user's actual role
  roleId: null,

  // Role currently selected in Role Access
  selectedRoleId: null,

  // Owner permission of currently selected role
  selectedRolePermission: null,

  // Existing User Panel menus
  menus: [],

  // Admin Panel menus from ScreenAccess/GetMenu
  adminMenus: [],

  isAuthenticated: false,
  workspace: "user",
  isInitialized: false,

  /* =========================================================
     LOGIN
  ========================================================= */

  login: (user, token) => {
    const menus = Array.isArray(user?.Menus)
      ? user.Menus
      : [];

    const roleId = user?.RoleID ?? null;
    const employeeId = user?.EmployeeID ?? null;
    const employeeName = user?.EmployeeName || "";
    const sourceID = user?.SourceID || "";

    // New login should not reuse previous Admin menus.
    const adminMenus = [];

    // Clear previous authentication details
    clearAuthStorage();

    sessionStorage.setItem("auth", "true");
    sessionStorage.setItem("user", JSON.stringify(user));
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("workspace", "user");
    sessionStorage.setItem("menus", JSON.stringify(menus));

    sessionStorage.setItem(
      "adminMenus",
      JSON.stringify(adminMenus),
    );

    sessionStorage.setItem(
      "employeeId",
      String(employeeId ?? ""),
    );

    sessionStorage.setItem("employeeName", employeeName);
    sessionStorage.setItem("roleId", String(roleId ?? ""));
    sessionStorage.setItem("sourceID", String(sourceID));

    set({
      user,
      token,

      employeeId:
        employeeId !== null && employeeId !== undefined
          ? String(employeeId)
          : null,

      employeeName,
      roleId,

      selectedRoleId: null,
      selectedRolePermission: null,

      menus,
      adminMenus,

      isAuthenticated: true,
      workspace: "user",
      isInitialized: true,
    });
  },

  /* =========================================================
     ROLE MANAGEMENT
  ========================================================= */

  setSelectedRoleId: (roleId) => {
    const updatedRoleId = roleId
      ? Number(roleId)
      : null;

    if (updatedRoleId !== null) {
      sessionStorage.setItem(
        "selectedRoleId",
        String(updatedRoleId),
      );
    } else {
      sessionStorage.removeItem("selectedRoleId");
    }

    set({
      selectedRoleId: updatedRoleId,
      selectedRolePermission: null,
    });
  },

  setSelectedRolePermission: (permission) => {
    set({
      selectedRolePermission:
        typeof permission === "boolean"
          ? permission
          : null,
    });
  },

  /* =========================================================
     UPDATE USER MENUS
  ========================================================= */

  setMenus: (menus) => {
    const updatedMenus = Array.isArray(menus)
      ? menus
      : [];

    sessionStorage.setItem(
      "menus",
      JSON.stringify(updatedMenus),
    );

    set({
      menus: updatedMenus,
    });
  },

  /* =========================================================
     UPDATE ADMIN MENUS
  ========================================================= */

  setAdminMenus: (adminMenus) => {
    const updatedMenus = Array.isArray(adminMenus)
      ? adminMenus
      : [];

    sessionStorage.setItem(
      "adminMenus",
      JSON.stringify(updatedMenus),
    );

    set({
      adminMenus: updatedMenus,
    });
  },

  /* =========================================================
     WORKSPACE
  ========================================================= */

  setWorkspace: (workspace) => {
    sessionStorage.setItem("workspace", workspace);

    set({
      workspace,
    });
  },

  /* =========================================================
     LOGOUT
  ========================================================= */

  logout: () => {
    clearAuthStorage();

    set({
      user: null,
      token: null,

      employeeId: null,
      employeeName: "",

      roleId: null,
      selectedRoleId: null,
      selectedRolePermission: null,

      menus: [],
      adminMenus: [],

      isAuthenticated: false,
      workspace: "user",
      isInitialized: true,
    });
  },

  /* =========================================================
     INITIALIZE AUTHENTICATION
  ========================================================= */

  initializeAuth: () => {
    // Remove old authentication data from localStorage
    clearLegacyAuthStorage();

    const auth = sessionStorage.getItem("auth");
    const storedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    const workspace =
      sessionStorage.getItem("workspace") || "user";

    if (auth === "true" && storedUser && token) {
      try {
        const user = JSON.parse(storedUser);

        if (!user || typeof user !== "object") {
          throw new Error("Invalid stored user");
        }

        const menus = getStoredMenus(user);
        const adminMenus = getStoredAdminMenus();

        const roleId =
          user?.RoleID ??
          (sessionStorage.getItem("roleId")
            ? Number(sessionStorage.getItem("roleId"))
            : null);

        const selectedRoleId = sessionStorage.getItem(
          "selectedRoleId",
        )
          ? Number(sessionStorage.getItem("selectedRoleId"))
          : null;

        const employeeId =
          sessionStorage.getItem("employeeId") ||
          (user?.EmployeeID !== undefined &&
          user?.EmployeeID !== null
            ? String(user.EmployeeID)
            : null);

        const employeeName =
          sessionStorage.getItem("employeeName") ||
          user?.EmployeeName ||
          "";

        set({
          user,
          token,

          employeeId,
          employeeName,

          roleId,
          selectedRoleId,
          selectedRolePermission: null,

          menus,
          adminMenus,

          isAuthenticated: true,
          workspace,
          isInitialized: true,
        });

        return;
      } catch {
        clearAuthStorage();
      }
    }

    // Clear incomplete or invalid authentication data
    clearAuthStorage();

    set({
      user: null,
      token: null,

      employeeId: null,
      employeeName: "",

      roleId: null,
      selectedRoleId: null,
      selectedRolePermission: null,

      menus: [],
      adminMenus: [],

      isAuthenticated: false,
      workspace: "user",
      isInitialized: true,
    });
  },
}));

export default useAuthStore;