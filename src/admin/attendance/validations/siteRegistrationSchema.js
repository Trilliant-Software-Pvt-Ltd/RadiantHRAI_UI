
import { z } from "zod";

export const siteRegistrationSchema = z.object({
  // Basic Information
  siteCode: z
    .string()
    .trim()
    .min(1, "Site Code is required.")
    .max(30, "Site Code cannot exceed 30 characters."),

  siteName: z
    .string()
    .trim()
    .min(1, "Site Name is required.")
    .max(100, "Site Name cannot exceed 100 characters."),

  siteType: z
    .string()
    .min(1, "Site Type is required."),

  // Organization Details
  country: z
    .string()
    .min(1, "Country is required."),

  // Organization API: RDHR0000IID
  organizationId: z
    .string()
    .min(1, "Legal Entity is required."),

  // Entity API: RDHR0000IIID
  entityId: z
    .string()
    .min(1, "Branch is required."),

  // Address Information
  addressLine1: z
    .string()
    .trim()
    .min(1, "Address Line 1 is required.")
    .max(150, "Address Line 1 cannot exceed 150 characters."),

  addressLine2: z.string().optional(),

  city: z
    .string()
    .trim()
    .min(1, "City is required."),

  state: z.string(),

  postalCode: z.string().trim(),

  // GPS Location
  latitude: z
    .string()
    .min(1, "Latitude is required.")
    .refine(
      (value) =>
        !Number.isNaN(Number(value)) &&
        Number(value) >= -90 &&
        Number(value) <= 90,
      "Enter a valid latitude (-90 to 90)."
    ),

  longitude: z
    .string()
    .min(1, "Longitude is required.")
    .refine(
      (value) =>
        !Number.isNaN(Number(value)) &&
        Number(value) >= -180 &&
        Number(value) <= 180,
      "Enter a valid longitude (-180 to 180)."
    ),

  geofenceRadius: z
    .string()
    .min(1, "Geofence Radius is required."),

  timezone: z
    .string()
    .min(1, "Site Timezone is required."),

  // Attendance Configuration
  attendanceEnabled: z.boolean(),

  automaticCheckIn: z.boolean(),

  automaticCheckOut: z.boolean(),
});
