
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import menuClient from "../../../api/axiosClientMenu";
import useAuthStore from "../../../auth/store/authStore.js";

import FormSelect from "../../../common/components/Form/FormSelect";
import FormOffcanvas from "../../../common/components/offcanvas/FormOffcanvas";
import Toast from "../../../common/components/Popups/Toast";
import Alert from "../../../common/components/Popups/Alert.jsx";

import {
  DashboardCard,
  DashboardCardGrid,
} from "../../../common/components/Card/DashboardCards";

import {
  FiUsers,
  FiUser,
  FiGrid,
  FiShield,
  FiPlus,
  FiSearch,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiBarChart2,
  FiBookOpen,
  FiFileText,
  FiLayout,
  FiX,
  FiInfo,
  FiLock,
  FiUserCheck,
} from "react-icons/fi";

import "./roleNaccess.css";

// =====================================================
// MODULE ICON MAPPING
// =====================================================

const moduleIconMap = {
  dashboard: FiLayout,
  "core setting": FiGrid,
  authorization: FiShield,
  onboarding: FiUser,
  attendance: FiCalendar,
  payroll: FiDollarSign,
  performance: FiBarChart2,
  learning: FiBookOpen,
  reports: FiFileText,
};

const getModuleIcon = (moduleName) => {
  const normalizedName = String(moduleName || "").toLowerCase();

  return (
    moduleIconMap[normalizedName] ||
    Object.entries(moduleIconMap).find(([key]) =>
      normalizedName.includes(key),
    )?.[1] ||
    FiGrid
  );
};

// =====================================================
// API HELPERS
// =====================================================

const getApiErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.title ||
  error?.message ||
  "Something went wrong. Please try again.";

const getApiArray = (data) => {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.result)) return data.result;

  return [];
};

// =====================================================
// ROLE MAPPER
// =====================================================

const mapRoleFromApi = (role) => ({
  id: Number(role.rdhR0000LIVID),
  name: role.rdhR0000LIVName || "",
  description: role.rdhR0000LIVDescription || "",
  users: Number(role.employeeCount) || 0,
  status: role.isDeactivated ? "Inactive" : "Active",

  // true = Owner, false = Read and Write
  owner: role.rdhR0000LIVPermission === true,
});

// =====================================================
// MODULE MAPPER
// =====================================================

const mapModuleFromApi = (module) => ({
  id: Number(module.moduleId),
  name: module.name || "",
  icon: getModuleIcon(module.name),
  authScreens: module.authScreens || "0/0",
});

// =====================================================
// SCREEN MAPPER
// =====================================================

const mapScreenFromApi = (screen) => ({
  screenID: Number(screen.screenID),
  screenSubID: Number(screen.screenSubID) || 0,
  rdhR0000ID: Number(screen.rdhR0000ID),
  screenSequence: Number(screen.screenSequence) || 0,
  screenTitle: screen.screenTitle || "",
  formType: screen.formType || "",
  screenType: screen.screenType || "",
  icon: screen.icon || "",
  isSideMenu: Boolean(screen.isSideMenu),
  projectName: screen.projectName || "",
  screenName: screen.screenName || "",
  isApp: Boolean(screen.isApp),
  isAssigned: screen.isAssigned === true,
});

// =====================================================
// USER ASSIGNMENT MAPPER
//
// Supports common camelCase and PascalCase response names.
// Confirm these fields against your actual GetUsers response.
// =====================================================

const mapEmployeeFromApi = (employee) => {
  const assignedValue =
    employee.isAssigned ??
    employee.IsAssigned ??
    false;

  return {
    id: Number(
      employee.employeeId ??
      employee.EmployeeID ??
      employee.employeeID ??
      employee.id
    ),

    name:
      employee.employeeName ??
      employee.EmployeeName ??
      employee.name ??
      "",

    roleId: Number(
      employee.rdhR0000LIVID ??
      employee.roleID ??
      employee.RoleID
    ),

    roleName:
      employee.roleName ??
      employee.RoleName ??
      "",

    assignmentId: Number(
      employee.rdhR0000XLVId ??
      employee.assignmentId ??
      employee.AssignmentID
    ),

    isAssigned:
      assignedValue === true ||
      assignedValue === 1 ||
      assignedValue === "1",
  };
};

// =====================================================
// AUTH DETAILS
// =====================================================

const getCurrentUserDetails = () => {
  const user = useAuthStore.getState().user || {};

  return {
    createdByUser:
      user.EmployeeName ||
      user.employeeName ||
      "",

    sourceID:
      user.SourceID ||
      user.sourceID ||
      "",
  };
};

// =====================================================
// SCREEN COUNT HELPER
// =====================================================

const getAuthScreenCount = (authScreens) => {
  const [authorized, total] = String(authScreens || "0/0")
    .split("/")
    .map((value) => Number(value) || 0);

  return { authorized, total };
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const RoleAccess = () => {
  // =================================================
  // AUTH STORE
  // =================================================

  const selectedRoleId = useAuthStore(
    (state) => state.selectedRoleId,
  );

  const setSelectedRoleId = useAuthStore(
    (state) => state.setSelectedRoleId,
  );

  const employeeId = useAuthStore(
    (state) => state.employeeId,
  );

  // This value is populated from GetAllRole.
  const selectedRolePermission = useAuthStore(
    (state) => state.selectedRolePermission,
  );

  // =================================================
  // ROLE STATES
  // =================================================

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  const [roleSaving, setRoleSaving] = useState(false);
  const [roleDeleting, setRoleDeleting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // =================================================
  // MODULE STATES
  // =================================================

  const [moduleData, setModuleData] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [modulesError, setModulesError] = useState("");

  const [selectedModule, setSelectedModule] = useState(null);

  // =================================================
  // SCREEN STATES
  // =================================================

  const [screens, setScreens] = useState([]);
  const [screensLoading, setScreensLoading] = useState(false);
  const [screensError, setScreensError] = useState("");
  const [screenSaving, setScreenSaving] = useState(false);

  // =================================================
  // USER ASSIGNMENT STATES
  // =================================================

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState("");

  const [assignedUsers, setAssignedUsers] = useState({});
  const [assignmentSaving, setAssignmentSaving] = useState(false);

  // =================================================
  // PERMISSION STATES
  // =================================================

  const [rolePermissions, setRolePermissions] = useState({});
  const [permissionSaving, setPermissionSaving] = useState(false);

  // =================================================
  // GENERAL STATES
  // =================================================

  const [toast, setToast] = useState(null);

  const [activeTab, setActiveTab] = useState("modules");

  const [searchRole, setSearchRole] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");

  // =================================================
// DASHBOARD STATES
// =================================================

const [dashboardCounts, setDashboardCounts] = useState({
  totalRoles: 0,
  totalUsers: 0,
  totalModules: 0,
  totalPermissions: 0,
});

const [dashboardLoading, setDashboardLoading] = useState(false);
  // =================================================
  // ROLE MODAL STATES
  // =================================================

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
  });

  // =================================================
  // TOAST
  // =================================================

  const showToast = useCallback(
    (message, type = "info", duration = 3000) => {
      setToast({
        id: Date.now(),
        message,
        type,
        duration,
      });
    },
    [],
  );

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);
// =================================================
// FETCH DASHBOARD COUNTS
// GET /Dashboard/GetDashboardCounts
// =================================================

const fetchDashboardCounts = useCallback(async () => {
  setDashboardLoading(true);

  try {
    const response = await menuClient.get(
      "/Dashboard/GetDashboardCounts",
    );

    const data = response.data?.data ?? response.data;

    setDashboardCounts({
      totalRoles: Number(data?.totalRoles) || 0,
      totalUsers: Number(data?.totalUsers) || 0,
      totalModules: Number(data?.totalModules) || 0,
      totalPermissions: Number(data?.totalPermissions) || 0,
    });
  } catch (error) {
    showToast(getApiErrorMessage(error), "error");
  } finally {
    setDashboardLoading(false);
  }
}, [showToast]);
  // =================================================
  // FETCH ROLES
  // GET /Menu/GetAllRole
  // =================================================

  const fetchRoles = useCallback(
    async (preferredRoleId = null) => {
      setRolesLoading(true);
      setRolesError("");

      try {
        const response = await menuClient.get("/Menu/GetAllRole");

        const apiRoles = getApiArray(response.data);

        const mappedRoles = apiRoles
          .map(mapRoleFromApi)
          .filter((role) => Number.isFinite(role.id));

        setRoles(mappedRoles);

        // Initialize permission state from API.
        const permissionMap = {};

        mappedRoles.forEach((role) => {
          permissionMap[role.id] = {
            owner: role.owner,
            readWrite: !role.owner,
          };
        });

        setRolePermissions((previous) => ({
          ...permissionMap,
          ...previous,
        }));

        const currentSelectedId =
          useAuthStore.getState().selectedRoleId;

        const requestedId =
          preferredRoleId ?? currentSelectedId;

        const existingRole = mappedRoles.find(
          (role) => role.id === Number(requestedId),
        );

        const nextRoleId = existingRole
          ? existingRole.id
          : mappedRoles[0]?.id ?? null;

        setSelectedRoleId(nextRoleId);

        const nextRole = mappedRoles.find(
          (role) => role.id === Number(nextRoleId),
        );

        // Keep selected role's Owner permission in Zustand.
        useAuthStore.setState({
          selectedRolePermission: nextRole?.owner ?? false,
        });

        return mappedRoles;
      } catch (error) {
        const message = getApiErrorMessage(error);

        setRolesError(message);
        showToast(message, "error");

        return [];
      } finally {
        setRolesLoading(false);
      }
    },
    [setSelectedRoleId, showToast],
  );

  // =================================================
  // FETCH MODULES
  // GET /Menu/GetAllModules/{RoleID}
  // =================================================

  const fetchModules = useCallback(
    async (roleId, preferredModuleId = null) => {
      if (!roleId) {
        setModuleData([]);
        setSelectedModule(null);
        setScreens([]);
        return [];
      }

      setModulesLoading(true);
      setModulesError("");

      setScreens([]);
      setScreensError("");

      try {
        const response = await menuClient.get(
          `/Menu/GetAllModules/${roleId}`,
        );

        const apiModules = getApiArray(response.data);

        const mappedModules = apiModules
          .map(mapModuleFromApi)
          .filter((module) => Number.isFinite(module.id));

        setModuleData(mappedModules);

        const preferredModule = mappedModules.find(
          (module) => module.id === Number(preferredModuleId),
        );

        const nextModuleId =
          preferredModule?.id ??
          mappedModules[0]?.id ??
          null;

        setSelectedModule(nextModuleId);

        return mappedModules;
      } catch (error) {
        const message = getApiErrorMessage(error);

        setModuleData([]);
        setSelectedModule(null);
        setModulesError(message);

        showToast(message, "error");

        return [];
      } finally {
        setModulesLoading(false);
      }
    },
    [showToast],
  );

  // =================================================
  // FETCH SCREENS
  // GET /Menu/GetScreenByID/{ModuleID}
  // =================================================

  const fetchScreens = useCallback(
    async (moduleId, roleId) => {
      if (!moduleId || !roleId) {
        setScreens([]);
        return [];
      }

      setScreensLoading(true);
      setScreensError("");
      setScreens([]);

      try {
       const response = await menuClient.get(
  `/Menu/GetScreenByID/${moduleId}`,
  {
    params: {
      RoleID: Number(roleId),
    },
  },
);

        const apiScreens = getApiArray(response.data);

        const mappedScreens = apiScreens
          .map(mapScreenFromApi)
          .filter((screen) =>
            Number.isFinite(screen.screenID),
          );

        setScreens(mappedScreens);

        return mappedScreens;
      } catch (error) {
        const message = getApiErrorMessage(error);

        setScreens([]);
        setScreensError(message);

        showToast(message, "error");

        return [];
      } finally {
        setScreensLoading(false);
      }
    },
    [showToast],
  );

  // =================================================
  // FETCH USERS
  // GET /UserAssigment/GetUsers
  // =================================================

const fetchEmployees = useCallback(async () => {
  if (!selectedRoleId) return;

  setEmployeesLoading(true);
  setEmployeesError("");

  try {
    const response = await menuClient.get(
      `/UserAssigment/GetUsers/${Number(selectedRoleId)}`
    );

    const employeeList = getApiArray(response.data).map(
      mapEmployeeFromApi
    );

    setEmployees(employeeList);

    // Automatically check employees where API returns isAssigned = 1.
    setAssignedUsers((previous) => ({
      ...previous,
      [selectedRoleId]: employeeList
        .filter((employee) => employee.isAssigned)
        .map((employee) => employee.id),
    }));

  } catch (error) {
    setEmployeesError(getApiErrorMessage(error));
  } finally {
    setEmployeesLoading(false);
  }
}, [selectedRoleId]);

  // =================================================
  // INITIAL ROLE LOAD
  // =================================================

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // =================================================
  // LOAD MODULES WHEN ROLE CHANGES
  // =================================================

  useEffect(() => {
    if (selectedRoleId) {
      fetchModules(selectedRoleId);
    } else {
      setModuleData([]);
      setSelectedModule(null);
      setScreens([]);
    }
  }, [selectedRoleId, fetchModules]);

  // =================================================
  // LOAD SCREENS WHEN MODULE OR ROLE CHANGES
  // =================================================

  useEffect(() => {
    if (selectedRoleId && selectedModule) {
      fetchScreens(selectedModule, selectedRoleId);
    } else {
      setScreens([]);
    }
  }, [selectedModule, selectedRoleId, fetchScreens]);

  // =================================================
  // LOAD EMPLOYEES WHEN USER TAB IS OPENED
  // =================================================

  useEffect(() => {
    if (activeTab === "users" && selectedRoleId) {
      fetchEmployees();
    }
  }, [activeTab, selectedRoleId, fetchEmployees]);

  useEffect(() => {
  fetchDashboardCounts();
}, [fetchDashboardCounts]);
  // =================================================
  // SELECTED ROLE
  // =================================================

  const selectedRole = useMemo(
    () =>
      roles.find(
        (role) => role.id === Number(selectedRoleId),
      ),
    [roles, selectedRoleId],
  );

  const currentPermissions =
    rolePermissions[selectedRoleId] || {
      owner:
        selectedRolePermission ??
        selectedRole?.owner ??
        false,

      readWrite: !(
        selectedRolePermission ??
        selectedRole?.owner ??
        false
      ),
    };

  const currentAssignedUsers =
    assignedUsers[selectedRoleId] || [];

  // =================================================
  // FILTER ROLES
  // =================================================

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) =>
        role.name
          .toLowerCase()
          .includes(searchRole.toLowerCase()),
      ),
    [roles, searchRole],
  );

  // =================================================
  // FILTER EMPLOYEES
  // =================================================

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        `${employee.name} ${employee.roleName} ${employee.id}`
          .toLowerCase()
          .includes(searchEmployee.toLowerCase()),
      ),
    [employees, searchEmployee],
  );

  // =================================================
  // SCREEN GROUPS
  // =================================================

  const menuScreens = useMemo(
    () =>
      screens.filter(
        (screen) =>
          screen.formType.toLowerCase() === "menu",
      ),
    [screens],
  );

  const formScreens = useMemo(
    () =>
      screens.filter(
        (screen) =>
          screen.formType.toLowerCase() !== "menu",
      ),
    [screens],
  );

  // =================================================
  // SCREEN COUNTS
  // =================================================

  const assignedScreenCount = screens.filter(
    (screen) => screen.isAssigned,
  ).length;

  const totalScreenCount = screens.length;

  // =================================================
  // DASHBOARD STATISTICS
  // =================================================

// =================================================
// DASHBOARD STATISTICS
// =================================================

const totalUsers = dashboardCounts.totalUsers;

const assignedCount = Object.values(assignedUsers).reduce(
  (total, users) => total + users.length,
  0,
);

const activeModules = moduleData.filter(
  (module) =>
    getAuthScreenCount(module.authScreens).authorized > 0,
).length;

const totalPermissions = dashboardCounts.totalPermissions;

  // =================================================
  // ROLE MODAL
  // =================================================

  const openCreateRole = () => {
    setEditingRole(null);

    setRoleForm({
      name: "",
      description: "",
    });

    setShowRoleModal(true);
  };

  const openEditRole = () => {
    if (!selectedRole) return;

    setEditingRole(selectedRole);

    setRoleForm({
      name: selectedRole.name,
      description: selectedRole.description,
    });

    setShowRoleModal(true);
  };

  // =================================================
  // SAVE ROLE
  // =================================================

  const saveRole = async (event) => {
    event.preventDefault();

    const roleName = roleForm.name.trim();
    const roleDescription = roleForm.description.trim();

    if (!roleName || roleSaving) return;

    const { createdByUser, sourceID } =
      getCurrentUserDetails();

    if (!createdByUser || !sourceID) {
      showToast(
        "Unable to identify the logged-in user or source ID.",
        "error",
      );
      return;
    }

    const dto = {
      createdByUser,
      sourceID,
      rdhR0000LIVName: roleName,
      rdhR0000LIVDescription: roleDescription,
    };

    setRoleSaving(true);

    try {
      if (editingRole) {
        await menuClient.patch(
          `/Role/UpdateRole/${editingRole.id}`,
          {
            roleId: editingRole.id,
            dto,
          },
        );

        await fetchRoles(editingRole.id);
        await fetchDashboardCounts();

        showToast("Role updated successfully.", "success");
      } else {
        await menuClient.post("/Role/CreateRole", dto);

        const refreshedRoles = await fetchRoles();
        await fetchDashboardCounts();
        const createdRole = refreshedRoles.find(
          (role) =>
            role.name.toLowerCase() ===
            roleName.toLowerCase(),
        );

        if (createdRole) {
          setSelectedRoleId(createdRole.id);

          useAuthStore.setState({
            selectedRolePermission: createdRole.owner,
          });
        }

        showToast("Role created successfully.", "success");
      }

      setShowRoleModal(false);

      setRoleForm({
        name: "",
        description: "",
      });
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setRoleSaving(false);
    }
  };

  // =================================================
  // DELETE ROLE
  // =================================================

  const openDeleteConfirm = () => {
    if (!selectedRole || roleDeleting) return;

    setShowDeleteConfirm(true);
  };

  const deleteRole = async () => {
    if (!selectedRole || roleDeleting) return;

    const deletingRole = selectedRole;

    setRoleDeleting(true);

    try {
      await menuClient.patch(
        `/Role/DeleteRole/${deletingRole.id}`,
      );

      const remainingRoles = roles.filter(
        (role) => role.id !== deletingRole.id,
      );

      const nextRoleId = remainingRoles[0]?.id ?? null;

      setSelectedRoleId(nextRoleId);

      await fetchRoles(nextRoleId);
      await fetchDashboardCounts();
      setShowDeleteConfirm(false);

      showToast(
        `"${deletingRole.name}" deleted successfully.`,
        "success",
      );
    } catch (error) {
      setShowDeleteConfirm(false);
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setRoleDeleting(false);
    }
  };

  // =================================================
  // TOGGLE SCREEN ACCESS
  // =================================================

  const toggleScreenAccess = (screenID, checked) => {
    setScreens((previous) =>
      previous.map((screen) =>
        screen.screenID === screenID
          ? { ...screen, isAssigned: checked }
          : screen,
      ),
    );
  };

  // =================================================
  // SELECT ALL SCREENS
  // =================================================

  const toggleAllScreens = (checked) => {
    setScreens((previous) =>
      previous.map((screen) => ({
        ...screen,
        isAssigned: checked,
      })),
    );
  };

  // =================================================
  // SELECT ALL MENU SCREENS
  // =================================================

  const toggleAllMenuScreens = (checked) => {
    const menuIds = new Set(
      menuScreens.map((screen) => screen.screenID),
    );

    setScreens((previous) =>
      previous.map((screen) =>
        menuIds.has(screen.screenID)
          ? { ...screen, isAssigned: checked }
          : screen,
      ),
    );
  };

  // =================================================
  // SELECT ALL FORM SCREENS
  // =================================================

  const toggleAllFormScreens = (checked) => {
    const formIds = new Set(
      formScreens.map((screen) => screen.screenID),
    );

    setScreens((previous) =>
      previous.map((screen) =>
        formIds.has(screen.screenID)
          ? { ...screen, isAssigned: checked }
          : screen,
      ),
    );
  };

  // =================================================
  // SAVE MODULE ACCESS
  //
  // PATCH /Menu/UpdateFormAccess
  //
  // Sends ALL checked screen IDs for this module.
  // =================================================

  const saveModuleAccess = async () => {
    if (
      !selectedRoleId ||
      !selectedModule ||
      screenSaving
    ) {
      return;
    }

    const screenIDs = [
      ...new Set(
        screens
          .filter((screen) => screen.isAssigned)
          .map((screen) => Number(screen.screenID))
          .filter((id) => Number.isFinite(id)),
      ),
    ];

    const payload = {
      moduleID: Number(selectedModule),
      dto: {
        rdhR0000LIVID: Number(selectedRoleId),
        screenIDs,
      },
    };

    setScreenSaving(true);

    try {
      await menuClient.patch(
        "/Menu/UpdateFormAccess",
        payload,
      );

      // Refresh module counts and retain the selected module.
      await fetchModules(selectedRoleId, selectedModule);

      // Refresh the selected module's screen assignments.
      await fetchScreens(selectedModule, selectedRoleId);
      await fetchDashboardCounts();
      showToast(
        "Module screen access updated successfully.",
        "success",
      );
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setScreenSaving(false);
    }
  };

  // =================================================
  // ROLE PERMISSIONS
  //
  // OWNER       = true
  // READ/WRITE  = false
  //
  // ONLY ONE CAN BE SELECTED
  // =================================================

  const toggleRolePermission = (key) => {
    setRolePermissions((previous) => {
      const existing = previous[selectedRoleId] || {
        readWrite: !selectedRole?.owner,
        owner: selectedRole?.owner ?? false,
      };

      const isCurrentlySelected = existing[key];

      return {
        ...previous,

        [selectedRoleId]: {
          readWrite:
            !isCurrentlySelected && key === "readWrite",

          owner:
            !isCurrentlySelected && key === "owner",
        },
      };
    });
  };

  // =================================================
  // SAVE ROLE PERMISSION
  //
  // PATCH /UserAssigment/UpdatePermissions/{RoleID}
  // =================================================

  const saveRolePermission = async () => {
    if (!selectedRoleId || permissionSaving) return;

    if (
      !currentPermissions.owner &&
      !currentPermissions.readWrite
    ) {
      showToast(
        "Please select a permission before saving.",
        "warning",
      );
      return;
    }

    const permission = currentPermissions.owner;

    const payload = {
      roleID: Number(selectedRoleId),
      permission,
    };

    setPermissionSaving(true);

    try {
      await menuClient.patch(
        `/UserAssigment/UpdatePermissions/${selectedRoleId}`,
        payload,
      );

      // Update local role permission state.
      setRolePermissions((previous) => ({
        ...previous,
        [selectedRoleId]: {
          owner: permission,
          readWrite: !permission,
        },
      }));

      // Update selected role permission in Zustand.
      useAuthStore.setState({
        selectedRolePermission: permission,
      });

      // Refresh roles so the API remains the source of truth.
      await fetchRoles(selectedRoleId);

      showToast(
        permission
          ? "Owner permission updated successfully."
          : "Read and Write permission updated successfully.",
        "success",
      );
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setPermissionSaving(false);
    }
  };

  // =================================================
  // USER ASSIGNMENT
  // =================================================

  const toggleEmployee = (employeeId) => {
    setAssignedUsers((previous) => {
      const existing = previous[selectedRoleId] || [];

      const updated = existing.includes(employeeId)
        ? existing.filter((id) => id !== employeeId)
        : [...existing, employeeId];

      return {
        ...previous,
        [selectedRoleId]: updated,
      };
    });
  };

  const selectAllEmployees = () => {
    const visibleIds = filteredEmployees.map(
      (employee) => employee.id,
    );

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        currentAssignedUsers.includes(id),
      );

    setAssignedUsers((previous) => {
      const existing = previous[selectedRoleId] || [];

      const updated = allSelected
        ? existing.filter((id) => !visibleIds.includes(id))
        : [...new Set([...existing, ...visibleIds])];

      return {
        ...previous,
        [selectedRoleId]: updated,
      };
    });
  };

  // =================================================
  // SAVE EMPLOYEE ASSIGNMENTS
  //
  // PATCH /UserAssigment/AssignEmployees/{RoleID}
  //
  // Sends ALL checked employee IDs for this role.
  // =================================================

  const saveEmployeeAssignments = async () => {
    if (!selectedRoleId || assignmentSaving) return;

    const employeeIDs = [
      ...new Set(
        (assignedUsers[selectedRoleId] || [])
          .map(Number)
          .filter((id) => Number.isFinite(id)),
      ),
    ];

    const payload = {
      roleID: Number(selectedRoleId),
      employeeIDs,
    };

    setAssignmentSaving(true);

    try {
      await menuClient.patch(
        `/UserAssigment/AssignEmployees/${selectedRoleId}`,
        payload,
      );

      // Refresh assignment status from the API.
      await fetchEmployees();

      // Refresh role employee counts.
      await fetchRoles(selectedRoleId);

      showToast(
        "Employee assignments updated successfully.",
        "success",
      );
    } catch (error) {
      showToast(getApiErrorMessage(error), "error");
    } finally {
      setAssignmentSaving(false);
    }
  };

  // =================================================
  // SAVE CURRENT TAB
  // =================================================

  const saveCurrentTab = () => {
    if (activeTab === "modules") {
      saveModuleAccess();
      return;
    }

    if (activeTab === "permissions") {
      saveRolePermission();
      return;
    }

    if (activeTab === "users") {
      saveEmployeeAssignments();
    }
  };

  // =================================================
  // MODULE SELECTION
  // =================================================

  const activeModule = moduleData.find(
    (module) => module.id === selectedModule,
  );

  const activeModuleCount = activeModule
    ? getAuthScreenCount(activeModule.authScreens)
    : { authorized: 0, total: 0 };

  const allScreensAssigned =
    screens.length > 0 &&
    screens.every((screen) => screen.isAssigned);

  const allMenuScreensAssigned =
    menuScreens.length > 0 &&
    menuScreens.every((screen) => screen.isAssigned);

  const allFormScreensAssigned =
    formScreens.length > 0 &&
    formScreens.every((screen) => screen.isAssigned);

  const allVisibleEmployeesAssigned =
    filteredEmployees.length > 0 &&
    filteredEmployees.every((employee) =>
      currentAssignedUsers.includes(employee.id),
    );

  // =================================================
  // SCREEN CHECKBOX RENDERER
  // =================================================

  const renderScreenCheckbox = (screen) => (
    <label
      className="ra-checkbox-row"
      key={`${screen.screenID}-${screen.screenSubID}`}
    >
      <input
        type="checkbox"
        checked={screen.isAssigned}
        onChange={(event) =>
          toggleScreenAccess(
            screen.screenID,
            event.target.checked,
          )
        }
      />

      <span className="ra-custom-check"></span>

      <span>{screen.screenTitle}</span>
    </label>
  );

  // =================================================
  // RENDER
  // =================================================

  return (
    <div className="role-access-page">

      {/* HEADER */}

      <div className="ra-page-header">
        <div>
          <h2>Role and Access</h2>
          <p>
            Create roles, assign module access and manage
            permissions with ease.
          </p>
        </div>

        <button
          className="ra-primary-btn"
          onClick={openCreateRole}
        >
          <FiPlus />
          Create New Role
        </button>
      </div>

      {/* DASHBOARD STATISTICS */}

      {/* DASHBOARD STATISTICS */}

<div className="ra-stats-grid">
  <DashboardCardGrid>
    <DashboardCard
      title="Total Roles"
      value={
        dashboardLoading
          ? "..."
          : dashboardCounts.totalRoles
      }
      growth="Total roles"
      icon={FiUsers}
      color="blue"
    />

    <DashboardCard
      title="Total Users"
      value={
        dashboardLoading
          ? "..."
          : dashboardCounts.totalUsers
      }
      growth="Total users"
      icon={FiUserCheck}
      color="green"
    />

    <DashboardCard
      title="Total Modules"
      value={
        dashboardLoading
          ? "..."
          : dashboardCounts.totalModules
      }
      growth="Total modules"
      icon={FiGrid}
      color="purple"
    />

    <DashboardCard
      title="Total Permissions"
      value={
        dashboardLoading
          ? "..."
          : dashboardCounts.totalPermissions
      }
      growth="Total permissions"
      icon={FiShield}
      color="orange"
    />
  </DashboardCardGrid>
</div>

      {/* MAIN LAYOUT */}

      <div className="ra-main-layout">

        {/* LEFT ROLE LIST */}

        <aside className="ra-roles-panel">

          <div className="ra-panel-heading">
            <h3>Roles</h3>
          </div>

          <div className="ra-role-filters">

            <div className="ra-search-box">
              <FiSearch />

              <input
                type="text"
                placeholder="Search roles..."
                value={searchRole}
                onChange={(event) =>
                  setSearchRole(event.target.value)
                }
              />
            </div>

            <FormSelect defaultValue="all">
              <option value="all">All Roles</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </FormSelect>

          </div>

          <div className="ra-role-list">

            {rolesLoading ? (
              <div className="ra-empty-state">
                Loading roles...
              </div>
            ) : rolesError ? (
              <div className="ra-empty-state">
                <p>{rolesError}</p>

                <button
                  className="ra-outline-btn"
                  onClick={() => fetchRoles()}
                >
                  Retry
                </button>
              </div>
            ) : (
              filteredRoles.map((role) => (
                <button
                  key={role.id}
                  className={`ra-role-item ${
                    selectedRoleId === role.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedRoleId(role.id);

                    useAuthStore.setState({
                      selectedRolePermission: role.owner,
                    });

                    setActiveTab("modules");
                  }}
                >
                  <div className="ra-role-icon">
                    {role.owner ? (
                      <FiShield />
                    ) : (
                      <FiUsers />
                    )}
                  </div>

                  <div className="ra-role-info">
                    <strong>{role.name}</strong>
                    <span>{role.description}</span>
                  </div>

                  <div className="ra-role-meta">
                    <small>{role.users} users</small>

                    <span
                      className={`ra-status ${
                        role.status === "Active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {role.status}
                    </span>
                  </div>

                  <FiChevronRight className="ra-role-arrow" />
                </button>
              ))
            )}

            {!rolesLoading &&
              !rolesError &&
              filteredRoles.length === 0 && (
                <div className="ra-empty-state">
                  No roles found.
                </div>
              )}

          </div>
        </aside>

        {/* RIGHT ROLE DETAILS */}

        <main className="ra-details-panel">

          {selectedRole ? (
            <>

              {/* ROLE INFORMATION */}

              <div className="ra-role-details-header">

                <div className="ra-selected-role">
                  <div className="ra-selected-role-icon">
                    <FiUser />
                  </div>

                  <div>
                    <h3>{selectedRole.name}</h3>

                    <p>
                      {selectedRole.description ||
                        "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="ra-role-actions">

                  <button
                    className="ra-outline-btn"
                    onClick={openEditRole}
                  >
                    <FiEdit2 />
                    Edit Role
                  </button>

                  <button
                    className="ra-delete-btn"
                    onClick={openDeleteConfirm}
                    disabled={roleDeleting}
                  >
                    <FiTrash2 />
                    Delete Role
                  </button>

                </div>
              </div>

              {/* ROLE SUMMARY */}

              <div className="ra-role-summary">

                <div>
                  <span>Role Name</span>
                  <strong>{selectedRole.name}</strong>
                </div>

                <div>
                  <span>Description</span>
                  <strong>
                    {selectedRole.description || "—"}
                  </strong>
                </div>

                <div>
                  <span>Users Assigned</span>
                  <strong>{selectedRole.users}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong>
                    <span
                      className={`ra-status ${
                        selectedRole.status === "Active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {selectedRole.status}
                    </span>
                  </strong>
                </div>

              </div>

              {/* TABS */}

              <div className="ra-tabs">

                <button
                  className={
                    activeTab === "modules" ? "active" : ""
                  }
                  onClick={() => setActiveTab("modules")}
                >
                  <FiGrid />
                  Module Access
                </button>

                <button
                  className={
                    activeTab === "permissions" ? "active" : ""
                  }
                  onClick={() => setActiveTab("permissions")}
                >
                  <FiShield />
                  Permissions
                </button>

                <button
                  className={
                    activeTab === "users" ? "active" : ""
                  }
                  onClick={() => setActiveTab("users")}
                >
                  <FiUsers />
                  User Assignment

                  <span className="ra-tab-count">
                    {currentAssignedUsers.length}
                  </span>
                </button>

              </div>

              {/* =================================
                  TAB 1: MODULE ACCESS
              ================================= */}

              {activeTab === "modules" && (

                <div className="ra-module-layout">

                  <div className="ra-module-sidebar">

                    {modulesLoading ? (
                      <div className="ra-empty-state">
                        Loading modules...
                      </div>
                    ) : modulesError ? (
                      <div className="ra-empty-state">
                        <p>{modulesError}</p>

                        <button
                          className="ra-outline-btn"
                          onClick={() =>
                            fetchModules(
                              selectedRoleId,
                              selectedModule,
                            )
                          }
                        >
                          Retry
                        </button>
                      </div>
                    ) : moduleData.length === 0 ? (
                      <div className="ra-empty-state">
                        No modules available.
                      </div>
                    ) : (
                      moduleData.map((module) => {
                        const Icon = module.icon;

                        const counts = getAuthScreenCount(
                          module.authScreens,
                        );

                        return (
                          <button
                            key={module.id}
                            className={`ra-module-item ${
                              selectedModule === module.id
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setSelectedModule(module.id)
                            }
                          >
                            <Icon />

                            <span>{module.name}</span>

                            <small>
                              {counts.authorized}/{counts.total}
                            </small>
                          </button>
                        );
                      })
                    )}

                  </div>

                  <div className="ra-module-settings">

                    {modulesLoading || screensLoading ? (
                      <div className="ra-empty-state">
                        Loading module screens...
                      </div>
                    ) : screensError ? (
                      <div className="ra-empty-state">
                        <p>{screensError}</p>

                        <button
                          className="ra-outline-btn"
                          onClick={() =>
                            fetchScreens(
                              selectedModule,
                              selectedRoleId,
                            )
                          }
                        >
                          Retry
                        </button>
                      </div>
                    ) : activeModule ? (
                      <>

                        <div className="ra-module-title">

                          <div className="ra-module-title-info">

                            <div className="ra-module-title-icon">
                              {React.createElement(activeModule.icon)}
                            </div>

                            <div>
                              <h4>{activeModule.name}</h4>
                              <p>
                                Module ID: {activeModule.id}
                              </p>
                            </div>

                          </div>

                          <label className="ra-switch">
                            <input
                              type="checkbox"
                              checked={allScreensAssigned}
                              onChange={(event) =>
                                toggleAllScreens(
                                  event.target.checked,
                                )
                              }
                              disabled={screens.length === 0}
                            />
                            <span></span>
                          </label>

                        </div>

                        {menuScreens.length > 0 && (
                          <div className="ra-module-section">

                            <div className="ra-tab-heading">
                              <div>
                                <h4>Menu Permissions</h4>
                                <p>
                                  Manage menu access for this role.
                                </p>
                              </div>

                              <label className="ra-switch">
                                <input
                                  type="checkbox"
                                  checked={allMenuScreensAssigned}
                                  onChange={(event) =>
                                    toggleAllMenuScreens(
                                      event.target.checked,
                                    )
                                  }
                                />
                                <span></span>
                              </label>
                            </div>

                            <div className="ra-checkbox-list">
                              {menuScreens.map(
                                renderScreenCheckbox,
                              )}
                            </div>

                          </div>
                        )}

                        {formScreens.length > 0 && (
                          <div className="ra-module-section">

                            <div className="ra-tab-heading">
                              <div>
                                <h4>Sub Modules / Forms</h4>
                                <p>
                                  Manage screen and form access.
                                </p>
                              </div>

                              <label className="ra-switch">
                                <input
                                  type="checkbox"
                                  checked={allFormScreensAssigned}
                                  onChange={(event) =>
                                    toggleAllFormScreens(
                                      event.target.checked,
                                    )
                                  }
                                />
                                <span></span>
                              </label>
                            </div>

                            <div className="ra-checkbox-list">
                              {formScreens.map(
                                renderScreenCheckbox,
                              )}
                            </div>

                          </div>
                        )}

                        {screens.length === 0 && (
                          <div className="ra-empty-state">
                            No screens found for this module.
                          </div>
                        )}

                        <div className="ra-info-message">
                          <FiInfo />
                          {assignedScreenCount} of {totalScreenCount}{" "}
                          screens are currently selected. Click Save
                          Changes to apply this module's access.
                        </div>

                      </>
                    ) : (
                      <div className="ra-empty-state">
                        Select a module to view its screen access.
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* =================================
                  TAB 2: PERMISSIONS
              ================================= */}

              {activeTab === "permissions" && (

                <div className="ra-tab-content">

                  <div className="ra-tab-heading">
                    <div>
                      <h4>Role Permissions</h4>

                      <p>
                        Select one access level for this role.
                        Only one permission can be active at a time.
                      </p>
                    </div>
                  </div>

                  <div className="ra-permission-cards">

                    {/* READ AND WRITE */}

                    <div className="ra-permission-card">

                      <div className="ra-permission-icon blue">
                        <FiLock />
                      </div>

                      <div className="ra-permission-info">
                        <h4>Read and Write</h4>

                        <p>
                          Allow users to view and modify records
                          within their permitted modules.
                        </p>
                      </div>

                      <label className="ra-checkbox-row ra-permission-checkbox">

                        <input
                          type="checkbox"
                          checked={currentPermissions.readWrite}
                          onChange={() =>
                            toggleRolePermission("readWrite")
                          }
                        />

                        <span className="ra-custom-check"></span>

                      </label>

                    </div>

                    {/* OWNER */}

                    <div className="ra-permission-card">

                      <div className="ra-permission-icon purple">
                        <FiShield />
                      </div>

                      <div className="ra-permission-info">
                        <h4>Owner</h4>

                        <p>
                          Grant ownership-level access and
                          control over assigned records.
                        </p>
                      </div>

                      <label className="ra-checkbox-row ra-permission-checkbox">

                        <input
                          type="checkbox"
                          checked={currentPermissions.owner}
                          onChange={() =>
                            toggleRolePermission("owner")
                          }
                        />

                        <span className="ra-custom-check"></span>

                      </label>

                    </div>

                  </div>

                  {/* <div className="ra-info-message">
                    <FiInfo />

                    Owner sends permission: true.
                    Read and Write sends permission: false.
                    Both permissions cannot be selected together.
                  </div> */}

                  <div className="ra-role-actions">
                    <button
                      type="button"
                      className="ra-primary-btn mt-3"
                      onClick={saveRolePermission}
                      disabled={permissionSaving}
                    >
                      {permissionSaving
                        ? "Saving..."
                        : "Save Permission"}
                    </button>
                  </div>

                </div>
              )}

              {/* =================================
                  TAB 3: USER ASSIGNMENT
              ================================= */}

              {activeTab === "users" && (

                <div className="ra-tab-content">

                  <div className="ra-tab-heading">

                    <div>
                      <h4>Assign Employees</h4>

                      <p>
                        Select employees who should be assigned
                        to the {selectedRole.name} role.
                      </p>
                    </div>

                    <span className="ra-assigned-badge">
                      {currentAssignedUsers.length} Assigned
                    </span>

                  </div>

                  <div className="ra-user-toolbar">

                    <div className="ra-search-box">

                      <FiSearch />

                      <input
                        type="text"
                        placeholder="Search employees by name or role..."
                        value={searchEmployee}
                        onChange={(event) =>
                          setSearchEmployee(event.target.value)
                        }
                      />

                      {searchEmployee && (
                        <button
                          type="button"
                          onClick={() => setSearchEmployee("")}
                          aria-label="Clear search"
                        >
                          <FiX />
                        </button>
                      )}

                    </div>

                    <button
                      type="button"
                      className="ra-outline-btn"
                      onClick={selectAllEmployees}
                      disabled={
                        employeesLoading ||
                        filteredEmployees.length === 0
                      }
                    >
                      {allVisibleEmployeesAssigned
                        ? "Unselect All"
                        : "Select All"}
                    </button>

                  </div>

                  {/* LOGGED-IN USER INFORMATION */}

                  <div className="ra-info-message">
                    <FiInfo />
                    Logged-in Employee ID: {employeeId || "Not available"}
                  </div>

                  <div className="ra-employee-list">

                    <div className="ra-employee-list-header">
                      <span>Employee</span>
                      <span>Current Role</span>
                      <span>Assignment</span>
                    </div>

                    {employeesLoading ? (
                      <div className="ra-empty-state">
                        Loading employees...
                      </div>
                    ) : employeesError ? (
                      <div className="ra-empty-state">
                        <p>{employeesError}</p>

                        <button
                          type="button"
                          className="ra-outline-btn"
                          onClick={fetchEmployees}
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      filteredEmployees.map((employee) => {
                        const isAssigned =
                          currentAssignedUsers.includes(
                            employee.id,
                          );

                        return (
                          <label
                            key={employee.id}
                            className={`ra-employee-row ${
                              isAssigned ? "assigned" : ""
                            }`}
                          >

                            <div className="ra-employee-name">

                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={() =>
                                  toggleEmployee(employee.id)
                                }
                              />

                              <span className="ra-custom-check"></span>

                              <div className="ra-avatar">
                                {employee.name
                                  .split(" ")
                                  .filter(Boolean)
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>{employee.name}</strong>
                                <small>
                                  Employee ID: {employee.id}
                                </small>
                              </div>

                            </div>

                            <span className="ra-employee-department">
                              {employee.roleName || "—"}
                            </span>

                            <span
                              className={`ra-assignment-status ${
                                isAssigned ? "assigned" : ""
                              }`}
                            >
                              {isAssigned
                                ? "Assigned"
                                : "Not Assigned"}
                            </span>

                          </label>
                        );
                      })
                    )}

                    {!employeesLoading &&
                      !employeesError &&
                      filteredEmployees.length === 0 && (
                        <div className="ra-empty-state">
                          No employees found.
                        </div>
                      )}

                  </div>

                  <div className="ra-info-message">
                    <FiInfo />
                    {currentAssignedUsers.length} employees selected.
                    Click Save Changes to update assignments for this role.
                  </div>

                </div>
              )}

            </>
          ) : (
            <div className="ra-empty-state">
              {rolesLoading
                ? "Loading roles..."
                : "Select a role to manage its access."}
            </div>
          )}

          {/* FOOTER */}

          {selectedRole && (
            <div className="ra-details-footer">

              <span>
                <FiInfo />

                {activeTab === "modules"
                  ? "Save access changes for the selected module."
                  : activeTab === "permissions"
                    ? "Save the selected role permission."
                    : "Save employee assignments for this role."}
              </span>

              <button
                type="button"
                className="ra-primary-btn"
                onClick={saveCurrentTab}
                disabled={
                  (activeTab === "modules" &&
                    (screenSaving ||
                      screensLoading ||
                      !selectedModule)) ||
                  (activeTab === "permissions" &&
                    permissionSaving) ||
                  (activeTab === "users" &&
                    assignmentSaving)
                }
              >
                {(activeTab === "modules" && screenSaving) ||
                (activeTab === "permissions" && permissionSaving) ||
                (activeTab === "users" && assignmentSaving)
                  ? "Saving..."
                  : "Save Changes"}
              </button>

            </div>
          )}

        </main>

      </div>

      {/* CREATE / EDIT ROLE OFFCANVAS */}

      <FormOffcanvas
        show={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={editingRole ? "Edit Role" : "Create New Role"}
        width="520px"
        footer={
          <>
            <button
              type="button"
              className="ra-cancel-btn"
              onClick={() => setShowRoleModal(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="ra-role-form"
              className="ra-primary-btn"
              disabled={roleSaving}
            >
              {roleSaving
                ? "Saving..."
                : editingRole
                  ? "Update Role"
                  : "Create Role"}
            </button>
          </>
        }
      >

        <form
          id="ra-role-form"
          onSubmit={saveRole}
        >

          <div className="ra-form-group">
            <label>
              Role Name <span>*</span>
            </label>

            <input
              type="text"
              placeholder="Enter role name"
              value={roleForm.name}
              onChange={(event) =>
                setRoleForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              required
              autoFocus
            />
          </div>

          <div className="ra-form-group">
            <label>Description</label>

            <textarea
              placeholder="Enter role description"
              rows="4"
              value={roleForm.description}
              onChange={(event) =>
                setRoleForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </div>

        </form>

      </FormOffcanvas>

      {/* DELETE CONFIRMATION */}

      <Alert
        isOpen={showDeleteConfirm}
        title="Delete Role"
        message="Are you sure you want to delete"
        itemName={selectedRole?.name || ""}
        confirmText="Delete"
        cancelText="Cancel"
        loading={roleDeleting}
        onConfirm={deleteRole}
        onCancel={() => {
          if (roleDeleting) return;
          setShowDeleteConfirm(false);
        }}
      />

      {/* TOAST */}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}

    </div>
  );
};

export default RoleAccess;
