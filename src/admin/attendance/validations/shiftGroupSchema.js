
import { z } from "zod";

/* =========================================================
   COMMON REQUIRED STRING VALIDATION
========================================================= */

const requiredString = (fieldName, maxLength = 150) =>
  z
    .string({
      error: `${fieldName} is required`,
    })
    .trim()
    .min(1, `${fieldName} is required`)
    .max(
      maxLength,
      `${fieldName} cannot exceed ${maxLength} characters`
    );

/* =========================================================
   COMMON ID VALIDATION
   HANDLES UNDEFINED, NULL, EMPTY STRING AND NaN
========================================================= */

const idSchema = (fieldName) =>
  z
    .any()
    .refine(
      (value) => {
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (typeof value === "string" &&
            value.trim() === "")
        ) {
          return false;
        }

        const number = Number(value);

        return (
          Number.isFinite(number) &&
          Number.isInteger(number) &&
          number > 0
        );
      },
      {
        message: `Please select a valid ${fieldName}`,
      }
    )
    .transform((value) => Number(value));

/* =========================================================
   EFFECTIVE DATE VALIDATION
========================================================= */

const effectiveDateSchema = z
  .string({
    error: "Effective From is required",
  })
  .trim()
  .min(1, "Effective From is required")
  .refine(
    (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    },
    {
      message: "Please select a valid Effective From date",
    }
  );

/* =========================================================
   SHIFT GROUP VALIDATION SCHEMA
========================================================= */

export const shiftGroupSchema = z.object({
  /* -------------------------------------------------------
     BASIC DETAILS
  ------------------------------------------------------- */

  groupName: requiredString("Group Name"),

  groupCode: requiredString("Group Code", 50),

  description: z
    .string()
    .trim()
    .max(
      500,
      "Description cannot exceed 500 characters"
    )
    .optional()
    .default(""),

  /* -------------------------------------------------------
     GROUP CONFIGURATION
  ------------------------------------------------------- */

  rotationPattern: requiredString("Rotation Pattern"),

  effectiveFrom: effectiveDateSchema,

  secondDayShiftApplicable: z
    .boolean()
    .default(false),

  /* -------------------------------------------------------
     ORGANIZATION AND ENTITY
  ------------------------------------------------------- */

  organizationId: idSchema("Organization"),

  entityId: idSchema("Entity"),
});

/* =========================================================
   VALIDATE SHIFT GROUP FORM
========================================================= */

export const validateShiftGroup = (formData) => {
  const result = shiftGroupSchema.safeParse(formData);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
    };
  }

  const errors = {};

  result.error.issues.forEach((issue) => {
    const field = issue.path.join(".");

    if (!errors[field]) {
      errors[field] = issue.message;
    }
  });

  return {
    success: false,
    data: null,
    errors,
  };
};

export default shiftGroupSchema;
