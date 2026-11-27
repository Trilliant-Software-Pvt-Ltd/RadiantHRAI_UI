/* =========================================================
   COMMON FIELD VALUE EXTRACTOR
   SUPPORTS PASCAL CASE AND CAMEL CASE
========================================================= */

const getField = (item, ...keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      return item[key];
    }
  }

  return null;
};

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
    (
      getField(
        record,
        "RDHR0000LXXXIID",
        "rdhR0000LXXXIID"
      ) != null ||
      getField(
        record,
        "RDHR0000LXXXIID_Encrypted",
        "rdhR0000LXXXIID_Encrypted"
      )
    )
  ) {
    return record;
  }

  return null;
};

/* =========================================================
   FORMAT SHIFT TIME
========================================================= */

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
    const id = getField(
      item,
      "RDHR0000IIID",
      "rdhR0000IIID"
    );

    const name = getField(
      item,
      "RDHR0000IIName",
      "rdhR0000IIName",
      "RDHR0000IIIName",
      "rdhR0000IIIName"
    );

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
   WORKING DAY CONFIGURATION
========================================================= */

const workingDayConfig = [
  { label: "Mon", field: "Monday" },
  { label: "Tue", field: "Tuesday" },
  { label: "Wed", field: "Wednesday" },
  { label: "Thu", field: "Thursday" },
  { label: "Fri", field: "Friday" },
  { label: "Sat", field: "Saturday" },
  { label: "Sun", field: "Sunday" },
];

/* =========================================================
   EXTRACT WORKING DAYS
========================================================= */

export const extractWorkingDays = (item) => {
  return workingDayConfig
    .filter(({ field }) => {
      const value = getField(
        item,
        field,
        field.toLowerCase()
      );

      return (
        value === true ||
        value === 1 ||
        String(value).toLowerCase() === "true" ||
        value === "1"
      );
    })
    .map(({ label }) => label);
};

/* =========================================================
   WEEK OFF DAY CONFIGURATION
========================================================= */

const MAX_WEEK_OFF_DAYS = 3;

const ALL_WEEK_NUMBERS = [1, 2, 3, 4, 5];

const weekDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* =========================================================
   NORMALIZE WEEK OFF DAY NAME
========================================================= */

const normalizeWeekOffDay = (value) => {
  const day = String(value ?? "")
    .trim()
    .toLowerCase();

  return (
    weekDayNames.find(
      (item) =>
        item.toLowerCase() === day ||
        item.slice(0, 3).toLowerCase() === day
    ) ?? ""
  );
};

/* =========================================================
   NORMALIZE WEEK OFF PATTERN
========================================================= */

const normalizeWeekOffPattern = (value) => {
  const pattern = String(value ?? "")
    .trim()
    .toLowerCase();

  if (pattern === "all") return "All";

  if (pattern === "alternate") return "Alternate";

  return "";
};

/* =========================================================
   NORMALIZE WEEK OFF DAY TYPE
========================================================= */

const normalizeWeekOffDayType = (value) => {
  const dayType = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  if (dayType === "halfday") return "Half Day";

  if (dayType === "fullday") return "Full Day";

  return "";
};

/* =========================================================
   EXTRACT WEEK NUMBERS
========================================================= */

export const extractWeekNumbers = (value) => {
  if (value == null || value === "") {
    return [];
  }

  const values = Array.isArray(value)
    ? value
    : String(value).split(",");

  return [
    ...new Set(
      values
        .map((week) => Number(String(week).trim()))
        .filter(
          (week) =>
            Number.isInteger(week) &&
            week >= 1 &&
            week <= 5
        )
    ),
  ].sort((a, b) => a - b);
};

/* =========================================================
   EXTRACT WEEK OFF FIELD
   SUPPORTS DIFFERENT API RESPONSE CASING
========================================================= */

const getWeekOffField = (
  item,
  index,
  suffix = ""
) => {
  return getField(
    item,
    `WEEKOFF${index}${suffix}`,
    `weekofF${index}${suffix}`,
    `weekoff${index}${suffix}`,
    `WeekOff${index}${suffix}`,
    `weekOff${index}${suffix}`
  );
};

/* =========================================================
   EXTRACT WEEK OFF DAYS
========================================================= */

export const extractWeekOffDays = (item) => {
  const weekOffDays = [];

  for (
    let index = 1;
    index <= MAX_WEEK_OFF_DAYS;
    index++
  ) {
    const day = normalizeWeekOffDay(
      getWeekOffField(item, index)
    );

    // Ignore empty or invalid week-off configurations.
    if (!day) continue;

    const pattern = normalizeWeekOffPattern(
      getWeekOffField(
        item,
        index,
        "_pattern"
      )
    );

    const dayType = normalizeWeekOffDayType(
      getWeekOffField(
        item,
        index,
        "_DayType"
      )
    );

    const weeks =
      pattern === "All"
        ? [...ALL_WEEK_NUMBERS]
        : extractWeekNumbers(
            getWeekOffField(
              item,
              index,
              "_WeekDay"
            )
          );

    weekOffDays.push({
      day,
      pattern,
      weeks,
      dayType,
    });
  }

  return weekOffDays;
};

/* =========================================================
   MAP SHIFT CREATION FOR LIST
========================================================= */

export const mapShiftCreation = (
  item,
  entityMap = new Map()
) => {
  const entityId = getField(
    item,
    "RDHR0000IIID",
    "rdhR0000IIID"
  );

  const entityName =
    getField(
      item,
      "RDHR0000IIName",
      "rdhR0000IIName",
      "RDHR0000IIIName",
      "rdhR0000IIIName"
    ) ??
    entityMap.get(String(entityId));

  const beginTime =
    getField(
      item,
      "BeginTime",
      "beginTime"
    ) ?? "";

  const endTime =
    getField(
      item,
      "EndTime",
      "endTime"
    ) ?? "";

  return {
    /* =====================================================
       PRIMARY IDENTIFIERS
    ===================================================== */

    id: getField(
      item,
      "RDHR0000LXXXIID",
      "rdhR0000LXXXIID"
    ),

    encryptedId: getField(
      item,
      "RDHR0000LXXXIID_Encrypted",
      "rdhR0000LXXXIID_Encrypted"
    ),

    /* =====================================================
       ORGANIZATION / ENTITY / COUNTRY
    ===================================================== */

    organizationId: getField(
      item,
      "RDHR0000IID",
      "rdhR0000IID"
    ),

    entityId,

    countryId: getField(
      item,
      "RDHR0000XID",
      "rdhR0000XID"
    ),

    /* =====================================================
       TABLE DISPLAY FIELDS
    ===================================================== */

    shiftName:
      getField(
        item,
        "ShiftName",
        "shiftName"
      ) ?? "-",

    shiftCode:
      getField(
        item,
        "ShiftCode",
        "shiftCode"
      ) ?? "-",

    entity:
      entityName ||
      (
        entityId != null
          ? `Entity ID: ${entityId}`
          : "-"
      ),

    startTime: formatShiftTime(beginTime),

    endTime: formatShiftTime(endTime),

    /* =====================================================
       ORIGINAL TIME VALUES
    ===================================================== */

    beginTime,

    originalEndTime: endTime,

    /* =====================================================
       ADDITIONAL DETAILS
    ===================================================== */

    shiftType:
      getField(
        item,
        "ShiftType",
        "shiftType"
      ) ?? "",

    timeZone:
      getField(
        item,
        "ShiftTimeZone",
        "shiftTimeZone"
      ) ?? "",

    workMode:
      getField(
        item,
        "WorkMode",
        "workMode"
      ) ?? "",

    duration:
      getField(
        item,
        "Duration",
        "duration"
      ) ?? 0,

    isDeactivated:
      getField(
        item,
        "IsDeactivated",
        "isDeactivated"
      ) ?? false,

    /* =====================================================
       WORKING DAYS
    ===================================================== */

    workingDays: extractWorkingDays(item),

    /* =====================================================
       WEEK OFF DAYS
    ===================================================== */

    weekOffDays: extractWeekOffDays(item),

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