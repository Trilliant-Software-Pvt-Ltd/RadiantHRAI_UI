import { z } from "zod";

/* =========================================================
   COMMON TIME VALIDATION
========================================================= */

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Select a valid time");

/* =========================================================
   OPTIONAL NUMERIC VALIDATION
   Empty values are treated as zero.
========================================================= */

const numericSchema = (max = Infinity) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? 0
        : value,
    z.coerce
      .number()
      .finite()
      .min(0, "Value cannot be negative")
      .max(max, `Value cannot exceed ${max}`),
  );

/* =========================================================
   OPTIONAL DROPDOWN ID VALIDATION
========================================================= */

const optionalIdSchema = z
  .union([
    z.literal(""),
    z.literal("0"),
    z.string().regex(/^[1-9]\d*$/, "Select a valid option"),
  ])
  .nullish();

/* =========================================================
   WEEK OFF CONFIGURATION
========================================================= */

const MAX_WEEK_OFF_DAYS = 3;

const WEEK_OFF_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const WEEK_OFF_PATTERNS = [
  "All",
  "Alternate",
];

const WEEK_OFF_DAY_TYPES = [
  "Full Day",
  "Half Day",
];

/* =========================================================
   INDIVIDUAL WEEK OFF VALIDATION
========================================================= */

const weekOffRowSchema = z
  .object({
    day: z
      .string()
      .refine(
        (value) => WEEK_OFF_DAYS.includes(value),
        "Select a valid week off day",
      ),

    pattern: z
      .string()
      .refine(
        (value) => WEEK_OFF_PATTERNS.includes(value),
        "Select a valid week off pattern",
      ),

    weeks: z
      .array(
        z
          .number()
          .int("Week number must be an integer")
          .min(1, "Week number must be between 1 and 5")
          .max(5, "Week number must be between 1 and 5"),
      )
      .max(5, "Maximum five week numbers are allowed")
      .default([]),

    dayType: z
      .string()
      .refine(
        (value) => WEEK_OFF_DAY_TYPES.includes(value),
        "Select week off duration",
      ),
  })

  .superRefine((row, ctx) => {
    /* =====================================================
       ALTERNATE WEEK VALIDATION
    ===================================================== */

    if (
      row.pattern === "Alternate" &&
      row.weeks.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["weeks"],
        message: `Select at least one week number for ${row.day}`,
      });
    }

    /* =====================================================
       DUPLICATE WEEK NUMBER VALIDATION
    ===================================================== */

    if (
      new Set(row.weeks).size !== row.weeks.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["weeks"],
        message: `Duplicate week numbers are not allowed for ${row.day}`,
      });
    }
  });

/* =========================================================
   WEEK OFF DAYS ARRAY VALIDATION
========================================================= */

const weekOffDaysSchema = z
  .array(weekOffRowSchema)
  .max(
    MAX_WEEK_OFF_DAYS,
    "Maximum three week off days are allowed",
  )
  .default([])

  .superRefine((rows, ctx) => {
    const selectedDays = new Set();

    rows.forEach((row, index) => {
      /* ===================================================
         DUPLICATE WEEK OFF DAY VALIDATION
      =================================================== */

      if (!row.day) return;

      if (selectedDays.has(row.day)) {
        ctx.addIssue({
          code: "custom",
          path: [index, "day"],
          message: `${row.day} is already configured as a week off day`,
        });
      }

      selectedDays.add(row.day);
    });
  });

/* =========================================================
   COFF ROW VALIDATION
========================================================= */

const coffRowSchema = z
  .object({
    enabled: z.boolean().default(false),

    from: z.unknown().optional(),

    to: z.unknown().optional(),
  })
  .superRefine((row, ctx) => {
    // Ignore disabled COFF rows.
    if (!row.enabled) return;

    const from = numericSchema().safeParse(row.from);

    const to = numericSchema().safeParse(row.to);

    if (!from.success) {
      ctx.addIssue({
        code: "custom",
        path: ["from"],
        message: "Enter a valid COFF minimum duration",
      });
    }

    if (!to.success) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "Enter a valid COFF maximum duration",
      });
    }

    if (
      from.success &&
      to.success &&
      from.data > to.data
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["to"],
        message: "COFF minimum cannot exceed maximum",
      });
    }
  });

/* =========================================================
   CUSTOM SCHEDULE VALIDATION
========================================================= */

const customScheduleSchema = z.object({
  lateMark: z.boolean().default(false),

  earlyExit: z.boolean().default(false),

  lateMarkGraceTime: z.unknown().optional(),

  earlyExitGraceTime: z.unknown().optional(),

  minimumWorkingHours: numericSchema(24),

  maximumWorkingHours: numericSchema(24),

  runawayStartTime: z.string().default(""),

  runAwayEndTime: z.string().default(""),
});

/* =========================================================
   OT SCHEDULE VALIDATION
========================================================= */

const otScheduleSchema = z.object({
  calculationDuration: numericSchema(),

  minimumOT: numericSchema(),

  maximumOT: numericSchema(),

  allowance: numericSchema(),
});

/* =========================================================
   SHIFT CREATION VALIDATION SCHEMA
========================================================= */

export const shiftCreationSchema = z
  .object({
    /* =====================================================
       SHIFT DETAILS - MANDATORY
    ===================================================== */

    shiftName: z
      .string()
      .trim()
      .min(1, "Enter shift name"),

    shiftCode: z
      .string()
      .trim()
      .min(1, "Enter shift code"),

    workMode: z
      .string()
      .refine(
        (value) =>
          ["Office", "Remote", "Hybrid"].includes(value),
        "Select work mode",
      ),

    shiftType: z
      .string()
      .refine(
        (value) =>
          [
            "Flexible Shift",
            "Fixed Shift",
            "Rotational Shift",
            "Night Shift",
            "General",
          ].includes(value),
        "Select shift type",
      ),

    timeZone: z
      .string()
      .trim()
      .min(1, "Select time zone"),

    /* =====================================================
       REGULAR SCHEDULE - MANDATORY
    ===================================================== */

    startTime: timeSchema,

    endTime: timeSchema,

    workingDays: z
      .array(
        z.enum([
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
          "Sun",
        ]),
      )
      .min(1, "Select at least one working day"),

    /* =====================================================
       WEEK OFF DAYS - OPTIONAL

       Maximum 3 configurations.
       Supports All and Alternate patterns.
       Supports Full Day and Half Day.
    ===================================================== */

    weekOffDays: weekOffDaysSchema,

    /* =====================================================
       BREAK DURATION
    ===================================================== */

    breakDuration: z
      .string()
      .regex(/^\d+ min$/, "Select a valid break duration")
      .default("0 min"),

    /* =====================================================
       LUNCH BREAK - CONDITIONAL
    ===================================================== */

    lunchBreak: z.boolean().default(false),

    lunchStart: z.string().default(""),

    /* =====================================================
       ADVANCED OPTIONS - OPTIONAL
    ===================================================== */

    organizationId: optionalIdSchema,

    entityId: optionalIdSchema,

    countryId: optionalIdSchema,

    applicableToAllCountries: z.boolean().default(false),

    /* =====================================================
       CUSTOM SCHEDULE - OPTIONAL
    ===================================================== */

    customSchedule: customScheduleSchema.optional(),

    /* =====================================================
       COFF SCHEDULE - OPTIONAL
    ===================================================== */

    coffSchedule: z
      .object({
        regularDay: z
          .array(coffRowSchema)
          .length(4)
          .optional(),

        woPh: z
          .array(coffRowSchema)
          .length(6)
          .optional(),
      })
      .optional(),

    /* =====================================================
       OT SCHEDULE - OPTIONAL
    ===================================================== */

    otSchedule: otScheduleSchema.optional(),
  })

  /* =======================================================
     CONDITIONAL AND CROSS-FIELD VALIDATIONS
  ======================================================= */

  .superRefine((form, ctx) => {
    const addIssue = (path, message) => {
      ctx.addIssue({
        code: "custom",
        path,
        message,
      });
    };

    /* =====================================================
       START AND END TIME VALIDATION
       Overnight shifts are allowed.
    ===================================================== */

    if (
      form.startTime &&
      form.endTime &&
      form.startTime === form.endTime
    ) {
      addIssue(
        ["endTime"],
        "Start and end time cannot be identical",
      );
    }

    /* =====================================================
       LUNCH BREAK VALIDATION
       Required only when lunch break is enabled.
    ===================================================== */

    if (form.lunchBreak) {
      if (
        !timeSchema.safeParse(form.lunchStart).success
      ) {
        addIssue(
          ["lunchStart"],
          "Select lunch start time",
        );
      }
    }

    /* =====================================================
       CUSTOM SCHEDULE VALIDATION
    ===================================================== */

    const custom = form.customSchedule;

    if (custom) {
      /* Late Mark Grace Time */

      if (
        custom.lateMark &&
        !numericSchema(120).safeParse(
          custom.lateMarkGraceTime,
        ).success
      ) {
        addIssue(
          ["customSchedule", "lateMarkGraceTime"],
          "Late mark grace time must be between 0 and 120 minutes",
        );
      }

      /* Early Exit Grace Time */

      if (
        custom.earlyExit &&
        !numericSchema(120).safeParse(
          custom.earlyExitGraceTime,
        ).success
      ) {
        addIssue(
          ["customSchedule", "earlyExitGraceTime"],
          "Early exit grace time must be between 0 and 120 minutes",
        );
      }

      /* Working Hours
         Compare only when both limits are configured.
      */

      if (
        custom.minimumWorkingHours > 0 &&
        custom.maximumWorkingHours > 0 &&
        custom.minimumWorkingHours >
          custom.maximumWorkingHours
      ) {
        addIssue(
          ["customSchedule", "minimumWorkingHours"],
          "Minimum working hours cannot exceed maximum working hours",
        );
      }

      /* Runaway Time
         Both fields may remain empty.
      */

      if (
        custom.runawayStartTime ||
        custom.runAwayEndTime
      ) {
        const validStartTime = timeSchema.safeParse(
          custom.runawayStartTime,
        ).success;

        const validEndTime = timeSchema.safeParse(
          custom.runAwayEndTime,
        ).success;

        if (!validStartTime) {
          addIssue(
            ["customSchedule", "runawayStartTime"],
            "Select runaway start time",
          );
        }

        if (!validEndTime) {
          addIssue(
            ["customSchedule", "runAwayEndTime"],
            "Select runaway end time",
          );
        }

        if (
          validStartTime &&
          validEndTime &&
          custom.runawayStartTime ===
            custom.runAwayEndTime
        ) {
          addIssue(
            ["customSchedule", "runAwayEndTime"],
            "Runaway start and end time cannot be identical",
          );
        }
      }
    }

    /* =====================================================
       OT SCHEDULE VALIDATION
       Maximum OT = 0 means no maximum limit.
    ===================================================== */

    const ot = form.otSchedule;

    if (
      ot &&
      ot.maximumOT > 0 &&
      ot.minimumOT > ot.maximumOT
    ) {
      addIssue(
        ["otSchedule", "minimumOT"],
        "Minimum OT cannot exceed maximum OT",
      );
    }
  });