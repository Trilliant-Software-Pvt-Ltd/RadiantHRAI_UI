import React, { useMemo, useState, useCallback } from "react";
import useAuthStore from "../../../../auth/store/authStore";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiList,
  FiPlus,
  FiFileText,
  FiSearch,
  FiChevronDown,
  FiInfo,
  FiRefreshCw,
  FiSave,
  FiArrowRight,
  FiBriefcase,
  FiX,
} from "react-icons/fi";

// Shared reusable components
import FormInput from "../../../../../src/common/components/Form/FormInput";
import FormSelect from "../../../../../src/common/components/Form/FormSelect";
import FormButton from "../../../../../src/common/components/Form/FormButton";
import FormToggleButton from "../../../../common/components/FormToggleBtn/FormToggleBtn";
import FormToggleSwitch from "../../../../common/components/FormToggleSwitch/FormToggleSwitch";
import Toast from "../../../../common/components/Popups/Toast";

import "./shiftGroup.css";
import { shiftGroupSchema } from "../../validations/shiftGroupSchema";
import { mapCreateShiftGroupPayload } from "../../mapper/ShiftGroupMapper";
import { createShiftGroup } from "../../services/ShiftGroupApi";

/* =========================================================
   INITIAL FORM DATA
========================================================= */

const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const emptyWeek = () => Object.fromEntries(weekDays.map(day => [day, ""]));
const emptyRange = () => ({ fromDate: "", toDate: "", shiftId: "" });
const initialGroup = {
  groupName: "Global Hybrid Team",
  groupCode: "GSH-001",
  description:
    "Flexible shift group for global team with hybrid work model.",
  groupType: "Hybrid Group",
  secondDayShiftApplicable: false,

  selectedShiftIds: [1, 2, 3, 4, 5],

  rotationPattern: "Weekly Rotation",
  weeklyRotation: [emptyWeek()],
  monthlyRotation: {},
  customRotation: [emptyRange()],
  organizationId: "",
  entityId: "",
  applyOn: "All Countries",

  effectiveFrom: localToday(),
  effectiveTo: "2999-12-31",

  selfScheduling: true,
  notifyEmployees: true,

  workMode: "Hybrid",
  locationRule: "All Locations",
  exceptionRule: "No Exceptions",

  assignTo: "All Employees",
  applyFor: "All Sites",
  selectedSites: [],

  publishImmediately: true,
  notifyOnPublish: true,
};

/* =========================================================
   AVAILABLE SHIFTS
========================================================= */

const availableShifts = [
  {
    id: 1,
    name: "Day Shift",
    type: "Regular",
    time: "09:00 AM – 05:30 PM",
    days: "Mon – Fri",
    zone: "IST",
    color: "blue",
  },
  {
    id: 2,
    name: "Evening Shift",
    type: "Regular",
    time: "01:00 PM – 09:30 PM",
    days: "Mon – Fri",
    zone: "IST",
    color: "blue",
  },
  {
    id: 3,
    name: "Night Shift",
    type: "Regular",
    time: "09:00 PM – 05:30 AM",
    days: "Mon – Fri",
    zone: "IST",
    color: "green",
  },
  {
    id: 4,
    name: "Weekend Shift",
    type: "Custom",
    time: "10:00 AM – 06:00 PM",
    days: "Sat – Sun",
    zone: "IST",
    color: "orange",
  },
  {
    id: 5,
    name: "Flexi Shift",
    type: "Flexible",
    time: "08:00 AM – 12:00 PM",
    days: "Mon – Fri",
    zone: "IST",
    color: "teal",
  },
];

/* =========================================================
   DROPDOWN OPTIONS
========================================================= */

const groupTypeOptions = [
  { label: "Hybrid Group", value: "Hybrid Group" },
  { label: "Regular Group", value: "Regular Group" },
  { label: "Rotational Group", value: "Rotational Group" },
  { label: "Flexible Group", value: "Flexible Group" },
];

const countryOptions = [
  { label: "All Countries", value: "All Countries" },
  { label: "India", value: "India" },
  { label: "Selected Countries", value: "Selected Countries" },
];

const workModeOptions = [
  { label: "Hybrid", value: "Hybrid" },
  { label: "Office", value: "Office" },
  { label: "Remote", value: "Remote" },
  { label: "Flexible", value: "Flexible" },
];

const configTabs = ["Schedule Rules", "Work Mode", "Rotation Pattern"];
const rotationTabs = ["Weekly", "Monthly", "Custom"];

const assignTabs = ["Assign to", "Publish Settings"];

const assignOptions = [
  "All Employees",
  "By Organization",
  "By Entity",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ShiftGroup({
  onSaveDraft,
  onCreateGroup,
  onBrowseGroups,
  onCreateShift,
  onBrowseTemplates,
  organizationId,
  entityId,
  organizationOptions = [],
  entityOptions = [],
}) {
  /* =======================================================
     FORM STATE
  ======================================================= */
const navigate = useNavigate();

const handleCreateNewShift = () => {
  navigate("/admin/attendance/shiftcreation/add");
};
  const [form, setForm] = useState(() => ({
    ...initialGroup,
    effectiveFrom: localToday(),
    weeklyRotation: [emptyWeek()],
    monthlyRotation: {},
    customRotation: [emptyRange()],
    organizationId: String(organizationId ?? ""),
    entityId: String(entityId ?? ""),
    selectedShiftIds: [...initialGroup.selectedShiftIds],
    selectedSites: [...initialGroup.selectedSites],
  }));

  const [configTab, setConfigTab] = useState("Schedule Rules");
  const [assignTab, setAssignTab] = useState("Assign to");

  const [shiftSearch, setShiftSearch] = useState("");

  const [detailsOpen, setDetailsOpen] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  /* =======================================================
     UPDATE FORM FIELD
  ======================================================= */

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

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
     SECTION COLLAPSE
  ======================================================= */

  const toggleSection = (sectionName) => {
    setCollapsedSections((previous) => ({
      ...previous,
      [sectionName]: !previous[sectionName],
    }));
  };

  /* =======================================================
     FILTER SHIFTS
  ======================================================= */

  const selectedShifts = availableShifts.filter((shift) =>
    form.selectedShiftIds.includes(shift.id)
  );

  const filteredShifts = useMemo(
    () =>
      availableShifts.filter((shift) =>
        `${shift.name} ${shift.type} ${shift.days}`
          .toLowerCase()
          .includes(shiftSearch.toLowerCase())
      ),
    [shiftSearch]
  );

  const selectedShiftCount = selectedShifts.length;
  const rotationShiftOptions = [{ label: "Select shift", value: "" }, ...selectedShifts.map(shift => ({ label: shift.name, value: String(shift.id) }))];
  const filteredEntityOptions = entityOptions.filter(item => String(item.organizationId) === String(form.organizationId));
  const readValue = value => String(value?.target?.value ?? value?.value ?? value ?? "");
  const updateWeek = (index, day, value) => setForm(current => ({ ...current, weeklyRotation: current.weeklyRotation.map((week, i) => i === index ? { ...week, [day]: readValue(value) } : week) }));
  const updateRange = (index, key, value) => setForm(current => ({ ...current, customRotation: current.customRotation.map((range, i) => i === index ? { ...range, [key]: readValue(value) } : range) }));
  const updateMonth = (month, value) => setForm(current => ({ ...current, monthlyRotation: { ...current.monthlyRotation, [month]: readValue(value) } }));
  const renderRotationSelect = (label, name, value, onChange) => (
    <div className="hrms-form-group sg-field"><FormSelect label={label} name={name} value={rotationShiftOptions.some(option => option.value === value) ? value : ""} options={rotationShiftOptions} onChange={onChange} /></div>
  );


  const allFilteredSelected =
    filteredShifts.length > 0 &&
    filteredShifts.every((shift) =>
      form.selectedShiftIds.includes(shift.id)
    );

  /* =======================================================
     SHIFT SELECTION
  ======================================================= */

  const toggleShift = (id) => {
    setForm((current) => ({
      ...current,
      selectedShiftIds: current.selectedShiftIds.includes(id)
        ? current.selectedShiftIds.filter((item) => item !== id)
        : [...current.selectedShiftIds, id],
    }));
  };

  const handleSelectAllShifts = (checked) => {
    const ids = filteredShifts.map((shift) => shift.id);

    setForm((current) => ({
      ...current,
      selectedShiftIds: checked
        ? Array.from(new Set([...current.selectedShiftIds, ...ids]))
        : current.selectedShiftIds.filter((id) => !ids.includes(id)),
    }));
  };

  /* =======================================================
     RESET FORM
  ======================================================= */

  const handleReset = () => {
    setForm({
      ...initialGroup,
    effectiveFrom: localToday(),
    weeklyRotation: [emptyWeek()],
    monthlyRotation: {},
    customRotation: [emptyRange()],
    organizationId: String(organizationId ?? ""),
    entityId: String(entityId ?? ""),
      selectedShiftIds: [...initialGroup.selectedShiftIds],
      selectedSites: [...initialGroup.selectedSites],
    });

    setConfigTab("Schedule Rules");
    setAssignTab("Assign to");

    setShiftSearch("");
    setDetailsOpen({});
    setCollapsedSections({});

    showToast("Shift group form has been reset.", "success");
  };

  /* =======================================================
     SAVE AS DRAFT
  ======================================================= */

  const handleSaveDraft = async () => {
    if (saving) return;

    setSaving(true);

    try {
      await onSaveDraft?.({
        ...form,
        shifts: selectedShifts,
      });

      showToast("Shift group saved as draft.", "success");
    } catch (error) {
      showToast(error?.message || "Unable to save draft.");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     CREATE SHIFT GROUP
  ======================================================= */

  const handleCreate = async () => {
    if (saving) return;
    if (form.assignTo !== "All Employees" && !form.organizationId) { showToast("Select an organization."); return; }
    if (form.assignTo === "By Entity" && !form.entityId) { showToast("Select an entity."); return; }
    const validShift = id => form.selectedShiftIds.some(selected => String(selected) === String(id));
    const activeIds = form.rotationPattern === "Weekly Rotation" ? form.weeklyRotation.flatMap(Object.values) : form.rotationPattern === "Monthly Rotation" ? Object.values(form.monthlyRotation) : form.customRotation.map(range => range.shiftId);
    if (activeIds.some(id => id && !validShift(id))) { showToast("A rotation contains a shift that is no longer selected."); return; }
    if (form.rotationPattern === "Custom Rotation") {
      const ranges = form.customRotation.filter(range => range.fromDate || range.toDate || range.shiftId);
      if (ranges.some(range => !range.fromDate || !range.toDate || !range.shiftId || range.toDate < range.fromDate)) { showToast("Complete each custom date range with valid dates and a shift."); return; }
      const sorted = [...ranges].sort((a, b) => a.fromDate.localeCompare(b.fromDate));
      if (sorted.some((range, i) => i > 0 && range.fromDate <= sorted[i - 1].toDate)) { showToast("Custom date ranges cannot overlap."); return; }
    }


    const validation = shiftGroupSchema.safeParse(form);
    if (!validation.success) {
      showToast(validation.error.issues[0]?.message || "Please check the form.");
      return;
    }

    // Retain existing UI checks without sending unsupported fields to the API.
    if (!form.selectedShiftIds.length) {
      showToast("Select at least one shift.");
      return;
    }
    if (form.effectiveTo && form.effectiveTo < form.effectiveFrom) {
      showToast("Effective To cannot be earlier than Effective From.");
      return;
    }

   const storedUser = (() => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
})();

const context = {
  employeeName:
    sessionStorage.getItem("employeeName") ||
    storedUser.employeeName ||
    "",

  sourceID:
    sessionStorage.getItem("sourceID") ||
    storedUser.sourceID ||
    "WEB",

  organizationId:
    (form.organizationId || organizationId) ??
    storedUser.rdhR0000IID ??
    storedUser.RDHR0000IID,

  entityId:
    (form.entityId || (form.organizationId && String(form.organizationId) !== String(organizationId ?? storedUser.rdhR0000IID ?? storedUser.RDHR0000IID) ? "" : entityId)) ??
    storedUser.rdhR0000IIID ??
    storedUser.RDHR0000IIID,
};

    // Prevent accidentally creating a group under placeholder organization/entity IDs.
    if (!Number.isInteger(Number(context.organizationId)) || Number(context.organizationId) <= 0 ||
        !Number.isInteger(Number(context.entityId)) || Number(context.entityId) <= 0) {
      showToast("Organization ID and Entity ID are required. Pass them from the logged-in context.");
      return;
    }

    const payload = mapCreateShiftGroupPayload(validation.data, context);
    setSaving(true);
    try {
      const result = await createShiftGroup(payload);
      showToast("Shift group created successfully.", "success");
      onCreateGroup?.(result);
    } catch (error) {
      showToast(
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Unable to create shift group."
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
    <div className="hrms-form-group sg-field">
      <FormInput
        label={label}
        name={name}
        value={form[name] ?? ""}
        onChange={(event) => {
          const value = event?.target
            ? event.target.value
            : event;

          update(
            name,
            name === "groupCode"
              ? String(value ?? "").toUpperCase()
              : value
          );
        }}
        placeholder={placeholder}
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
    extraProps = {}
  ) => (
    <div className="hrms-form-group sg-field">
      <FormSelect
        label={label}
        name={name}
        value={form[name] ?? ""}
        onChange={(value) => {
          const selectedValue =
            value?.target?.value ??
            value?.value ??
            value ??
            "";

          update(name, selectedValue);
        }}
        options={options}
        {...extraProps}
      />
    </div>
  );

  /* =======================================================
     REUSABLE SECTION HEADER
  ======================================================= */

  const renderSectionHeader = (
    title,
    sectionName,
    action = null
  ) => (
    <div className="sg-section-header site-section-header">
      <div className="sg-section-title site-section-heading">
        {/* <span className="sg-section-number site-section-number">
          {number}
        </span> */}

        <h2>{title}</h2>
      </div>

      <div className="sg-header-actions">
        {action}

        <FormToggleButton
          isOpen={!collapsedSections[sectionName]}
          onClick={() => toggleSection(sectionName)}
        />
      </div>
    </div>
  );

  /* =======================================================
     REUSABLE TOGGLE SWITCH
  ======================================================= */

  const renderToggle = (name, label, description = "") => (
    <div className="sg-inline-toggle" key={name}>
      <div className="sg-toggle-text">
        <span>{label}</span>

        {description && <small>{description}</small>}
      </div>

      <FormToggleSwitch
        checked={Boolean(form[name])}
        onChange={(checked) => update(name, checked)}
        label={label}
      />
    </div>
  );

  /* =======================================================
     REUSABLE RADIO OPTION
  ======================================================= */

  const renderRadioOption = (value, fieldName, label) => (
    <label className="sg-radio-option" key={`${fieldName}-${value}`}>
      <input
        type="radio"
        name={fieldName}
        value={value}
        checked={form[fieldName] === value}
        onChange={() => update(fieldName, value)}
      />

      <span>{label || value}</span>
    </label>
  );

  /* =======================================================
     REUSABLE INFO STRIP
  ======================================================= */

  const renderInfoStrip = (children) => (
    <div className="sg-info-strip">
      <FiInfo />
      <span>{children}</span>
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

      <div className="shift-group-page">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="sg-page-heading">
          <div className="sg-heading-left">
            <span className="sg-heading-icon">
              <FiUsers />
            </span>

            <div>
              <h1>Create Shift Group</h1>

              <p>
                Combine multiple shifts into a group for
                flexible work schedules.
              </p>
            </div>
          </div>

     
        </div>

        {/* =================================================
            1. BASIC DETAILS
        ================================================= */}

        <section className="sg-card sg-basic-card hrms-form-section-card">

          {renderSectionHeader(
            "Basic Details",
            "basic"
          )}

          {!collapsedSections.basic && (
            <div className="sg-basic-grid hrms-form-section-body">

              {renderInput(
                "Group Name",
                "groupName",
                "Enter group name",
                { required: true }
              )}

              {renderInput(
                "Group Code",
                "groupCode",
                "Enter group code",
                { required: true }
              )}

              <div className="hrms-form-group sg-field sg-description-field">
                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    update("description", event.target.value)
                  }
                  placeholder="Enter group description"
                />

                <small>
                  {form.description.length}/500
                </small>
              </div>

              {renderSelect(
                "Group Type",
                "groupType",
                groupTypeOptions,
                {
                  required: true,
                }
              )}

            </div>
          )}
        </section>

        {/* =================================================
            MIDDLE GRID
        ================================================= */}

        <div className="sg-middle-grid">

          {/* ===============================================
              2. SELECT SHIFTS
          =============================================== */}

          <section className="sg-card sg-shifts-card hrms-form-section-card">

            {renderSectionHeader(
              `Select Shifts (${selectedShiftCount})`,
              "shifts",
              <div className="sg-header-actions">

            <FormButton
  type="button"
  variant="secondary"
  onClick={handleCreateNewShift}
>
  <FiPlus />
  Create New Shift
</FormButton>


              </div>
            )}

            {!collapsedSections.shifts && (
              <div className="sg-shifts-content hrms-form-section-body">

                {/* TOOLBAR */}

                <div className="sg-shift-toolbar">

                  <div className="sg-shift-tabs">
                    <button
                      type="button"
                      className="active"
                    >
                      Available Shifts ({availableShifts.length})
                    </button>
                  </div>

                  <div className="sg-search-box">
                    <FiSearch />

                    <input
                      type="text"
                      value={shiftSearch}
                      onChange={(event) =>
                        setShiftSearch(event.target.value)
                      }
                      placeholder="Search shifts..."
                    />

                    {shiftSearch && (
                      <button
                        type="button"
                        onClick={() => setShiftSearch("")}
                        aria-label="Clear search"
                      >
                        <FiX />
                      </button>
                    )}
                  </div>

                </div>

                {/* SHIFT TABLE */}

                <div className="sg-table-wrap">
                  <table className="sg-shift-table">

                    <thead>
                      <tr>
                        <th className="sg-check-col">
                          <input
                            type="checkbox"
                            aria-label="Select all shifts"
                            checked={allFilteredSelected}
                            onChange={(event) =>
                              handleSelectAllShifts(
                                event.target.checked
                              )
                            }
                          />
                        </th>

                        <th>Shift Name</th>
                        <th>Type</th>
                        <th>Time</th>
                        <th>Work Days</th>
                        <th>Time Zone</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredShifts.map((shift) => (
                        <React.Fragment key={shift.id}>

                          <tr>
                            <td>
                              <input
                                type="checkbox"
                                checked={form.selectedShiftIds.includes(
                                  shift.id
                                )}
                                onChange={() =>
                                  toggleShift(shift.id)
                                }
                                aria-label={`Select ${shift.name}`}
                              />
                            </td>

                            <td className="sg-shift-name">
                              {shift.name}
                            </td>

                            <td>
                              <span
                                className={`sg-type-pill ${shift.color}`}
                              >
                                {shift.type}
                              </span>
                            </td>

                            <td>{shift.time}</td>
                            <td>{shift.days}</td>
                            <td>{shift.zone}</td>

                            <td>
                              <button
                                type="button"
                                className="sg-view-btn"
                                onClick={() =>
                                  setDetailsOpen((current) => ({
                                    ...current,
                                    [shift.id]: !current[shift.id],
                                  }))
                                }
                              >
                                View Details

                                <FiChevronDown
                                  className={
                                    detailsOpen[shift.id]
                                      ? "rotated"
                                      : ""
                                  }
                                />
                              </button>
                            </td>
                          </tr>

                          {detailsOpen[shift.id] && (
                            <tr className="sg-detail-row">
                              <td />

                              <td colSpan="6">
                                <div>
                                  <strong>{shift.name}</strong>
                                  {" · "}
                                  {shift.type} schedule
                                  {" · "}
                                  {shift.days}
                                  {" · "}
                                  {shift.time}
                                  {" ("}
                                  {shift.zone}
                                  {")"}
                                </div>
                              </td>
                            </tr>
                          )}

                        </React.Fragment>
                      ))}

                      {!filteredShifts.length && (
                        <tr>
                          <td colSpan="7" className="sg-empty">
                            No shifts match your search.
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </section>

          {/* ===============================================
              3. GROUP PREVIEW
          =============================================== */}

          <section className="sg-card sg-preview-card hrms-form-section-card">

            {renderSectionHeader(
              "Group Preview",
              "preview"
            )}

            {!collapsedSections.preview && (
              <div className="sg-preview-content hrms-form-section-body">

                <div className="sg-preview-banner">

                  <span className="sg-preview-avatar">
                    <FiUsers />
                  </span>

                  <div>
                    <strong>
                      {form.groupName || "Shift Group Name"}
                    </strong>

                    <span>
                      {form.groupType} · {selectedShiftCount} Shifts
                    </span>
                  </div>

                </div>

                <h3>Included Shifts</h3>

                <ul className="sg-included-list">

                  {selectedShifts.map((shift) => (
                    <li key={shift.id}>

                      <span
                        className={`sg-dot ${shift.color}`}
                      />

                      <span className="sg-included-name">
                        {shift.name}
                      </span>

                      <small>
                        ({shift.days})
                      </small>

                    </li>
                  ))}

                  {!selectedShiftCount && (
                    <li className="sg-no-shifts">
                      No shifts selected
                    </li>
                  )}

                </ul>

              </div>
            )}

          </section>

        </div>

        {/* =================================================
            BOTTOM GRID
        ================================================= */}

        <div className="sg-bottom-grid">

          {/* ===============================================
              4. GROUP CONFIGURATION
          =============================================== */}

          <section className="sg-card sg-config-card hrms-form-section-card">

            {renderSectionHeader(
              "Group Configuration",
              "configuration"
            )}

            {!collapsedSections.configuration && (
              <>
                <div className="sg-tabs" role="tablist">

                  {configTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={configTab === tab}
                      className={
                        configTab === tab ? "active" : ""
                      }
                      onClick={() => setConfigTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}

                </div>

                <div className="sg-config-content hrms-form-section-body">

                  {/* SCHEDULE RULES */}

                  {configTab === "Schedule Rules" && (
                    <div className="sg-config-grid">

                      {renderSelect(
                        "Apply on",
                        "applyOn",
                        countryOptions
                      )}

                      {renderInput(
                        "Effective From",
                        "effectiveFrom",
                        "Select start date",
                        {
                          type: "date",
                          required: true,
                        }
                      )}

                      {renderInput(
                        "Effective To",
                        "effectiveTo",
                        "Select end date",
                        {
                          type: "date",
                          required: true,
                        }
                      )}

                      {renderToggle(
                        "notifyEmployees",
                        "Notify Employees"
                      )}

                    </div>
                  )}

                  {/* WORK MODE */}

                  {configTab === "Work Mode" && (
                    <div className="sg-config-grid sg-workmode-panel">

                      {renderSelect(
                        "Work Mode",
                        "workMode",
                        workModeOptions
                      )}

                      <div className="sg-config-note">
                        <FiBriefcase />

                        <span>
                          This group uses the{" "}
                          {form.workMode.toLowerCase()} work mode
                          for its assigned shifts.
                        </span>
                      </div>

                    </div>
                  )}

                  {configTab === "Rotation Pattern" && (
                    <div className="sg-rotation-panel">
                      <div className="sg-tabs" role="tablist">
                        {rotationTabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={form.rotationPattern === `${tab} Rotation`} className={form.rotationPattern === `${tab} Rotation` ? "active" : ""} onClick={() => update("rotationPattern", `${tab} Rotation`)}>{tab}</button>)}
                      </div>
                      {form.rotationPattern === "Weekly Rotation" && <>
                        <div className="sg-rotation-toolbar"><span>{form.weeklyRotation.length} / 5 weeks</span><FormButton type="button" variant="secondary" disabled={form.weeklyRotation.length >= 5} onClick={() => setForm(current => current.weeklyRotation.length >= 5 ? current : { ...current, weeklyRotation: [...current.weeklyRotation, emptyWeek()] })}><FiPlus /> Add Week</FormButton></div>
                        {form.weeklyRotation.map((week, index) => <div className="sg-rotation-block" key={index}>
                          <div className="sg-rotation-toolbar"><strong>Week {index + 1}</strong>{index > 0 && <button type="button" className="sg-rotation-remove" onClick={() => setForm(current => ({ ...current, weeklyRotation: current.weeklyRotation.filter((_, i) => i !== index) }))}>Remove</button>}</div>
                          <div className="sg-week-scroll"><div className="sg-week-grid">{weekDays.map(day => <React.Fragment key={day}>{renderRotationSelect(day, `week-${index}-${day}`, week[day], value => updateWeek(index, day, value))}</React.Fragment>)}</div></div>
                        </div>)}
                      </>}
                      {form.rotationPattern === "Monthly Rotation" && <div className="sg-month-grid">{months.map(month => <React.Fragment key={month}>{renderRotationSelect(month, `month-${month}`, form.monthlyRotation[month] ?? "", value => updateMonth(month, value))}</React.Fragment>)}</div>}
                      {form.rotationPattern === "Custom Rotation" && <>
                        <div className="sg-rotation-toolbar"><strong>Custom Date Ranges</strong><FormButton type="button" variant="secondary" onClick={() => setForm(current => ({ ...current, customRotation: [...current.customRotation, emptyRange()] }))}><FiPlus /> Add Range</FormButton></div>
                        {form.customRotation.map((range, index) => <div className="sg-rotation-block" key={index}>
                          <div className="sg-rotation-toolbar"><strong>Range {index + 1}</strong>{index > 0 && <button type="button" className="sg-rotation-remove" onClick={() => setForm(current => ({ ...current, customRotation: current.customRotation.filter((_, i) => i !== index) }))}>Remove</button>}</div>
                          <div className="sg-custom-grid">
                            <FormInput label="From Date" name={`from-${index}`} type="date" value={range.fromDate} onChange={value => updateRange(index, "fromDate", value)} />
                            <FormInput label="To Date" name={`to-${index}`} type="date" min={range.fromDate} value={range.toDate} onChange={value => updateRange(index, "toDate", value)} />
                            {renderRotationSelect("Shift", `custom-${index}`, range.shiftId, value => updateRange(index, "shiftId", value))}
                          </div>
                        </div>)}
                      </>}
                    </div>
                  )}

                </div>
              </>
            )}

          </section>

          {/* ===============================================
              5. ASSIGN & PUBLISH
          =============================================== */}

          <section className="sg-card sg-assign-card hrms-form-section-card">

            {renderSectionHeader(
              "Assign & Publish",
              "assign"
            )}

            {!collapsedSections.assign && (
              <>
                <div className="sg-tabs" role="tablist">

                  {assignTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      role="tab"
                      aria-selected={assignTab === tab}
                      className={
                        assignTab === tab ? "active" : ""
                      }
                      onClick={() => setAssignTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}

                </div>

                {/* ASSIGN TO */}

                {assignTab === "Assign to" ? (
                  <div className="sg-assign-content hrms-form-section-body">

                    <div className="sg-custom-grid sg-assignment-grid">
                      {renderSelect("Organization", "organizationId", organizationOptions, { onChange: value => setForm(current => ({ ...current, organizationId: readValue(value), entityId: "" })) })}
                      {renderSelect("Entity", "entityId", filteredEntityOptions, { disabled: !form.organizationId, onChange: value => update("entityId", readValue(value)) })}
                    </div>
                    <div className="sg-choice-block">
                      <span className="sg-choice-label">Apply To</span>
                      <div className="sg-radio-row">{assignOptions.map(option => renderRadioOption(option, "assignTo"))}</div>
                    </div>
                    {renderInfoStrip(form.assignTo === "All Employees" ? "Apply to all eligible employees." : form.assignTo === "By Organization" ? "Apply to employees of the selected organization." : "Apply to employees of the selected entity.")}

                  </div>
                ) : (

                  /* PUBLISH SETTINGS */

                  <div className="sg-assign-content sg-publish-content hrms-form-section-body">

                    {renderToggle(
                      "publishImmediately",
                      "Publish immediately after creation"
                    )}

                    {renderToggle(
                      "notifyOnPublish",
                      "Send notification to assigned employees"
                    )}

                    {renderInfoStrip(
                      form.publishImmediately
                        ? "The group will be active after creation."
                        : "The group will be saved in draft status."
                    )}

                  </div>

                )}

              </>
            )}

          </section>

        </div>

        {/* =================================================
            FOOTER ACTIONS
        ================================================= */}

        <div className="sg-footer hrms-form-footer">
{/* 
          <FormButton
            type="button"
            variant="secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <FiRefreshCw />
            Reset
          </FormButton> */}

          <div className="sg-footer-actions">

            {/* <FormButton
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <FiSave />
              {saving ? "Please wait..." : "Save as Draft"}
            </FormButton> */}

            <FormButton
              type="button"
              variant="primary"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? "Creating..." : "Create Shift Group"}
              <FiArrowRight />
            </FormButton>

          </div>

        </div>

      </div>
    </>
  );
}