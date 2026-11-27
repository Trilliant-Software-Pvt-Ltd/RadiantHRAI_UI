
import coreSettingsClient from "../../../api/axiosClientModule";

const EMPLOYEE_API = "/Employee";

const onboardingConfig = {
  module: "onboarding",
};

export const createEmployeeApi = async (data) => {
  const response = await coreSettingsClient.post(
    `${EMPLOYEE_API}/CreateEmployee`,
    data,
    onboardingConfig
  );

  return response.data;
};

export const updateEmployeeApi = async (encryptedId, data) => {
  if (!encryptedId) {
    throw new Error("Encrypted Employee ID is required.");
  }

  const response = await coreSettingsClient.patch(
    `${EMPLOYEE_API}/UpdateEmployee/${encodeURIComponent(encryptedId)}`,
    data,
    onboardingConfig
  );

  return response.data;
};

export const deleteEmployeeApi = async (encryptedId) => {
  if (!encryptedId) {
    throw new Error("Encrypted Employee ID is required.");
  }

  const response = await coreSettingsClient.patch(
    `${EMPLOYEE_API}/DeleteEmployee/${encodeURIComponent(encryptedId)}`,
    null,
    onboardingConfig
  );

  return response.data;
};

export const getEmployeeListApi = async () => {
  const response = await coreSettingsClient.get(
    `${EMPLOYEE_API}/GetEmployee`,
    onboardingConfig
  );

  return response.data;
};

export const getEmployeeByIdApi = async (encryptedId) => {
  if (!encryptedId) {
    throw new Error("Encrypted Employee ID is required.");
  }

  const response = await coreSettingsClient.get(
    `${EMPLOYEE_API}/GetEmployeeByID/${encodeURIComponent(encryptedId)}`,
    onboardingConfig
  );

  return response.data;
};
