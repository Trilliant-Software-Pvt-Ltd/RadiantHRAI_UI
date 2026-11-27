/* =========================================================
   COMMON RESPONSE EXTRACTOR
========================================================= */

export const extractShiftCreations = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.Data)) return data.Data;

  if (Array.isArray(data?.result)) return data.result;

  if (Array.isArray(data?.Result)) return data.Result;

  return [];
};

/* =========================================================
   EXTRACT SINGLE SHIFT CREATION
========================================================= */

export const extractShiftCreationById = (response) => {
  const data = response?.data ?? response;

  const record =
    data?.data ??
    data?.Data ??
    data?.result ??
    data?.Result ??
    data;

  if (Array.isArray(record)) {
    return record[0] ?? null;
  }

  if (
    record &&
    typeof record === "object" &&
    (record.rdhR0000LXXXIID != null ||
      record.rdhR0000LXXXIID_Encrypted)
  ) {
    return record;
  }

  return null;
};

export const formatShiftTime = (value) => {
  if (!value) return "-";

  const match = String(value).match(
    /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/
  );

  if (!match) return "-";

  const hours = Number(match[1]);

  const minutes = match[2];

  const period = hours >= 12 ? "PM" : "AM";

  const formattedHours = String(
    hours % 12 || 12
  ).padStart(2, "0");

  return `${formattedHours}:${minutes} ${period}`;
};

/* =========================================================
   EXTRACT ENTITY LIST
========================================================= */

export const extractEntities = (response) => {
  return extractShiftCreations(response);
};

/* =========================================================
   CREATE ENTITY LOOKUP MAP
========================================================= */

export const createEntityMap = (response) => {
  const entities = extractEntities(response);

  const entityMap = new Map();

  entities.forEach((item) => {
    const id =
      item?.RDHR0000IIID ??
      item?.rdhR0000IIID;

    const name =
      item?.RDHR0000IIName ??
      item?.rdhR0000IIName ??
      item?.RDHR0000IIIName ??
      item?.rdhR0000IIIName;

    if (
      id != null &&
      name != null &&
      String(name).trim()
    ) {
      entityMap.set(
        String(id),
        String(name).trim()
      );
    }
  });

  return entityMap;
};

/* =========================================================
   MAP SHIFT CREATION FOR LIST
========================================================= */

export const mapShiftCreation = (
  item,
  entityMap = new Map()
) => {
  const entityId = item?.RDHR0000IIID ?? null;

  const entityName =
    item?.rdhR0000IIName ??
    item?.rdhR0000IIIName ??
    entityMap.get(String(entityId));

  return {
    /* =====================================================
       PRIMARY IDENTIFIERS
    ===================================================== */

    id: item?.rdhR0000LXXXIID ?? null,

    encryptedId:
      item?.rdhR0000LXXXIID_Encrypted ?? null,

    /* =====================================================
       ORGANIZATION / ENTITY / COUNTRY
    ===================================================== */

    organizationId: item?.rdhR0000IID ?? null,

    entityId,

    countryId: item?.rdhR0000XID ?? null,

    /* =====================================================
       TABLE DISPLAY FIELDS
    ===================================================== */

    shiftName: item?.ShiftName ?? "-",

    shiftCode: item?.ShiftCode ?? "-",

    entity:
      entityName ||
      (entityId != null
        ? `Entity ID: ${entityId}`
        : "-"),

    startTime: formatShiftTime(
      item?.BeginTime
    ),

    endTime: formatShiftTime(
      item?.EndTime
    ),

    /* =====================================================
       ORIGINAL TIME VALUES
    ===================================================== */

    beginTime: item?.BeginTime ?? "",

    originalEndTime: item?.EndTime ?? "",

    /* =====================================================
       ADDITIONAL DETAILS
    ===================================================== */

    shiftType: item?.shiftType ?? "",

    timeZone: item?.shiftTimeZone ?? "",

    workMode: item?.workMode ?? "",

    duration: item?.duration ?? 0,

    isDeactivated:
      item?.isDeactivated ?? false,

    /* =====================================================
       RETAIN ORIGINAL API RECORD
    ===================================================== */

    rawData: item,
  };
};

/* =========================================================
   COMMON API ERROR MESSAGE
========================================================= */

export const getApiErrorMessage = (
  error,
  fallbackMessage = "Something went wrong."
) => {
  const data = error?.response?.data;

  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data;
  }

  if (data?.errors) {
    const messages = Object.values(data.errors)
      .flat()
      .filter(Boolean)
      .join(" ");

    if (messages) return messages;
  }

  return (
    data?.message ||
    data?.Message ||
    data?.title ||
    error?.message ||
    fallbackMessage
  );
};