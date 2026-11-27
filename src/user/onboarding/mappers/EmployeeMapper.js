
// =========================================================
// EMPLOYEE MAPPER
// =========================================================

// =========================================================
// DEFAULT EMPLOYEE API PAYLOAD
// =========================================================

export const getDefaultEmployeePayload = () => ({
    rdhR0000XIVId_Encrypted: "",
    isDeactivated: false,
    createdByUser: "",
    sourceID: "",

    rdhR0000IID: 0,
    rdhR0000IIID: 0,

    rdhR0000XIVOrigin: "",
    rdhR0000XIVNo: "",
    rdhR0000XIVCardNo: "",

    isNRI: false,
    salutation: "",

    rdhR0000XIVEmployeeName: "",

    rdhR0000XIID: 0,
    rdhR0000XIIID: 0,

    rdhR0000XVID: 0,
    rdhR0000XVIID: 0,
    rdhR0000XVIIID: 0,
    rdhR0000XVIIIID: 0,
    rdhR0000XIXID: 0,
    rdhR0000IXID: 0,
    rdhR0000IIIID: 0,
    rdhR0000CXVIID: 0,
    rdhR0000XXID: 0,

    joiningDate: null,
    joiningStatus: "",
    traineeDueDate: null,
    probationDueDate: null,
    confirmationDate: null,

    companyMobileNo: "",
    companyMailID: "",

    isReasigned: false,
    resignationDate: null,
    noticePeriodDays: 0,
    isExit: false,
    exitDate: null,

    faceEmbedding: "",
    dailyMonthly: "",

    firstName: "",
    middleName: "",
    lastName: "",

    aadhaarNo: "",
    aadhaarFile: "",
    pan: "",
    panFile: "",

    primaryMobile: "",
    emergencyMobileNo: "",

    birthdayDate: null,
    gender: "",
    bloodGroup: "",
    maritalStatus: "",
    anniversaryDate: null,

    signature: "",
    photo: "",
});

// =========================================================
// HELPER: CONVERT DATE TO API FORMAT
// =========================================================

const toApiDate = (date) => {
    if (!date) return null;

    if (date instanceof Date) {
        if (Number.isNaN(date.getTime())) return null;

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}T00:00:00`;
    }

    const dateValue = String(date).trim();

    if (!dateValue) return null;

    // Already in YYYY-MM-DD format or ISO format.
    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) {
        return `${match[1]}T00:00:00`;
    }

    return null;
};

// =========================================================
// HELPER: CONVERT API DATE TO FORM FORMAT
// =========================================================

const toFormDate = (date) => {
    if (!date) return "";

    const dateValue = String(date);

    const match = dateValue.match(/^(\d{4}-\d{2}-\d{2})/);

    return match ? match[1] : "";
};

// =========================================================
// HELPER: SPLIT FULL NAME
// =========================================================

const splitFullName = (fullName = "") => {
    const parts = String(fullName)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
        return {
            firstName: "",
            middleName: "",
            lastName: "",
        };
    }

    if (parts.length === 1) {
        return {
            firstName: parts[0],
            middleName: "",
            lastName: "",
        };
    }

    if (parts.length === 2) {
        return {
            firstName: parts[0],
            middleName: "",
            lastName: parts[1],
        };
    }

    return {
        firstName: parts[0],
        middleName: parts.slice(1, -1).join(" "),
        lastName: parts[parts.length - 1],
    };
};

// =========================================================
// HELPER: CONVERT MASTER ID
// =========================================================

const toMasterId = (value, fallback = 0) => {
    if (value === null || value === undefined || value === "") {
        return fallback;
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue)
        ? numericValue
        : fallback;
};

// =========================================================
// HELPER: CONVERT API MASTER ID TO SELECT VALUE
// =========================================================

const toSelectValue = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === 0 ||
        value === "0"
    ) {
        return "";
    }

    return String(value);
};

// =========================================================
// FORM DATA TO API PAYLOAD
// =========================================================

export const mapEmployeeToApi = (
    formData = {},
    originalRecord = null
) => {
    const defaults = getDefaultEmployeePayload();

    // Preserve original API values when updating an employee.
    const original = originalRecord || formData.rawEmployee || {};

    const payload = {
        ...defaults,
        ...original,
    };

    const fullName = String(formData.fullName || "").trim();

    const nameParts = splitFullName(fullName);

    return {
        ...payload,

        // -------------------------------------------------
        // EMPLOYEE BASIC DETAILS
        // -------------------------------------------------

        rdhR0000XIVEmployeeName: fullName,

        firstName: nameParts.firstName,
        middleName: nameParts.middleName,
        lastName: nameParts.lastName,

        companyMailID: formData.email || "",
        primaryMobile: formData.mobileNumber || "",

        gender: formData.gender || "",

        birthdayDate: toApiDate(formData.birthdayDate),

        // -------------------------------------------------
        // COMPANY
        // API FIELD: rdhR0000IID
        // -------------------------------------------------

        rdhR0000IID: toMasterId(
            formData.company,
            payload.rdhR0000IID
        ),

        // -------------------------------------------------
        // ENTITY
        // API FIELD: rdhR0000IIID
        // -------------------------------------------------

        rdhR0000IIID: toMasterId(
            formData.entity,
            payload.rdhR0000IIID
        ),

        // -------------------------------------------------
        // DEPARTMENT
        // API FIELD: rdhR0000XIID
        // -------------------------------------------------

        rdhR0000XIID: toMasterId(
            formData.department,
            payload.rdhR0000XIID
        ),

        // -------------------------------------------------
        // DESIGNATION
        // API FIELD: rdhR0000XIIID
        // -------------------------------------------------

        rdhR0000XIIID: toMasterId(
            formData.designation,
            payload.rdhR0000XIIID
        ),

        // -------------------------------------------------
        // SUBENTITY
        // API FIELD: rdhR0000IIIID
        // -------------------------------------------------

        rdhR0000IIIID: toMasterId(
            formData.subentity,
            payload.rdhR0000IIIID
        ),

        // -------------------------------------------------
        // GRADE
        // API FIELD: rdhR0000XVIIID
        // -------------------------------------------------

        rdhR0000XVIIID: toMasterId(
            formData.grade,
            payload.rdhR0000XVIIID
        ),

        // -------------------------------------------------
        // REMAINING MASTER FIELDS
        // -------------------------------------------------
        // Level and Cell are intentionally preserved from
        // the original API record until their exact mappings
        // are confirmed.
    };
};

// =========================================================
// API RESPONSE TO FORM DATA
// =========================================================

export const mapEmployeeFromApi = (employee = {}) => {
    const fullName =
        employee.rdhR0000XIVEmployeeName ||
        [
            employee.firstName,
            employee.middleName,
            employee.lastName,
        ]
            .filter(Boolean)
            .join(" ");

    return {
        // -------------------------------------------------
        // EMPLOYEE BASIC DETAILS
        // -------------------------------------------------

        fullName: fullName || "",

        email: employee.companyMailID || "",

        mobileNumber: employee.primaryMobile || "",

        gender: employee.gender || "",

        birthdayDate: toFormDate(employee.birthdayDate),

        // -------------------------------------------------
        // COMPANY
        // -------------------------------------------------

        company: toSelectValue(employee.rdhR0000IID),

        // -------------------------------------------------
        // ENTITY
        // -------------------------------------------------

        entity: toSelectValue(employee.rdhR0000IIID),

        // -------------------------------------------------
        // DEPARTMENT
        // -------------------------------------------------

        department: toSelectValue(employee.rdhR0000XIID),

        // -------------------------------------------------
        // DESIGNATION
        // -------------------------------------------------

        designation: toSelectValue(employee.rdhR0000XIIID),

        // -------------------------------------------------
        // SUBENTITY
        // -------------------------------------------------

        subentity: toSelectValue(employee.rdhR0000IIIID),

        // -------------------------------------------------
        // GRADE
        // -------------------------------------------------

        grade: toSelectValue(employee.rdhR0000XVIIID),

        // -------------------------------------------------
        // UNCONFIRMED MASTER MAPPINGS
        // -------------------------------------------------

        level: "",
        cell: "",

        // -------------------------------------------------
        // KEEP ORIGINAL API RESPONSE
        // -------------------------------------------------

        rawEmployee: employee,
    };
};
