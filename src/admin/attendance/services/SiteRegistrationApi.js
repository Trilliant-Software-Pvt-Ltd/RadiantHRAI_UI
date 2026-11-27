
import coreSettingsClient from "../../../api/axiosClientModule";

// =========================================================
// SITE REGISTRATION - ATTENDANCE API (8184)
// =========================================================

export const getAllSiteRegistration = async () => {
  return await coreSettingsClient.get(
    "/settings/SiteRegistration/GetAllSiteRegistration",
    { module: "attendance" }
  );
};

export const createSiteRegistration = async (payload) => {
  return await coreSettingsClient.post(
    "/settings/SiteRegistration/CreateSiteRegistration",
    payload,
    { module: "attendance" }
  );
};

// Update uses encrypted ID
export const updateSiteRegistration = async (encryptedId, payload) => {
  return await coreSettingsClient.patch(
    `/settings/SiteRegistration/UpdateSiteRegistration/${encodeURIComponent(
      encryptedId
    )}`,
    payload,
    { module: "attendance" }
  );
};

// Delete uses encrypted ID
export const deleteSiteRegistration = async (encryptedId) => {
  return await coreSettingsClient.patch(
    `/settings/SiteRegistration/DeleteSiteRegistration/${encodeURIComponent(
      encryptedId
    )}`,
    {},
    { module: "attendance" }
  );
};


// =========================================================
// ORGANIZATION - MODULES API (8185)
// =========================================================

export const getOrganisationList = async () => {
  return await coreSettingsClient.get(
    "/Organization/GetOrganisationList",
    { module: "coreSettings" }
  );
};


// =========================================================
// ENTITY - MODULES API (8185)
// =========================================================

export const getEntityList = async () => {
  return await coreSettingsClient.get(
    "/Entity/GetEntityList",
    { module: "coreSettings" }
  );
};


// =========================================================
// COUNTRY - MODULES API (8185)
// =========================================================


export const getCountryList = async () => {
  return await coreSettingsClient.get(
    "/Country/GetCountryList",
    { module: "coreSettings" }
  );
};


// =========================================================
// STATE - MODULES API (8185)
// =========================================================

export const getStateList = async () => {
  return await coreSettingsClient.get(
    "/State/GetStateList",
    { module: "coreSettings" }
  );
};
