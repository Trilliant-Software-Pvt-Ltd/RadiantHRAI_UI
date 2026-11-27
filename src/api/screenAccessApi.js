
import axiosClientMenu from "./axiosClientMenu";

/* ================================================
   GET ADMIN / USER TOP-LEVEL MENUS
================================================ */

export const getScreenAccessMenuApi = async (
  employeeId,
  screenType
) => {
  const response = await axiosClientMenu.get(
    "/ScreenAccess/GetMenu",
    {
      params: {
        EmployeeId: Number(employeeId),
        Screentype: screenType,
      },
    }
  );

  return response.data;
};

/* ================================================
   GET MODULE SUBMENUS
================================================ */

export const getScreenAccessSubMenuApi = async (
  employeeId,
  screenType,
  moduleId
) => {
  const response = await axiosClientMenu.get(
    "/ScreenAccess/GetSubMenu",
    {
      params: {
        EmployeeId: Number(employeeId),
        Screentype: screenType,
        ModuleId: Number(moduleId),
      },
    }
  );

  return response.data;
};
