import coreSettingsClient from "../../../api/axiosClientModule";

/* =========================================================
   BASE ENDPOINT AND MODULE CONFIGURATION
========================================================= */

const BASE_URL = "/settings/ShiftCreation";

const ATTENDANCE_CONFIG = {
  module: "attendance",
};

const CORE_SETTINGS_CONFIG = {
  module: "coreSettings",
};

/* =========================================================
   GET ALL SHIFT CREATION
========================================================= */

export const getAllShiftCreation = () => {
  return coreSettingsClient.get(
    `${BASE_URL}/GetAllShiftCreation`,
    ATTENDANCE_CONFIG
  );
};

/* =========================================================
   CREATE SHIFT CREATION
========================================================= */

export const createShiftCreation = (payload) => {
  return coreSettingsClient.post(
    `${BASE_URL}/CreateShiftCreation`,
    payload,
    ATTENDANCE_CONFIG
  );
};

/* =========================================================
   UPDATE SHIFT CREATION
========================================================= */

export const updateShiftCreation = (encryptedId, dto) => {
  return coreSettingsClient.patch(
    `${BASE_URL}/UpdateShiftCreation/${encodeURIComponent(
      encryptedId
    )}`,
    {
      encryptedId,
      dto,
    },
    ATTENDANCE_CONFIG
  );
};

/* =========================================================
   DELETE SHIFT CREATION
========================================================= */

export const deleteShiftCreation = (encryptedId) => {
  return coreSettingsClient.patch(
    `${BASE_URL}/DeleteShiftCreation/${encodeURIComponent(
      encryptedId
    )}`,
    undefined,
    ATTENDANCE_CONFIG
  );
};

/* =========================================================
   GET ALL ASSIGNED EMPLOYEES BY SHIFT ID
========================================================= */

export const getAllAssigned = (id) => {
  return coreSettingsClient.get(
    `${BASE_URL}/GetAllAssigned/Id`,
    {
      ...ATTENDANCE_CONFIG,
      params: {
        id: id,
      },
    }
  );
};

/* =========================================================
   GET ORGANIZATION LIST
========================================================= */

export const getOrganisationList = () => {
  return coreSettingsClient.get(
    "/Organization/GetOrganisationList",
    CORE_SETTINGS_CONFIG
  );
};

/* =========================================================
   GET ENTITY LIST
========================================================= */

export const getEntityList = () => {
  return coreSettingsClient.get(
    "/Entity/GetEntityList",
    CORE_SETTINGS_CONFIG
  );
};

/* =========================================================
   GET COUNTRY LIST
========================================================= */

export const getCountryList = () => {
  return coreSettingsClient.get(
    "/Country/GetCountryList",
    CORE_SETTINGS_CONFIG
  );
};

/* =========================================================
   GET SHIFT CREATION BY ENCRYPTED ID
========================================================= */

export const getShiftCreationById = (encryptedId) => {
  return coreSettingsClient.get(
    `${BASE_URL}/GetShiftCreationByID/${encodeURIComponent(
      encryptedId
    )}`,
    ATTENDANCE_CONFIG
  );
};

/* =========================================================
   COMMON RESPONSE EXTRACTOR
========================================================= */

export const extractArray = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.data)) return data.data;

  if (Array.isArray(data?.Data)) return data.Data;

  if (Array.isArray(data?.result)) return data.result;

  if (Array.isArray(data?.Result)) return data.Result;

  return [];
};

/* =========================================================
   CASE INSENSITIVE FIELD EXTRACTOR
========================================================= */

const getFieldValue = (item, fieldName) => {
  if (!item || !fieldName) return undefined;

  if (item[fieldName] !== undefined) {
    return item[fieldName];
  }

  const matchingKey = Object.keys(item).find(
    (key) =>
      key.toLowerCase() === fieldName.toLowerCase()
  );

  return matchingKey ? item[matchingKey] : undefined;
};

/* =========================================================
   COMMON DROPDOWN OPTIONS MAPPER
========================================================= */

export const mapOptions = (
  response,
  idField,
  nameField
) => {
  return extractArray(response)
    .map((item) => ({
      value: String(
        getFieldValue(item, idField) ?? ""
      ),

      label: String(
        getFieldValue(item, nameField) ?? ""
      ),
    }))
    .filter(
      (option) =>
        Number(option.value) > 0 &&
        option.label.trim() !== ""
    );
};

/* =========================================================
   ORGANIZATION OPTIONS
========================================================= */

export const mapOrganizationOptions = (response) => {
  return mapOptions(
    response,
    "RDHR0000IID",
    "RDHR0000IName"
  );
};

/* =========================================================
   ENTITY OPTIONS
========================================================= */

export const mapEntityOptions = (response) => {
  return mapOptions(
    response,
    "RDHR0000IIID",
    "RDHR0000IIName"
  );
};

/* =========================================================
   COUNTRY OPTIONS
========================================================= */

export const mapCountryOptions = (response) => {
  return mapOptions(
    response,
    "RDHR0000XID",
    "RDHR0000XName"
  );
};

/* =========================================================
   CONVERT TIME INTO MINUTES
========================================================= */

export const timeMinutes = (value) => {
  if (!value) return 0;

  const [hours, minutes] = String(value)
    .split(":")
    .map(Number);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return 0;
  }

  return hours * 60 + minutes;
};

/* =========================================================
   CALCULATE DURATION IN MINUTES

   Regular Shift:
   09:00 to 18:00 = 540 minutes

   Overnight Shift:
   22:00 to 06:00 = 480 minutes
========================================================= */

export const durationMinutes = (
  startTime,
  endTime
) => {
  if (!startTime || !endTime) return 0;

  const start = timeMinutes(startTime);

  const end = timeMinutes(endTime);

  return (end - start + 1440) % 1440;
};

/* =========================================================
   CONVERT TIME FOR API
   HH:mm -> HH:mm:ss
========================================================= */

export const apiTime = (value) => {
  if (!value) return "00:00:00";

  return `${String(value).slice(0, 5)}:00`;
};

/* =========================================================
   CALCULATE LUNCH END TIME
========================================================= */

export const lunchEnd = (
  startTime,
  duration
) => {
  if (!startTime) return "";

  const breakMinutes =
    parseInt(duration || 0, 10) || 0;

  const totalMinutes =
    (timeMinutes(startTime) + breakMinutes) % 1440;

  const hours = String(
    Math.floor(totalMinutes / 60)
  ).padStart(2, "0");

  const minutes = String(
    totalMinutes % 60
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
};

/* =========================================================
   COFF FIELD PREFIXES
========================================================= */

export const coffPrefixes = {
  regularDay: [
    "coff_Half_Regular",
    "coff_Full_Regular",
    "coff_Full_Half_Regular",
    "coff_Two_Regular",
  ],

  woPh: [
    "coff_Half_PH",
    "coff_Full_PH",
    "coff_Full_Half_PH",
    "coff_Two_PH",
    "coff_Two_Half_PH",
    "coff_Three_PH",
  ],
};

/* =========================================================
   WORKING DAYS MAPPING
========================================================= */

const weekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabels = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

/* =========================================================
   WEEK OFF CONFIGURATION
========================================================= */

const MAX_WEEK_OFF_DAYS = 3;

const ALL_WEEK_NUMBERS = [1, 2, 3, 4, 5];

/* =========================================================
   NORMALIZE WEEK OFF NUMBERS
========================================================= */

const normalizeWeekNumbers = (weeks) => {
  if (weeks == null || weeks === "") {
    return [];
  }

  const values = Array.isArray(weeks)
    ? weeks
    : String(weeks).split(",");

  return [
    ...new Set(
      values
        .map((week) => Number(week))
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
   MAP WEEK OFF DAYS PAYLOAD

   WEEKOFF1
   WEEKOFF1_pattern
   WEEKOFF1_WeekDay
   WEEKOFF1_DayType

   Maximum 3 week off configurations.
========================================================= */

export const mapWeekOffPayload = (
  weekOffDays = []
) => {
  const payload = {};

  const rows = Array.isArray(weekOffDays)
    ? weekOffDays
    : [];

  for (
    let index = 1;
    index <= MAX_WEEK_OFF_DAYS;
    index++
  ) {
    const row = rows[index - 1];

    const prefix = `WEEKOFF${index}`;

    const day = String(
      row?.day ?? ""
    ).trim();

    const hasDay = Boolean(day);

    const pattern = hasDay
      ? String(row?.pattern ?? "").trim()
      : "";

    const dayType = hasDay
      ? String(row?.dayType ?? "").trim()
      : "";

    /* =====================================================
       WEEK NUMBER MAPPING

       All       -> 1,2,3,4,5
       Alternate -> Selected week numbers
       Empty     -> ""
    ===================================================== */

    const weeks = !hasDay
      ? []
      : pattern === "All"
        ? [...ALL_WEEK_NUMBERS]
        : normalizeWeekNumbers(row?.weeks);

    /* =====================================================
       MAP INDIVIDUAL WEEK OFF FIELDS
    ===================================================== */

    payload[prefix] = day;

    payload[`${prefix}_pattern`] = pattern;

    payload[`${prefix}_WeekDay`] = weeks.join(",");

    payload[`${prefix}_DayType`] = dayType;
  }

  return payload;
};

/* =========================================================
   COMMON NUMBER CONVERTER
========================================================= */

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/* =========================================================
   MAP SHIFT CREATION PAYLOAD
========================================================= */

export const mapShiftPayload = (
  form,
  audit = {}
) => {
  const customSchedule =
    form.customSchedule ?? {};

  const otSchedule =
    form.otSchedule ?? {};

  const payload = {
    /* =====================================================
       AUDIT DETAILS
    ===================================================== */

    isDeactivated: false,

    createdByUser:
      audit.employeeName ??
      audit.createdByUser ??
      "",

    createdDate: new Date().toISOString(),

    sourceID: audit.sourceID || "WEB",

    /* =====================================================
       ADVANCED OPTIONS
    ===================================================== */

    rdhR0000IID: toNumber(
      form.organizationId
    ),

    rdhR0000IIID: toNumber(
      form.entityId
    ),

    rdhR0000XID: form.applicableToAllCountries
      ? 0
      : toNumber(form.countryId),

    /* =====================================================
       SHIFT DETAILS
    ===================================================== */

    shiftName: String(
      form.shiftName ?? ""
    ).trim(),

    shiftCode: String(
      form.shiftCode ?? ""
    )
      .trim()
      .toUpperCase(),

    shiftType: form.shiftType ?? "",

    shiftTimeZone: form.timeZone ?? "",

    workMode: form.workMode ?? "",

    /* =====================================================
       REGULAR SCHEDULE
    ===================================================== */

    beginTime: apiTime(
      form.startTime
    ),

    endTime: apiTime(
      form.endTime
    ),

    shiftFlag: true,

    duration: durationMinutes(
      form.startTime,
      form.endTime
    ),

    punchBeginDuration: 0,

    /* =====================================================
       LUNCH BREAK
    ===================================================== */

    lunchTime: apiTime(
      form.lunchBreak
        ? form.lunchStart
        : ""
    ),

    lunchTimeMin:
      parseInt(
        form.breakDuration || 0,
        10
      ) || 0,

    lunchTimePunchBegin: 0,

    lunchFlag: form.lunchBreak ? 1 : 0,

    /* =====================================================
       CUSTOM SCHEDULE
    ===================================================== */

    graceTimeForLateComming:
      customSchedule.lateMark
        ? toNumber(
            customSchedule.lateMarkGraceTime
          )
        : null,

    graceTimeForEarlyGoing:
      customSchedule.earlyExit
        ? toNumber(
            customSchedule.earlyExitGraceTime
          )
        : null,

    shiftDurationForHD: Math.round(
      toNumber(
        customSchedule.minimumWorkingHours
      ) * 60
    ),

    shiftDurationForPP: Math.round(
      toNumber(
        customSchedule.maximumWorkingHours
      ) * 60
    ),

    /* =====================================================
       RUNAWAY TIME / SHIFT BREAK
    ===================================================== */

    runawayStartTime: apiTime(
      customSchedule.runawayStartTime
    ),

    runAwayEndTime: apiTime(
      customSchedule.runAwayEndTime
    ),

    runawayDurationMin: durationMinutes(
      customSchedule.runawayStartTime,
      customSchedule.runAwayEndTime
    ),

    allowShortLeaveWithoutLunchDinner: false,

    /* =====================================================
       COFF SCHEDULE
    ===================================================== */

    coffValidDays: 0,

    /* =====================================================
       OT SCHEDULE
    ===================================================== */

    shiftDurationForOTCalculation: toNumber(
      otSchedule.calculationDuration
    ),

    minOT: String(
      toNumber(otSchedule.minimumOT)
    ),

    isMaxOT: false,

    maxOT: toNumber(
      otSchedule.maximumOT
    ),

    shiftAllowances: toNumber(
      otSchedule.allowance
    ),
  };

  /* =======================================================
     MAP WORKING DAYS
  ======================================================= */

  weekdays.forEach((day, index) => {
    payload[day] = (
      form.workingDays ?? []
    ).includes(dayLabels[index]);
  });

  /* =======================================================
     MAP WEEK OFF DAYS

     Supports maximum 3 configurations.

     All 12 fields are always included in the payload,
     even when no week off days are configured.

     This also supports clearing removed configurations
     during shift updation.
  ======================================================= */

  Object.assign(
    payload,
    mapWeekOffPayload(form.weekOffDays)
  );

  /* =======================================================
     MAP COFF SCHEDULE

     REGULAR DAY - 4 ROWS
     WO/PH       - 6 ROWS
  ======================================================= */

  Object.entries(coffPrefixes).forEach(
    ([section, prefixes]) => {
      prefixes.forEach((prefix, index) => {
        const row =
          form.coffSchedule?.[section]?.[index] ?? {};

        const enabled = Boolean(
          row.enabled
        );

        payload[`${prefix}_Applicable`] = enabled;

        payload[`${prefix}_From`] = enabled
          ? toNumber(row.from)
          : 0;

        payload[`${prefix}_To`] = enabled
          ? toNumber(row.to)
          : 0;
      });
    }
  );

  return payload;
};

/* =========================================================
   COMMON API ERROR HANDLER
========================================================= */

export const getApiErrorMessage = (error) => {
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

  if (data?.message) return data.message;

  if (data?.Message) return data.Message;

  if (data?.title) return data.title;

  return (
    error?.message ||
    "Request failed. Please try again."
  );
};