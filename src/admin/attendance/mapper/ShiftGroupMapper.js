
/* =========================================================
   SHIFT GROUP - API PAYLOAD MAPPER
========================================================= */

const toValidId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
};

const toISOString = (date) => {
  if (!date) return null;

  // Date-only values are interpreted as UTC midnight.
  const parsedDate = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? `${date}T00:00:00.000Z`
      : date
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
};

/* =========================================================
   CREATE SHIFT GROUP PAYLOAD
========================================================= */

export const mapCreateShiftGroupPayload = (
  form,
  user = {},
  organizationId,
  entityId
) => {
  return {
    isDeactivated: false,

    createdByUser:
      user?.employeeName ||
      user?.name ||
      "",

    sourceID:
      user?.sourceID ||
      "WEB",

    rdhR0000IID: toValidId(organizationId),

    rdhR0000IIID: toValidId(entityId),

    rdhR0000XCIXFName:
      form.groupName?.trim() || "",

    rdhR0000XCIXSName:
      form.groupCode?.trim().toUpperCase() || "",

    rdhR0000XCIXDescription:
      form.description?.trim() || "",

    // Backend field spelling retained exactly
    rotationPattren:
      form.rotationPattern || "No Rotation",

    effectiveFrom:
      toISOString(form.effectiveFrom),

    secondDayShiftApplicable:
      Boolean(form.secondDayShiftApplicable),
  };
};
