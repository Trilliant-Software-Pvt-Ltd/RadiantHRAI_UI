
/* =========================================================
   COMMON RESPONSE EXTRACTOR
========================================================= */

const extractArray = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.Result)) return data.Result;

  return [];
};


/* =========================================================
   EXTRACT SITE REGISTRATION LIST
========================================================= */

export const extractSiteRegistrations = (response) => {
  return extractArray(response);
};


/* =========================================================
   MAP SITE REGISTRATION FOR LIST
========================================================= */

export const mapSiteRegistration = (item) => {
  const address = [
    item?.address_line_1,
    item?.city,
    item?.state_region,
    item?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  const organizationName =
    item?.rdhR0000IName ||
    item?.organizationName ||
    item?.organization_name ||
    "-";

  const entityName =
    item?.rdhR0000IIName ||
    item?.entityName ||
    item?.entity_name ||
    "-";

  return {
    // Preserve actual API identifiers.
    // Numeric ID is retained for record data.
    // Encrypted ID is used for Update/Delete URL parameters.
    id: item?.rdhR0000XXIVID ?? null,
    encryptedId: item?.rdhR0000XXIVID_Encrypted ?? null,

    organizationId: item?.rdhR0000IID ?? null,
    entityId: item?.rdhR0000IIID ?? null,
    branchId: item?.rdhR0000XID ?? null,

    organization: organizationName,
    organizationName,
    entity: entityName,
    entityName,

    siteCode: item?.rdhR0000XXIV_SiteCode || "-",
    siteName: item?.rdhR0000XXIV_SiteName || "-",
    siteType: item?.rdhR0000XXIV_SiteType || "-",

    addressLine1: item?.address_line_1 || "",
    city: item?.city || "",
    stateRegion: item?.state_region || "",
    postalCode: item?.postal_code || "",
    countryName: item?.countryName || "-",
    address: address || "-",

    latitude: item?.latitude ?? null,
    longitude: item?.longitude ?? null,
    radiusMeters: item?.radius_meters ?? null,
    timezone: item?.timezone || "",

    attendanceEnabled: item?.attendance_enabled ?? false,
    autoCheckinEnabled: item?.auto_checkin_enabled ?? false,
    autoCheckoutEnabled: item?.auto_checkout_enabled ?? false,

    status: item?.status || "-",
    isDeactivated: item?.isDeactivated ?? false,
    effectiveFrom: item?.effective_from || null,
    effectiveTo: item?.effective_to || null,

    createdByUser: item?.createdByUser || "",
    createdDate: item?.createdDate || null,
    sourceID: item?.sourceID || "",
  };
};


/* =========================================================
   HELPER FUNCTIONS
========================================================= */

const getNumberValue = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};


const getStringValue = (value) => {
  return value === null || value === undefined
    ? ""
    : String(value).trim();
};


const getBooleanValue = (value) => {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return ["true", "1"].includes(
      value.trim().toLowerCase()
    );
  }

  return false;
};


/* =========================================================
   EXTRACT ORGANIZATION LIST
========================================================= */

export const extractOrganizations = (response) => {
  return extractArray(response);
};


/* =========================================================
   MAP ORGANIZATION DROPDOWN OPTIONS
========================================================= */

export const mapOrganizationOptions = (response) => {
  return extractOrganizations(response)
    .filter((item) => item?.RDHR0000IID != null)
    .map((item) => ({
      value: String(item.RDHR0000IID),
      label: item?.RDHR0000IName || "",
    }));
};


/* =========================================================
   EXTRACT ENTITY LIST
========================================================= */

export const extractEntities = (response) => {
  return extractArray(response);
};


/* =========================================================
   MAP ENTITY DROPDOWN OPTIONS
========================================================= */

export const mapEntityOptions = (response) => {
  return extractEntities(response)
    .filter((item) => item?.RDHR0000IIID != null)
    .map((item) => ({
      value: String(item.RDHR0000IIID),
      label: item?.RDHR0000IIName || "",
    }));
};



export const mapSiteRegistrationPayload = (
  formData = {},
  {
    organizationId,
    entityId,
    branchId,
    createdByUser,
    sourceID = "WEB",
  } = {}
) => {
  // Master IDs
  const organization = getNumberValue(organizationId);
  const entity = getNumberValue(entityId);
  const branch = getNumberValue(branchId);

  // Validate Organization
  if (organization === null || organization <= 0) {
    throw new Error(
      "Please select a valid Legal Entity."
    );
  }

  // Validate Entity
  if (entity === null || entity <= 0) {
    throw new Error(
      "Please select a valid Branch."
    );
  }

  // Validate Branch ID when supplied
  if (
    branchId !== undefined &&
    branchId !== null &&
    branchId !== ""
  ) {
    if (branch === null || branch < 0) {
      throw new Error(
        "Please select a valid Branch ID."
      );
    }
  }

  // Validate Created By User
  const createdBy = getStringValue(createdByUser);

  if (!createdBy) {
    throw new Error(
      "Created By User information is missing."
    );
  }

  // Validate Source ID
  const source = getStringValue(sourceID) || "WEB";

  // Normalize Site Type
  const siteType = getStringValue(
    formData.siteType
  ).toUpperCase();

  const allowedSiteTypes = [
    "PROJECT_SITE",
    "CLIENT_SITE",
    "WAREHOUSE",
    "FACTORY",
    "OFFICE",
  ];

  if (!allowedSiteTypes.includes(siteType)) {
    throw new Error(
      "Please select a valid Site Type."
    );
  }

  // Create API Payload
  return {
    // Primary identifiers
    rdhR0000XXIVID: 0,
    rdhR0000XXIVID_Encrypted: "",

    // Audit details
    isDeactivated: false,
    createdByUser: createdBy,
    createdDate: new Date().toISOString(),
    sourceID: source,

    // Organization / Entity / Branch IDs
    rdhR0000IID: organization,
    rdhR0000IIID: entity,
    rdhR0000XID: branch ?? 0,

    // Basic Information
    rdhR0000XXIV_SiteCode: getStringValue(
      formData.siteCode
    ),

    rdhR0000XXIV_SiteName: getStringValue(
      formData.siteName
    ),

    rdhR0000XXIV_SiteType: siteType,

    // Address Information
    address_line_1: getStringValue(
      formData.addressLine1
    ),

    city: getStringValue(
      formData.city
    ),

    state_region: getStringValue(
      formData.state
    ),

    postal_code: getStringValue(
      formData.postalCode
    ),

    countryName: getStringValue(
  formData.countryName
),
    // GPS / Geofencing
    latitude: getNumberValue(
      formData.latitude
    ),

    longitude: getNumberValue(
      formData.longitude
    ),

    radius_meters: getNumberValue(
      formData.geofenceRadius
    ),

    timezone: getStringValue(
      formData.timezone
    ),

    // Attendance Configuration
    attendance_enabled: getBooleanValue(
      formData.attendanceEnabled
    ),

    auto_checkin_enabled: getBooleanValue(
      formData.automaticCheckIn
    ),

    auto_checkout_enabled: getBooleanValue(
      formData.automaticCheckOut
    ),

    // Status
    status: "Active",

    // Effective Dates
    effective_from: formData.effectiveFrom || null,
    effective_to: formData.effectiveTo || null,
  };
};


/* =========================================================
   API ERROR MESSAGE
========================================================= */

export const getApiErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.Message ||
    error?.response?.data?.title ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
};
