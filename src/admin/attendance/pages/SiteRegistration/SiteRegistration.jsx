import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../../../auth/store/authStore";

import {
  FiTarget,
} from "react-icons/fi";

import {
  createSiteRegistration,
  updateSiteRegistration,
  getOrganisationList,
  getEntityList,
    getCountryList,
  getStateList,
} from "../../services/SiteRegistrationApi.js";

import {
  mapSiteRegistrationPayload,
  getApiErrorMessage,
  extractOrganizations,
  extractEntities,
  mapOrganizationOptions,
  mapEntityOptions,
} from "../../mapper/SiteRegistrationMapper.js";

import "leaflet/dist/leaflet.css";

import FormInput from "../../../../../src/common/components/Form/FormInput";
import FormSelect from "../../../../../src/common/components/Form/FormSelect";
import FormButton from "../../../../../src/common/components/Form/FormButton";

import SiteLocationMap from "../../../../common/components/SiteMap/SiteLocationMap";
import FormToggleButton from "../../../../common/components/FormToggleBtn/FormToggleBtn";

import { siteRegistrationSchema } from "../../validations/siteRegistrationSchema";
import Toast from "../../../../common/components/Popups/Toast";

import { reverseGeocode } from "../../../../common/services/geoapifyService";

import "./SiteRegistration.css";

/* =========================================================
   INITIAL FORM DATA
========================================================= */

const initialFormData = {
  siteCode: "",
  siteName: "",
  siteType: "OFFICE",

  country: "",
  organizationId: "",
  entityId: "",

  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",

  latitude: "",
  longitude: "",
  geofenceRadius: "200",
  timezone: "Asia/Kolkata",

  attendanceEnabled: true,
  automaticCheckIn: true,
  automaticCheckOut: true,

  effectiveFrom: "",
  effectiveTo: "",
};

/* =========================================================
   DROPDOWN OPTIONS
========================================================= */

const siteTypeOptions = [
  { label: "Project Site", value: "PROJECT_SITE" },
  { label: "Client Site", value: "CLIENT_SITE" },
  { label: "Warehouse", value: "WAREHOUSE" },
  { label: "Factory", value: "FACTORY" },
  { label: "Office", value: "OFFICE" },
];

const radiusOptions = [
  { value: "50", label: "50 m" },
  { value: "100", label: "100 m" },
  { value: "200", label: "200 m" },
  { value: "300", label: "300 m" },
  { value: "500", label: "500 m" },
  { value: "1000", label: "1000 m" },
];

const timezoneOptions = [
  {
    value: "Asia/Kolkata",
    label: "(GMT+05:30) Asia/Kolkata",
  },
  {
    value: "Asia/Dubai",
    label: "(GMT+04:00) Asia/Dubai",
  },
  {
    value: "Europe/London",
    label: "(GMT+00:00) Europe/London",
  },
  {
    value: "America/New_York",
    label: "(GMT-05:00) America/New_York",
  },
];

/* =========================================================
   COMMON RESPONSE EXTRACTOR
========================================================= */

const extractResponseArray = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.Result)) return data.Result;

  return [];
};

/* =========================================================
   MAP COUNTRY DROPDOWN OPTIONS

   API:
   GET /Country/GetAllCountrys

   RDHR0000XID  -> Country ID
   RDHR0000XName -> Country Name
========================================================= */

const mapCountryDropdownOptions = (response) => {
  return extractResponseArray(response)
    .filter((item) => item?.RDHR0000XID != null)
    .map((item) => ({
      value: String(item.RDHR0000XName || ""),
      label: item.RDHR0000XName || "",
      id: item.RDHR0000XID,
    }))
    .filter((item) => item.value);
};

/* =========================================================
   MAP STATE DROPDOWN OPTIONS

   API:
   GET /State/GetStateList

   RDHR0000CCXXIID -> State ID
   StateName       -> State Name

   state_region in the current Site Registration payload
   is a string, so the dropdown value remains StateName.
========================================================= */

const mapStateDropdownOptions = (response) => {
  return extractResponseArray(response)
    .filter((item) => item?.StateName)
    .map((item) => ({
      value: String(item.StateName),
      label: String(item.StateName),
      id: item.RDHR0000CCXXIID,
    }));
};

/* =========================================================
   DATE FORMATTER FOR DATE INPUTS
========================================================= */

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

/* =========================================================
   MAP SELECTED SITE TO FORM DATA
========================================================= */

const mapSiteToFormData = (site) => {
  if (!site) return { ...initialFormData };

  return {
    ...initialFormData,

    siteCode: site.siteCode || "",
    siteName: site.siteName || "",

    siteType: String(site.siteType || "OFFICE")
      .toUpperCase()
      .replace(/\s+/g, "_"),

    // The dropdown stores the country name as its value.
    // Support both fields returned by the list/API mapper.
    country: String(site.countryName || site.country || "").trim(),

    organizationId:
      site.organizationId != null
        ? String(site.organizationId)
        : "",

    entityId:
      site.entityId != null
        ? String(site.entityId)
        : "",

    addressLine1: site.addressLine1 || "",
    city: site.city || "",
    state: site.stateRegion || "",
    postalCode: site.postalCode || "",

    latitude:
      site.latitude != null
        ? String(site.latitude)
        : "",

    longitude:
      site.longitude != null
        ? String(site.longitude)
        : "",

    geofenceRadius:
      site.radiusMeters != null
        ? String(site.radiusMeters)
        : "200",

    timezone: site.timezone || "Asia/Kolkata",

    attendanceEnabled: site.attendanceEnabled ?? false,
    automaticCheckIn: site.autoCheckinEnabled ?? false,
    automaticCheckOut: site.autoCheckoutEnabled ?? false,

    effectiveFrom: toDateInputValue(site.effectiveFrom),
    effectiveTo: toDateInputValue(site.effectiveTo),
  };
};

/* =========================================================
   COMPONENT
========================================================= */

const SiteRegistration = ({
  onList,
  organizationId: initialOrganizationId,
  entityId: initialEntityId,
  branchId = 0,
  createdByUser,
  sourceID,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const editingSite = location.state?.site || null;

  const isEdit =
    location.state?.mode === "edit" ||
    location.state?.isEdit === true;

  // Numeric ID is retained for the request body only.
  const recordId = editingSite?.id;

  // Encrypted ID is used in the Update API URL.
  const encryptedId = editingSite?.encryptedId;

  /* =======================================================
     AUTH STORE
  ======================================================= */

  const employeeName = useAuthStore(
    (state) =>
      state.employeeName ||
      state.user?.EmployeeName ||
      state.user?.employeeName ||
      ""
  );

  const authSourceID = useAuthStore(
    (state) =>
      state.sourceID ||
      state.user?.SourceID ||
      state.user?.sourceID ||
      ""
  );

  const loggedInUser = String(
    createdByUser || employeeName || ""
  ).trim();

  const loggedInSourceID =
    sourceID || authSourceID || "WEB";

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [formData, setFormData] = useState(() => {
    if (isEdit && editingSite) {
      return mapSiteToFormData(editingSite);
    }

    return {
      ...initialFormData,
      organizationId: initialOrganizationId ?? "",
      entityId: initialEntityId ?? "",
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [collapsedSections, setCollapsedSections] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const reverseGeocodeRef = useRef(null);
  const locationVersionRef = useRef(0);

  useEffect(() => {
    return () => {
      locationVersionRef.current += 1;
      reverseGeocodeRef.current?.abort();
    };
  }, [isEdit, editingSite]);

  /* =======================================================
     DROPDOWN STATES
  ======================================================= */

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [entityOptions, setEntityOptions] = useState([]);

  const [countryOptions, setCountryOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);

  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  /* =======================================================
     UPDATE FORM WHEN EDIT RECORD CHANGES
  ======================================================= */

  useEffect(() => {
    if (isEdit && editingSite) {
      setFormData(mapSiteToFormData(editingSite));
      setErrors({});
    }
  }, [isEdit, editingSite]);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = useCallback((message, type = "error") => {
    setToast({
      id: Date.now(),
      message,
      type,
      duration: 3500,
    });
  }, []);

  const handleToastClose = useCallback(() => {
    setToast(null);
  }, []);

  /* =======================================================
     FETCH ORGANIZATIONS
  ======================================================= */

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoadingOrganizations(true);

      const response = await getOrganisationList();
      const organizations = extractOrganizations(response);

      setOrganizationOptions(
        mapOrganizationOptions(organizations)
      );
    } catch (error) {
      console.error("Organization fetch failed:", error);

      showToast(
        getApiErrorMessage(
          error,
          "Unable to load Organization list."
        )
      );
    } finally {
      setLoadingOrganizations(false);
    }
  }, [showToast]);

  /* =======================================================
     FETCH ENTITIES
  ======================================================= */

  const fetchEntities = useCallback(async () => {
    try {
      setLoadingEntities(true);

      const response = await getEntityList();
      const entities = extractEntities(response);

      setEntityOptions(
        mapEntityOptions(entities)
      );
    } catch (error) {
      console.error("Entity fetch failed:", error);

      showToast(
        getApiErrorMessage(
          error,
          "Unable to load Entity list."
        )
      );
    } finally {
      setLoadingEntities(false);
    }
  }, [showToast]);

  /* =======================================================
     FETCH COUNTRIES - 8185
  ======================================================= */

  const fetchCountries = useCallback(async () => {
    try {
      setLoadingCountries(true);

      const response = await getCountryList();

      const options = mapCountryDropdownOptions(response);

      setCountryOptions(options);

      // Set India as the default country when available.
      if (!isEdit) {
        setFormData((previous) => {
          if (previous.country) return previous;

          const india = options.find(
            (item) =>
              item.label.trim().toLowerCase() === "india"
          );

          return {
            ...previous,
            country: india?.value || "",
          };
        });
      }
    } catch (error) {
      console.error("Country fetch failed:", error);

      showToast(
        getApiErrorMessage(
          error,
          "Unable to load Country list."
        )
      );
    } finally {
      setLoadingCountries(false);
    }
  }, [isEdit, showToast]);

  /* =======================================================
     FETCH STATES - 8185
  ======================================================= */

  const fetchStates = useCallback(async () => {
    try {
      setLoadingStates(true);

      const response = await getStateList();

      setStateOptions(
        mapStateDropdownOptions(response)
      );
    } catch (error) {
      console.error("State fetch failed:", error);

      showToast(
        getApiErrorMessage(
          error,
          "Unable to load State list."
        )
      );
    } finally {
      setLoadingStates(false);
    }
  }, [showToast]);

  /* =======================================================
     LOAD ALL DROPDOWN DATA
  ======================================================= */

  useEffect(() => {
    fetchOrganizations();
    fetchEntities();
    fetchCountries();
    fetchStates();
  }, [
    fetchOrganizations,
    fetchEntities,
    fetchCountries,
    fetchStates,
  ]);

  /* =======================================================
     SECTION COLLAPSE
  ======================================================= */

  const toggleSection = (sectionName) => {
    setCollapsedSections((previous) => ({
      ...previous,
      [sectionName]: !previous[sectionName],
    }));
  };

  /* =======================================================
     FIELD VALIDATION
  ======================================================= */

  const validateField = (name, value) => {
    const fieldSchema = siteRegistrationSchema.shape[name];

    if (!fieldSchema) return;

    const result = fieldSchema.safeParse(value);

    setErrors((previous) => ({
      ...previous,
      [name]: result.success
        ? ""
        : result.error.issues[0]?.message || "",
    }));
  };

  /* =======================================================
     UPDATE FORM FIELD
  ======================================================= */

  const handleFieldValue = (name, value) => {
    if (!name) return;

    if (["latitude", "longitude", "addressLine1", "city", "state", "country", "postalCode"].includes(name)) {
      cancelLocationRequest();
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    validateField(name, value);
  };

  const handleChange = (eventOrValue, fieldName) => {
    if (
      eventOrValue &&
      typeof eventOrValue === "object" &&
      eventOrValue.target
    ) {
      const target = eventOrValue.target;
      const name = target.name || fieldName;

      const value =
        target.type === "checkbox"
          ? target.checked
          : target.value;

      handleFieldValue(name, value);
      return;
    }

    handleFieldValue(fieldName, eventOrValue);
  };

  const handleSelectChange = (valueOrEvent, fieldName) => {
    if (
      valueOrEvent &&
      typeof valueOrEvent === "object" &&
      valueOrEvent.target
    ) {
      handleChange(valueOrEvent);
      return;
    }

    if (
      valueOrEvent &&
      typeof valueOrEvent === "object" &&
      "value" in valueOrEvent
    ) {
      handleFieldValue(fieldName, valueOrEvent.value);
      return;
    }

    handleFieldValue(fieldName, valueOrEvent ?? "");
  };

  /* =======================================================
     ATTENDANCE TOGGLE
  ======================================================= */

  const handleAttendanceToggle = (event) => {
    const { name, checked } = event.target;

    if (name === "attendanceEnabled" && !checked) {
      setFormData((previous) => ({
        ...previous,
        attendanceEnabled: false,
        automaticCheckIn: false,
        automaticCheckOut: false,
      }));

      setErrors((previous) => ({
        ...previous,
        attendanceEnabled: "",
        automaticCheckIn: "",
        automaticCheckOut: "",
      }));

      return;
    }

    handleFieldValue(name, checked);
  };

  /* =======================================================
     GEOAPIFY LOCATION INTEGRATION
  ======================================================= */

  const cancelLocationRequest = () => {
    locationVersionRef.current += 1;
    reverseGeocodeRef.current?.abort();
    setAddressLoading(false);
    setLocationLoading(false);
    return locationVersionRef.current;
  };

  const updateLocationFields = (fields) => {
    setFormData((previous) => ({ ...previous, ...fields }));
    Object.entries(fields).forEach(([name, value]) => {
      validateField(name, value);
    });
  };

  const applyLocationAddress = (place, coordinates = {}) => {
    const normalize = (value) => String(value || "").trim().toLowerCase();
    const country = countryOptions.find(
      (option) => normalize(option.label) === normalize(place.country)
    );
    const state = stateOptions.find(
      (option) => normalize(option.label) === normalize(place.state)
    );

    updateLocationFields({
      ...coordinates,
      addressLine1: place.address_line1 || place.formatted || "",
      city: place.city || place.town || place.village || place.municipality || "",
      postalCode: place.postcode || "",
      country: country?.value || "",
      state: state?.value || "",
    });

    if (!country || (place.state && !state)) {
      showToast("Please verify the country and state against the master lists.");
    } else {
      showToast("Location and address updated successfully.", "success");
    }
  };

  const handleSearchLocationSelect = (place) => {
    if (place?.lat == null || place?.lon == null ||
        String(place.lat).trim() === "" || String(place.lon).trim() === "") return;

    const lat = Number(place.lat);
    const lng = Number(place.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    cancelLocationRequest();
    applyLocationAddress(place, {
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

  const fetchAddressFromCoordinates = async (latitude, longitude) => {
    const version = cancelLocationRequest();
    const controller = new AbortController();
    reverseGeocodeRef.current = controller;
    setAddressLoading(true);

    try {
      const place = await reverseGeocode(latitude, longitude, controller.signal);
      if (controller.signal.aborted || version !== locationVersionRef.current) return;

      if (place) {
        applyLocationAddress(place);
      } else {
        showToast("Address not found. Please verify the address manually.");
      }
    } catch (error) {
      if (controller.signal.aborted || version !== locationVersionRef.current) return;
      showToast("Coordinates updated. Please verify the address manually.");
    } finally {
      if (version === locationVersionRef.current && !controller.signal.aborted) {
        setAddressLoading(false);
      }
    }
  };

  /* =======================================================
     CURRENT LOCATION
  ======================================================= */

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by this browser.");
      return;
    }

    const version = cancelLocationRequest();
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (version !== locationVersionRef.current) return;
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        updateLocationFields({ latitude, longitude });
        setLocationLoading(false);
        showToast("Current location fetched successfully.", "success");
        fetchAddressFromCoordinates(latitude, longitude);
      },
      (error) => {
        if (version !== locationVersionRef.current) return;
        setLocationLoading(false);
        showToast(error.code === 1
          ? "Please allow location access in your browser."
          : "Unable to fetch your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  /* =======================================================
     MAP LOCATION CHANGE
  ======================================================= */

  const handleMapLocationChange = (latitude, longitude) => {
    updateLocationFields({ latitude, longitude });
    fetchAddressFromCoordinates(latitude, longitude);
  };

  /* =======================================================
     LIST NAVIGATION
  ======================================================= */

  const handleList = () => {
    if (onList) {
      onList();
    } else {
      navigate("/admin/attendance/siteRegistration");
    }
  };

  /* =======================================================
     FORM SUBMIT - CREATE / UPDATE
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || addressLoading || locationLoading) return;

    // Update URL requires encrypted ID.
    if (isEdit && !encryptedId) {
      showToast(
        "Encrypted Site Registration ID is missing. Unable to update this record."
      );
      return;
    }

    const result = siteRegistrationSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = {};

      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0];

        if (fieldName && !fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });

      setErrors(fieldErrors);

      showToast(
        "Please fix the validation errors before saving."
      );
      return;
    }

    if (!formData.organizationId) {
      setErrors((previous) => ({
        ...previous,
        organizationId: "Please select Organization.",
      }));

      showToast("Please select Organization.");
      return;
    }

    if (!formData.entityId) {
      setErrors((previous) => ({
        ...previous,
        entityId: "Please select Entity.",
      }));

      showToast("Please select Entity.");
      return;
    }

    if (!formData.country) {
      setErrors((previous) => ({
        ...previous,
        country: "Please select Country.",
      }));

      showToast("Please select Country.");
      return;
    }

    if (!loggedInUser) {
      showToast(
        "Created By User information is missing. Please check authStore."
      );
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      // Keep the selected country when Zod returns a parsed object.
      // If `country` is not declared in the schema, Zod may omit it
      // from result.data even though it exists in formData.
      const selectedCountryName = String(
        formData.country ?? result.data.country ?? ""
      ).trim();

      const payload = mapSiteRegistrationPayload(
        {
          ...result.data,
          country: selectedCountryName,
          countryName: selectedCountryName,
        },
        {
          organizationId: formData.organizationId,
          entityId: formData.entityId,
          branchId: editingSite?.branchId ?? branchId,
          createdByUser: loggedInUser,
          sourceID: loggedInSourceID,
        }
      );

      // Explicitly set the API country field from the selected dropdown value.
      // This prevents the mapper/schema from sending countryName as null.
      payload.countryName = selectedCountryName;

      // Address Line 2 is not part of this form or payload.
      delete payload.address_line_2;

      if (isEdit) {
        // Numeric ID is retained in the body.
        payload.rdhR0000XXIVID =
          recordId != null ? Number(recordId) : 0;

        // Encrypted ID is retained in the body.
        payload.rdhR0000XXIVID_Encrypted = encryptedId;

        payload.createdDate =
          editingSite?.createdDate || payload.createdDate;

        payload.isDeactivated =
          editingSite?.isDeactivated ?? false;

        console.log("Update Encrypted ID:", encryptedId);
        console.log("Update Request Payload:", payload);

        // IMPORTANT: encrypted ID is passed as URL parameter.
        await updateSiteRegistration(
          encryptedId,
          payload
        );

        showToast(
          "Site registration updated successfully.",
          "success"
        );
      } else {
        console.log("Create Site Registration Payload:", payload);

        await createSiteRegistration(payload);

        showToast(
          "Site registered successfully.",
          "success"
        );
      }
    } catch (error) {
      console.error(
        "Site registration save failed:",
        error.response?.data || error.message
      );

      showToast(
        getApiErrorMessage(
          error,
          isEdit
            ? "Unable to update site registration."
            : "Unable to save site registration."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     REUSABLE FORM INPUT
  ======================================================= */

  const renderInput = (
    label,
    name,
    placeholder,
    options = {}
  ) => (
    <div className="hrms-form-group site-form-group">
      <FormInput
        label={label}
        name={name}
        value={formData[name] ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        error={errors[name]}
        {...options}
      />
    </div>
  );

  /* =======================================================
     REUSABLE FORM SELECT
  ======================================================= */

  const renderSelect = (
    label,
    name,
    options,
    required = false,
    extraProps = {}
  ) => (
    <div className="hrms-form-group site-form-group">
      <FormSelect
        label={label}
        name={name}
        value={formData[name] ?? ""}
        onChange={(value) =>
          handleSelectChange(value, name)
        }
        options={options}
        required={required}
        error={errors[name]}
        {...extraProps}
      />
    </div>
  );

  /* =======================================================
     SECTION HEADER
  ======================================================= */

  const renderSectionHeader = (
    title,
    sectionName,
    action = null
  ) => (
    <div className="site-section-header">
      <div className="site-section-heading">
        <h3>{title}</h3>
      </div>

      <div className="site-section-header-actions">
        {action}

        <FormToggleButton
          isOpen={!collapsedSections[sectionName]}
          onClick={() => toggleSection(sectionName)}
        />
      </div>
    </div>
  );

  /* =======================================================
     ATTENDANCE SWITCH
  ======================================================= */

  const renderAttendanceSwitch = (
    name,
    title,
    description
  ) => (
    <div className="site-attendance-item">
      <label className="site-switch" aria-label={title}>
        <input
          type="checkbox"
          name={name}
          checked={Boolean(formData[name])}
          onChange={handleAttendanceToggle}
          disabled={
            name !== "attendanceEnabled" &&
            !formData.attendanceEnabled
          }
        />

        <span className="site-switch-slider" />
      </label>

      <div className="site-attendance-text">
        <span>{title}</span>
        <small>{description}</small>
      </div>
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleToastClose}
        />
      )}

      <div className="site-registration-page">
        <form
          className="site-registration-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="site-registration-top-grid">
            <div className="site-registration-left">

              {/* BASIC INFORMATION */}

              <section className="hrms-form-section-card site-basic-card">
                {renderSectionHeader(
                  "Basic Information",
                  "basic"
                )}

                {!collapsedSections.basic && (
                  <div className="hrms-form-section-body">
                    <div className="hrms-form-row-3">
                      {renderInput(
                        "Site Code",
                        "siteCode",
                        "Enter Site Code",
                        { required: true }
                      )}

                      {renderInput(
                        "Site Name",
                        "siteName",
                        "Enter Site Name",
                        { required: true }
                      )}

                      {renderSelect(
                        "Site Type",
                        "siteType",
                        siteTypeOptions,
                        true
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ORGANIZATION DETAILS */}

              <section className="hrms-form-section-card site-organization-card">
                {renderSectionHeader(
                  "Organization Details",
                  "organization"
                )}

                {!collapsedSections.organization && (
                  <div className="hrms-form-section-body">
                    <div className="hrms-form-row-3">
                      {renderSelect(
                        "Country",
                        "country",
                        countryOptions,
                        true,
                        {
                          placeholder: loadingCountries
                            ? "Loading Countries..."
                            : "Select Country",
                          disabled: loadingCountries,
                        }
                      )}

                      {renderSelect(
                        "Legal Entity",
                        "organizationId",
                        organizationOptions,
                        true,
                        {
                          placeholder: loadingOrganizations
                            ? "Loading Organizations..."
                            : "Select Legal Entity",
                          disabled: loadingOrganizations,
                        }
                      )}

                      {renderSelect(
                        "Branch",
                        "entityId",
                        entityOptions,
                        true,
                        {
                          placeholder: loadingEntities
                            ? "Loading Entities..."
                            : "Select Branch",
                          disabled: loadingEntities,
                        }
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* ADDRESS INFORMATION */}

              <section className="hrms-form-section-card site-address-card">
                {renderSectionHeader(
                  "Address Information",
                  "address"
                )}

                {!collapsedSections.address && (
                  <div className="hrms-form-section-body">
                    <div className="hrms-form-row-4">
                      {renderInput(
                        "Address Line 1",
                        "addressLine1",
                        "Enter Address",
                        { required: true }
                      )}

                      {renderInput(
                        "City",
                        "city",
                        "Enter City",
                        { required: true }
                      )}

                      {renderSelect(
                        "State / Region",
                        "state",
                        stateOptions,
                        false,
                        {
                          placeholder: loadingStates
                            ? "Loading States..."
                            : "Select State",
                          disabled: loadingStates,
                        }
                      )}

                      {renderInput(
                        "Postal Code",
                        "postalCode",
                        "Enter Postal Code",
                        { maxLength: 10 }
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* GPS LOCATION & GEOFENCING */}

            <section className="hrms-form-section-card site-gps-card">
              {renderSectionHeader(
                "GPS Location & Geofencing",
                "gps",
                <button
                  type="button"
                  className="site-current-location-btn"
                  onClick={handleCurrentLocation}
                  disabled={locationLoading}
                >
                  <FiTarget size={13} />

                  {locationLoading
                    ? "Fetching..."
                    : "Use Current Location"}
                </button>
              )}

              {!collapsedSections.gps && (
                <div className="hrms-form-section-body site-gps-body">
                  <SiteLocationMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    radius={formData.geofenceRadius}
                    siteName={formData.siteName}
                    onLocationChange={handleMapLocationChange}
                    onLocationSelect={handleSearchLocationSelect}
                  />

                  {addressLoading && (
                    <div role="status" style={{ padding: "5px 11px", fontSize: 11 }}>
                      Fetching address information...
                    </div>
                  )}

                  <div className="site-gps-fields">
                    {renderInput(
                      "Latitude",
                      "latitude",
                      "Enter Latitude",
                      { required: true }
                    )}

                    {renderInput(
                      "Longitude",
                      "longitude",
                      "Enter Longitude",
                      { required: true }
                    )}

                    {renderSelect(
                      "Geofence Radius",
                      "geofenceRadius",
                      radiusOptions,
                      true
                    )}
                  </div>

                  <div className="site-geofence-help">
                    Choose the distance within which the site is considered
                    an authorized attendance zone.
                  </div>

                  <div className="site-timezone-field">
                    {renderSelect(
                      "Site Timezone",
                      "timezone",
                      timezoneOptions,
                      true
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ATTENDANCE CONFIGURATION */}

          <section className="hrms-form-section-card site-attendance-card">
            {renderSectionHeader(
              "Attendance Configuration",
              "attendance"
            )}

            {!collapsedSections.attendance && (
              <div className="site-attendance-body">
                {renderAttendanceSwitch(
                  "attendanceEnabled",
                  "Attendance Enabled",
                  "Allow attendance at this site"
                )}

                {renderAttendanceSwitch(
                  "automaticCheckIn",
                  "Automatic Check-In",
                  "Trigger on geofence entry"
                )}

                {renderAttendanceSwitch(
                  "automaticCheckOut",
                  "Automatic Check-Out",
                  "Trigger on geofence exit"
                )}
              </div>
            )}
          </section>

          {/* FOOTER ACTIONS */}

          <div className="hrms-form-footer">
            <FormButton
              type="button"
              variant="secondary"
              onClick={handleList}
              disabled={saving}
            >
              List
            </FormButton>

            <FormButton
              type="submit"
              variant="primary"
              disabled={
                saving ||
                addressLoading ||
                locationLoading ||
                loadingOrganizations ||
                loadingEntities ||
                loadingCountries ||
                loadingStates
              }
            >
              {saving
                ? isEdit
                  ? "Updating..."
                  : "Saving..."
                : isEdit
                  ? "Update Site"
                  : "Save Site"}
            </FormButton>
          </div>
        </form>
      </div>
    </>
  );
};

export default SiteRegistration;
