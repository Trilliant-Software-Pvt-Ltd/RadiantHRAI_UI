import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../../../../auth/store/authStore";
import { createShiftCreation, updateShiftCreation, coffPrefixes, getAllAssigned, getOrganisationList, getEntityList, getCountryList, extractArray, mapOptions, mapShiftPayload, getApiErrorMessage, durationMinutes, lunchEnd } from "../../services/ShiftCreationApi";
import { shiftCreationSchema } from "../../validations/shiftCreationSchema";
import remote_job from "../../../../assets/remote_job.jpg";
import PageLoader from "../../../../common/components/Loader/PageLoader";
import { FiCalendar, FiClock, FiInfo, FiSettings, FiBriefcase, FiArrowRight, FiCheck, FiCoffee, FiEye, FiGlobe, FiHome, FiMapPin, FiMonitor, FiMoreVertical, FiRefreshCw, FiSave, FiSearch, FiX, FiMinus, FiPlus, FiAward, FiLogOut, FiCheckCircle, FiList } from "react-icons/fi";

import FormInput from "../../../../../src/common/components/Form/FormInput";
import FormSelect from "../../../../../src/common/components/Form/FormSelect";
import FormButton from "../../../../../src/common/components/Form/FormButton";
import FormCheckbox from "../../../../../src/common/components/Form/FormCheckbox";
import FormToggleSwitch from "../../../../common/components/FormToggleSwitch/FormToggleSwitch";

import Toast from "../../../../common/components/Popups/Toast";
import "./shiftCreation.css";

/* =========================================================
   INITIAL SHIFT DATA
========================================================= */

const initialShift = {
  shiftName: "",
  shiftCode: "",
  workMode: "",
  shiftType: "",
  timeZone: "Asia/Kolkata",

  startTime: "",
  endTime: "",

  breakDuration: "0 min",

  lunchBreak: false,
  lunchStart: "",
  

  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],

  otSchedule: {
    calculationDuration: "",
    minimumOT: "",
    maximumOT: "",
    allowance: "",
  },

  organizationId: "",
  entityId: "",
  countryId: "",
  applicableToAllCountries: false,

  notifications: false,
  notifyBefore: "15 minutes",
  notifyOnChange: false,

  coffSchedule: {
    regularDay: [
      { day: "0.5", enabled: false, from: "0", to: "0" },
      { day: "1", enabled: false, from: "0", to: "0" },
      { day: "1.5", enabled: false, from: "0", to: "0" },
      { day: "2", enabled: false, from: "0", to: "0" },
    ],

    woPh: [
      { day: "0.5", enabled: false, from: "0", to: "0" },
      { day: "1", enabled: false, from: "0", to: "0" },
      { day: "1.5", enabled: false, from: "0", to: "0" },
      { day: "2", enabled: false, from: "0", to: "0" },
      { day: "2.5", enabled: false, from: "0", to: "0" },
      { day: "3", enabled: false, from: "0", to: "0" },
    ],
  },

  customSchedule: {
    lateMarkGraceTime: 0,
    earlyExitGraceTime: 0,
    minimumWorkingHours: 0,
    maximumWorkingHours: 0,
    lateMark: false,
    earlyExit: false,
    runawayStartTime: "",
    runAwayEndTime: "",
  },
};

/* =========================================================
   EMPLOYEE DATA
========================================================= */

/* =========================================================
   STATIC OPTIONS
========================================================= */

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];




const workModeOptions = [
  { label: "Hybrid", value: "Hybrid" },
  { label: "Office", value: "Office" },
  { label: "Remote", value: "Remote" },
];

const shiftTypeOptions = [
  { label: "Flexible Shift", value: "Flexible Shift" },
  { label: "Fixed Shift", value: "Fixed Shift" },
  { label: "Rotational Shift", value: "Rotational Shift" },
  { label: "Night Shift", value: "Night Shift" },
];

const timezoneOptions = [
  {
    label: "(UTC+05:30) India Standard Time",
    value: "Asia/Kolkata",
  },
  {
    label: "(UTC+04:00) Gulf Standard Time",
    value: "Asia/Dubai",
  },
  {
    label: "(UTC+00:00) Greenwich Mean Time",
    value: "Europe/London",
  },
  {
    label: "(UTC-05:00) Eastern Time",
    value: "America/New_York",
  },
];

const breakOptions = [
  { label: "0 min", value: "0 min" },
  { label: "15 min", value: "15 min" },
  { label: "30 min", value: "30 min" },
  { label: "45 min", value: "45 min" },
  { label: "60 min", value: "60 min" },
];



/* =========================================================
   REUSABLE FORM FIELD
========================================================= */

function Field({
  label,
  required = false,
  children,
  className = "",
}) {
  return (
    <div className={`hrms-form-group sc-field ${className}`}>
      {label && (
        <label className="hrms-form-label sc-field-label">
          {label}
          {required && <i className="hrms-required"> *</i>}
        </label>
      )}

      {children}
    </div>
  );
}

/* =========================================================
   REUSABLE SECTION HEADER
========================================================= */

function SectionHeader({ title, action }) {
  return (
    <div className="sc-section-header">
      <div className="sc-section-title">
        <h2>{title}</h2>
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   REUSABLE SCHEDULE HEADER
========================================================= */

function ScheduleHeader({
  title,
  description,
  icon: Icon = FiCalendar,
  info = "These settings will apply to all employees",
}) {
  return (
    <div className="sc-schedule-header">
      <div className="sc-schedule-header-left">
        <div className="sc-schedule-header-icon" aria-hidden="true">
          <Icon />
        </div>
        <div className="sc-schedule-header-divider" aria-hidden="true" />
        <div className="sc-schedule-header-text">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>
      {info && (
        <div className="sc-schedule-header-info">
          <FiInfo aria-hidden="true" />
          <span>{info}</span>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   REUSABLE HRMS INPUT
========================================================= */

function ShiftInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  className = "",
  ...props
}) {
  return (
    <Field label={label} required={required} className={className}>
      <FormInput
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`sc-input-control ${props.className || ""}`}
        {...props}
      />
    </Field>
  );
}

/* =========================================================
   REUSABLE HRMS SELECT
========================================================= */

function ShiftSelect({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  className = "",
  placeholder = "Select",
  disabled = false,
}) {
  return (
    <Field label={label} required={required} className={className}>
      <div className="sc-select-control">
        <FormSelect
          name={name}
          value={value}
          onChange={(selected) => {
            const nextValue = selected?.target
              ? selected.target.value
              : selected?.value !== undefined
                ? selected.value
                : selected;

            onChange(nextValue ?? "");
          }}
          options={options}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
        />
      </div>
    </Field>
  );
}

/* =========================================================
   CUSTOM SCHEDULE NUMBER STEPPER
========================================================= */

function CustomCardHeader({ label, description, icon: Icon, tone }) {
  return (
    <div className="sc-custom-card-header">
      <span className={`sc-custom-icon ${tone}`} aria-hidden="true">
        <Icon />
      </span>
      <div className="sc-custom-card-text">
        <h4>{label}</h4>
        <p>{description}</p>
      </div>
    </div>
  );
}

function AttendanceRulesIllustration() {
  return (
    <svg viewBox="0 0 240 180" width="100%" height="100%"
      aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="120" cy="158" rx="110" ry="11" fill="#d8e3fa" />
      <path d="M30 145 Q16 87 53 58 Q110 12 176 57 Q222 90 214 145Z" fill="#e3ebfc" />
      <rect x="49" y="36" width="120" height="117" rx="10" fill="#7697d3" />
      <rect x="56" y="42" width="116" height="111" rx="8" fill="#fff" />
      <path d="M56 50Q56 42 64 42H164Q172 42 172 50V65H56Z" fill="#4778c8" />
      {[75, 100, 125, 150].map((x) => (
        <rect key={x} x={x} y="28" width="7" height="23" rx="3.5" fill="#315b9c" />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={66 + (i % 4) * 25} y={75 + Math.floor(i / 4) * 24}
          width="15" height="15" rx="3" fill={i === 5 ? '#83a5e5' : '#dbe6fa'} />
      ))}
      <path d="M37 139Q16 108 18 78Q41 90 42 132Q48 102 68 100Q63 124 43 141" fill="#58b18d" />
      <path d="M39 139L30 106M42 137L57 113" stroke="#31866c" strokeWidth="2" fill="none" />
      <path d="M23 137H53L49 159H27Z" fill="#7599d8" />
      <circle cx="167" cy="120" r="46" fill="#315d9f" />
      <circle cx="167" cy="120" r="38" fill="#fff" stroke="#a5bce8" strokeWidth="3" />
      {[0, 90, 180, 270].map((angle) => (
        <path key={angle} d="M167 86V92" stroke="#8ea6d0" strokeWidth="3"
          strokeLinecap="round" transform={`rotate(${angle} 167 120)`} />
      ))}
      <path d="M167 102V120L182 109" fill="none" stroke="#263e70" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="167" cy="120" r="4" fill="#263e70" />
      <path d="M193 65L198 53M207 75L218 69" stroke="#4778c8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function NumberStepper({
  label,
  description,
  icon,
  tone,
  name,
  value,
  onChange,
  unit,
  min = 0,
  max = 24,
}) {
  const handleStep = (amount) => {
    const nextValue = Number(value) + amount;

    if (nextValue < min || nextValue > max) return;

    onChange(nextValue);
  };

  const handleInputChange = (input) => {
    const nextValue = input?.target
      ? input.target.value
      : input;

    if (nextValue === "") return;

    const number = Number(nextValue);

    if (!Number.isFinite(number)) return;

    onChange(Math.min(max, Math.max(min, number)));
  };

  return (
    <Field className="sc-custom-field">
      <CustomCardHeader label={label} description={description} icon={icon} tone={tone} />
      <div className="sc-number-stepper">
        <button
          type="button"
          className="sc-stepper-btn"
          disabled={Number(value) <= min}
          onClick={() => handleStep(-1)}
          aria-label={`Decrease ${label}`}
        >
          <FiMinus />
        </button>

        <div className="sc-stepper-value">
          <FormInput
            name={name}
            aria-label={label}
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={handleInputChange}
            className="sc-stepper-input sc-input-control"
          />

          <span>{unit}</span>
        </div>

        <button
          type="button"
          className="sc-stepper-btn"
          disabled={Number(value) >= max}
          onClick={() => handleStep(1)}
          aria-label={`Increase ${label}`}
        >
          <FiPlus />
        </button>
      </div>
    </Field>
  );
}

/* =========================================================
   CUSTOM SCHEDULE SECTION
========================================================= */

function CustomScheduleSection({ data, onChange }) {
  return (
    <div className="sc-custom-schedule">
      <aside className="sc-custom-info-panel">
        <div className="sc-custom-info-image">
          <AttendanceRulesIllustration />
        </div>
        <h3>Manage Your<br />Attendance Rules</h3>
        <p>Set grace time and working hour limits to ensure accurate attendance tracking.</p>
        <div className="sc-custom-info-footer">
          <FiCheckCircle aria-hidden="true" />
          <span>Keep your schedule fair and flexible.</span>
        </div>
      </aside>
      <div className="sc-custom-column">
        <div className="sc-custom-toggle-field">
          <CustomCardHeader
            label="Late Mark"
            description="Enable late mark for this schedule."
            icon={FiAward}
            tone="late-mark"
          />

          <div className="sc-custom-toggle-control">
            <FormToggleSwitch
              checked={data.lateMark}
              onChange={(value) => onChange("lateMark", value)}
              label="Enable late mark"
            />
          </div>
        </div>

        {data.lateMark && (
          <NumberStepper
            label="Grace Time for Late Mark"
            description="Allow a buffer before marking late."
            icon={FiClock}
            tone="grace-time"
            name="lateMarkGraceTime"
            value={data.lateMarkGraceTime ?? 0}
            unit="min"
            min={0}
            max={120}
            onChange={(value) => onChange("lateMarkGraceTime", value)}
          />
        )}

        <div className="sc-custom-toggle-field">
          <CustomCardHeader
            label="Early Exit"
            description="Allow early exit for this schedule."
            icon={FiLogOut}
            tone="early-exit"
          />

          <div className="sc-custom-toggle-control">
            <FormToggleSwitch
              checked={data.earlyExit}
              onChange={(value) => onChange("earlyExit", value)}
              label="Enable early exit"
            />
          </div>
        </div>

        {data.earlyExit && (
          <NumberStepper
            label="Grace Time for Early Exit"
            description="Allow a buffer before the scheduled end time."
            icon={FiClock}
            tone="grace-time"
            name="earlyExitGraceTime"
            value={data.earlyExitGraceTime ?? 0}
            unit="min"
            min={0}
            max={120}
            onChange={(value) => onChange("earlyExitGraceTime", value)}
          />
        )}
      </div>

      <div className="sc-custom-column">
        <NumberStepper
          label="Minimum Working Hours"
          description="Set duration for marking attendance."
          icon={FiBriefcase}
          tone="minimum-hours"
          name="minimumWorkingHours"
          value={data.minimumWorkingHours}
          unit="hrs"
          min={0}
          max={24}
          onChange={(value) => onChange("minimumWorkingHours", value)}
        />

        <NumberStepper
          label="Maximum Work Hours"
          description="Set duration for marking attendance."
          icon={FiClock}
          tone="maximum-hours"
          name="maximumWorkingHours"
          value={data.maximumWorkingHours}
          unit="hrs"
          min={0}
          max={24}
          onChange={(value) => onChange("maximumWorkingHours", value)}
        />
     {/* RUNAWAY SCHEDULE CARD */}

<div className="sc-custom-field sc-runaway-card">

  <CustomCardHeader
    label="Runaway Schedule"
    description="Configure runaway time and duration."
    icon={FiClock}
    tone="runaway-time"
  />

  {/* TIME INPUTS */}

  <div className="sc-runaway-time-grid">

    <ShiftInput
      label="Start Time"
      name="runawayStartTime"
      type="time"
      value={data.runawayStartTime}
      onChange={(value) =>
        onChange(
          "runawayStartTime",
          value?.target?.value ?? value
        )
      }
    />

    <ShiftInput
      label="End Time"
      name="runAwayEndTime"
      type="time"
      value={data.runAwayEndTime}
      onChange={(value) =>
        onChange(
          "runAwayEndTime",
          value?.target?.value ?? value
        )
      }
    />

  </div>

  {/* AUTOMATIC DURATION SUMMARY */}

  <div className="sc-runaway-duration">

    <div className="sc-runaway-duration-info">

      <FiClock />

      <div>
        <span>Runaway Duration</span>
        <small>Automatically calculated</small>
      </div>

    </div>

    <div className="sc-runaway-duration-value">
      <strong>
        {durationMinutes(
          data.runawayStartTime,
          data.runAwayEndTime
        ) ?? 0}
      </strong>

      <span>min</span>
    </div>

  </div>

</div>
      </div>
    </div>
  );
}

/* =========================================================
   OT SCHEDULE SECTION
========================================================= */

function OTScheduleSection({ data, onChange }) {
  const fields = [
    { name: "calculationDuration", label: "Calculation Duration" },
    { name: "minimumOT", label: "Minimum OT" },
    { name: "maximumOT", label: "Maximum OT" },
    { name: "allowance", label: "Allowance" },
  ];

  return (
    <div className="sc-ot-schedule-wrapper">
      <div className="hrms-form-row-3 sc-ot-fields-grid">
        {fields.map(({ name, label }) => (
          <ShiftInput
            key={name}
            label={label}
            name={name}
            type="number"
            min={0}
            step="any"
            value={data[name]}
            placeholder={`Enter ${label.toLowerCase()}`}
            onChange={(value) =>
              onChange(
                name,
                value?.target ? value.target.value : value
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   COFF SCHEDULE SECTION
========================================================= */

function CoffScheduleSection({
  title,
  rows,
  onChange,
  icon: Icon,
}) {
  return (
    <div className="sc-coff-section">
      <div className="sc-coff-table">
        <div className="sc-coff-table-header"
          style={{ background: title === "Regular Day" ? "#eef5ef" : "#f1edf9", color: "#20365f" }}>
          <span className="sc-coff-table-title" style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "6px", fontWeight: 700, paddingLeft: "7px" }}>
            <Icon style={{ color: title === "Regular Day" ? "#36865c" : "#7953b5" }} />
            {title}
          </span>

          <span>
            <FiClock />
            Min
          </span>

          <span>
            <FiClock />
            Max
          </span>
        </div>

        <div className="sc-coff-table-body">
          {rows.map((row, index) => (
            <div className="sc-coff-row" key={`${title}-${row.day}`}>
              <div className="sc-coff-day">
                <FormCheckbox
                  name={`${title}-${row.day}-enabled`}
                  label={`For ${row.day} Day`}
                  checked={Boolean(row.enabled)}
                  onChange={(event) =>
                    onChange(index, "enabled", event.target.checked)
                  }
                />
              </div>

              <div className="sc-coff-input-wrapper">
                <FormInput
                  name={`${title}-${row.day}-from`}
                  type="number"
                  value={row.from}
                  disabled={!row.enabled}
                  placeholder="0"
                  className="sc-coff-input sc-input-control"
                  onChange={(value) =>
                    onChange(
                      index,
                      "from",
                      value?.target ? value.target.value : value
                    )
                  }
                />
              </div>

              <div className="sc-coff-input-wrapper">
                <FormInput
                  name={`${title}-${row.day}-to`}
                  type="number"
                  value={row.to}
                  disabled={!row.enabled}
                  placeholder="0"
                  className="sc-coff-input sc-input-control"
                  onChange={(value) =>
                    onChange(
                      index,
                      "to",
                      value?.target ? value.target.value : value
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

const freshForm = () => JSON.parse(JSON.stringify(initialShift));
const formatTime = value => { if (!value) return "--:--"; const [h,m]=value.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; };
const toInputTime = value => /^([01]\d|2[0-3]):[0-5]\d/.test(String(value ?? "")) ? String(value).slice(0,5) : "";
const withCurrentOption = (options, value) => value && !options.some(o => o.value === value) ? [...options, {label: value, value}] : options;
const mapEditForm = (record) => {
  const f = freshForm();
  if (!record) return f;
  const legacyHours = Number(record.duration) > 0 && Number(record.duration) * 60 === durationMinutes(record.beginTime, record.endTime);
  const minutes = value => Number(value ?? 0) * (legacyHours ? 60 : 1);
  const minOT = String(record.minOT ?? 0);
  const lunchBreak = Number(record.lunchFlag) === 1;
  const hasRunaway = Number(record.runawayDurationMin) > 0;
  return {
    ...f,
    shiftName: record.shiftName ?? "", shiftCode: record.shiftCode ?? "",
    workMode: record.workMode ?? "", shiftType: record.shiftType ?? "",
    timeZone: record.shiftTimeZone ?? f.timeZone,
    startTime: toInputTime(record.beginTime), endTime: toInputTime(record.endTime),
    breakDuration: `${Number(record.lunchTimeMin ?? 0)} min`,
    lunchBreak, lunchStart: lunchBreak ? toInputTime(record.lunchTime) : "",
    workingDays: days.filter((_, i) => record[["monday","tuesday","wednesday","thursday","friday","saturday","sunday"][i]] === true),
    organizationId: String(record.rdhR0000IID ?? ""), entityId: String(record.rdhR0000IIID ?? ""),
    countryId: Number(record.rdhR0000XID) > 0 ? String(record.rdhR0000XID) : "",
    applicableToAllCountries: !Number(record.rdhR0000XID),
    customSchedule: {...f.customSchedule,
      lateMark: record.graceTimeForLateComming != null, earlyExit: record.graceTimeForEarlyGoing != null,
      lateMarkGraceTime: record.graceTimeForLateComming ?? 0, earlyExitGraceTime: record.graceTimeForEarlyGoing ?? 0,
      minimumWorkingHours: minutes(record.shiftDurationForHD)/60, maximumWorkingHours: minutes(record.shiftDurationForPP)/60,
      runawayStartTime: hasRunaway ? toInputTime(record.runawayStartTime) : "", runAwayEndTime: hasRunaway ? toInputTime(record.runAwayEndTime) : "",
    },
    otSchedule: {calculationDuration: minutes(record.shiftDurationForOTCalculation), minimumOT: minOT.includes(":") ? Number(minOT.split(":")[0])*60+Number(minOT.split(":")[1]) : Number(minOT), maximumOT: minutes(record.maxOT), allowance: Number(record.shiftAllowances ?? 0)},
    coffSchedule: Object.fromEntries(Object.entries(coffPrefixes).map(([section, prefixes]) => [section, prefixes.map((prefix,i) => ({...f.coffSchedule[section][i], enabled: Boolean(record[`${prefix}_Applicable`]), from: String(minutes(record[`${prefix}_From`])), to: String(minutes(record[`${prefix}_To`]))}))])),
  };
};
export default function ShiftCreation({ listPath = "/admin/attendance/shiftCreation", shiftId: suppliedShiftId, onBrowseTemplates }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editRecord = location.state?.shift ?? null;
  const isEdit = location.state?.isEdit === true || location.state?.mode === "edit";
  const encryptedId = location.state?.encryptedId ?? editRecord?.rdhR0000LXXXIID_Encrypted;
  const shiftId = location.state?.id ?? editRecord?.rdhR0000LXXXIID ?? suppliedShiftId;
  const auth = useAuthStore();
  const [form,setForm] = useState(() => isEdit ? mapEditForm(editRecord) : freshForm());
  useEffect(() => { setForm(isEdit ? mapEditForm(editRecord) : freshForm()); }, [location.key, isEdit, editRecord]);
  const [employees,setEmployees]=useState([]);
  const [masters,setMasters]=useState({organizations:[],entities:[],countries:[]});
  const [loadingMasters,setLoadingMasters]=useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(
  () => Boolean(shiftId)
);
  const [saving,setSaving]=useState(false);
  const saveLock=useRef(false);
  
  const [masterError,setMasterError]=useState("");
  const [employeeError,setEmployeeError]=useState("");
  useEffect(()=>{let active=true; Promise.all([getOrganisationList(),getEntityList(),getCountryList()]).then(([o,e,c])=>{if(active)setMasters({organizations:mapOptions(o,"RDHR0000IID","RDHR0000IName"),entities:mapOptions(e,"RDHR0000IIID","RDHR0000IIName"),countries:mapOptions(c,"RDHR0000XID","RDHR0000XName")});}).catch(e=>{if(active)setMasterError(getApiErrorMessage(e));}).finally(()=>{if(active)setLoadingMasters(false);});return ()=>{active=false;};},[]);
  
useEffect(() => {
  let active = true;

  setEmployees([]);
  setEmployeeError("");

  if (!shiftId) {
    setLoadingEmployees(false);

    return () => {
      active = false;
    };
  }

  setLoadingEmployees(true);

  getAllAssigned(shiftId)
    .then((response) => {
      if (!active) return;

      setEmployees(
        extractArray(response).map((employee, index) => ({
          id: index,
          name: employee.Name || "",
          role: employee.Designation || "",
          mode: employee.WorkMode || "Unknown",

          initials: (employee.Name || "")
            .split(" ")
            .slice(0, 2)
            .map((value) => value[0])
            .join(""),

          color: ["peach", "blue", "violet"][index % 3],

          reassigned: employee.IsReasigned,
        }))
      );
    })
    .catch((error) => {
      if (active) {
        setEmployeeError(getApiErrorMessage(error));
      }
    })
    .finally(() => {
      if (active) {
        setLoadingEmployees(false);
      }
    });

  return () => {
    active = false;
  };
}, [shiftId]);


  /* =========================================================
   DYNAMIC WORK MODE OVERVIEW
========================================================= */

const workModeOverview = useMemo(() => {
  const modes = [
    {
      label: "Office",
      color: "#5b8def",
      count: 0,
    },
    {
      label: "Hybrid",
      color: "#65b89d",
      count: 0,
    },
    {
      label: "Remote",
      color: "#e8b477",
      count: 0,
    },
  ];

  employees.forEach((employee) => {
    const workMode = String(employee.mode || "")
      .trim()
      .toLowerCase();

    const matchedMode = modes.find(
      (item) => item.label.toLowerCase() === workMode
    );

    if (matchedMode) {
      matchedMode.count += 1;
    } else {
      const otherMode = modes.find(
        (item) => item.label === "Other"
      );

      if (otherMode) {
        otherMode.count += 1;
      } else {
        modes.push({
          label: "Other",
          color: "#a5afbd",
          count: 1,
        });
      }
    }
  });

  const total = employees.length;

  let currentPercentage = 0;

  const segments = modes.map((mode) => {
    const percentage =
      total > 0 ? (mode.count / total) * 100 : 0;

    const start = currentPercentage;

    currentPercentage += percentage;

    return {
      ...mode,
      percentage: Math.round(percentage),
      start,
      end: currentPercentage,
    };
  });

  const gradient =
    total > 0
      ? `conic-gradient(${segments
          .filter((item) => item.count > 0)
          .map(
            (item) =>
              `${item.color} ${item.start}% ${item.end}%`
          )
          .join(", ")})`
      : "#e9edf4";

  return {
    total,
    segments,
    gradient,
  };
}, [employees]);
  const lunchDisplay=`${formatTime(form.lunchStart)} – ${formatTime(lunchEnd(form.lunchStart,form.breakDuration))}`;
  const [scheduleTab, setScheduleTab] = useState("Regular Schedule");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [toast, setToast] = useState("");
  const [showPolicy, setShowPolicy] = useState(false);

  /* UPDATE FORM */

  const update = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  /* UPDATE OT SCHEDULE */

  const updateOTSchedule = (key, value) => {
    setForm((current) => ({
      ...current,
      otSchedule: {
        ...current.otSchedule,
        [key]: value,
      },
    }));
  };

  /* UPDATE COFF ROW */

  const updateCoffRow = (section, index, key, value) => {
    setForm((current) => ({
      ...current,
      coffSchedule: {
        ...current.coffSchedule,
        [section]: current.coffSchedule[section].map(
          (row, rowIndex) =>
            rowIndex === index
              ? { ...row, [key]: value }
              : row
        ),
      },
    }));
  };

  /* UPDATE CUSTOM SCHEDULE */

  const updateCustomSchedule = (key, value) => {
    setForm((current) => ({
      ...current,
      customSchedule: {
        ...current.customSchedule,
        [key]: value,
      },
    }));
  };

  /* FILTER EMPLOYEES */

  const filteredEmployees = useMemo(
    () =>
      employees.filter((employee) =>
        `${employee.name} ${employee.role}`
          .toLowerCase()
          .includes(employeeSearch.toLowerCase())
      ),
    [employeeSearch, employees]
  );

  /* REGULAR WORKING DAYS */

  const toggleDay = (day) => {
    setForm((current) => ({
      ...current,
      workingDays: current.workingDays.includes(day)
        ? current.workingDays.filter((item) => item !== day)
        : [...current.workingDays, day],
    }));
  };

  /* TOAST */

  const notify = (message, type = "error") => setToast({id: Date.now(), message, type});
  const handleReset = () => { if (saving) return; setForm(isEdit ? mapEditForm(editRecord) : freshForm()); setScheduleTab("Regular Schedule"); setEmployeeSearch(""); };
  const handleList = () => { if (!saving) navigate(listPath); };
  const handlePublish = async () => {
    if (saveLock.current) return;
    if (isEdit && (!encryptedId || !editRecord)) { notify("Shift details or encrypted ID missing. Reopen the shift from the list."); return; }
    const result = shiftCreationSchema.safeParse(form);
    if (!result.success) {
      const issue = result.error.issues[0];
      const tabs = {customSchedule:"Custom Schedule",coffSchedule:"Coff Schedule",otSchedule:"OT Schedule"};
      setScheduleTab(tabs[issue.path[0]] || "Regular Schedule"); notify(issue.message); return;
    }
    // Advanced options are optional. Validate only selected IDs.
    const selections = [
      { label: "organization", value: form.organizationId, options: masters.organizations },
      { label: "entity", value: form.entityId, options: masters.entities },
      ...(!form.applicableToAllCountries ? [{ label: "country", value: form.countryId, options: masters.countries }] : []),
    ];
    if (!loadingMasters && !masterError) {
      const invalid = selections.find(({ value, options }) =>
        value != null && String(value) !== "" && String(value) !== "0" &&
        !options.some(option => String(option.value) === String(value))
      );
      if (invalid) { notify(`Select a valid ${invalid.label}`); return; }
    }
    const employeeName = auth.employeeName || sessionStorage.getItem("employeeName");
    if (!employeeName) { notify("Session information unavailable. Please sign in again."); return; }
    saveLock.current = true; setSaving(true);
    try {
      const payload = mapShiftPayload(form, {employeeName, sourceID: auth.sourceID || sessionStorage.getItem("sourceID")});
      if (isEdit) {
        // Preserve backend fields that have no editable control in this form.
        for (const key of ["isDeactivated", "shiftFlag", "punchBeginDuration", "lunchTimePunchBegin", "coffValidDays", "allowShortLeaveWithoutLunchDinner", "isMaxOT"]) {
          if (editRecord[key] != null) payload[key] = editRecord[key];
        }
        await updateShiftCreation(encryptedId, payload);
      } else { await createShiftCreation(payload); }
      navigate(listPath, {state:{message: isEdit ? "Shift updated successfully." : "Shift created successfully.", type:"success"}});
    } catch (error) { notify(getApiErrorMessage(error)); }
    finally { saveLock.current = false; setSaving(false); }
  };

  /* WORK MODE ICON */

  const workModeIcon =
    form.workMode === "Office" ? (
      <FiHome />
    ) : form.workMode === "Remote" ? (
      <FiMonitor />
    ) : (
      <FiHome />
    );

  /* RENDER */
const pageLoading = loadingMasters || loadingEmployees;

if (pageLoading) {
  return (
    <PageLoader
      message={
        loadingMasters
          ? "Loading shift configuration..."
          : "Loading assigned employees..."
      }
    />
  );
}
  return (
    <div className="shift-creation-page">
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} duration={5000} onClose={() => setToast(null)} />
      )}

      {/* PAGE HEADING */}

      <div className="sc-page-heading">
        <div className="sc-heading-left">
          <span className="sc-heading-icon">
            <FiCalendar />
          </span>

          <div>
            <h1>{isEdit ? "Edit Shift" : "Shift Creation"}</h1>
            <p>
              Create and manage shifts for global teams with flexible work
              modes.
            </p>
          </div>
        </div>
      </div>

      {/* MAIN GRID */}

      <div className="sc-main-grid">
        <main className="sc-left-column">
          {/* SHIFT DETAILS */}

          <section className="sc-card">
            <SectionHeader title="Shift Details" />

            <div className="hrms-form-section-body sc-card-content">
              <div className="hrms-form-row-3 sc-grid-3">
                <ShiftInput
                  label="Shift Name"
                  name="shiftName"
                  value={form.shiftName}
                  onChange={(value) =>
                    update(
                      "shiftName",
                      value?.target ? value.target.value : value
                    )
                  }
                  placeholder="Enter shift name"
                  required
                />

                <ShiftInput
                  label="Shift Code"
                  name="shiftCode"
                  value={form.shiftCode}
                  onChange={(value) =>
                    update(
                      "shiftCode",
                      (
                        value?.target ? value.target.value : value
                      ).toUpperCase()
                    )
                  }
                  placeholder="Enter shift code"
                  required
                />

                <ShiftSelect
                  label="Work Mode"
                  name="workMode"
                  value={form.workMode}
                  onChange={(value) => update("workMode", value)}
                  options={workModeOptions}
                  required
                />

                <ShiftSelect
                  label="Shift Type"
                  name="shiftType"
                  value={form.shiftType}
                  onChange={(value) => update("shiftType", value)}
                  options={withCurrentOption(shiftTypeOptions, form.shiftType)}
                  required
                />

                <ShiftSelect
                  label="Time Zone"
                  name="timeZone"
                  value={form.timeZone}
                  onChange={(value) => update("timeZone", value)}
                  options={withCurrentOption(timezoneOptions, form.timeZone)}
                  required
                  className="sc-span-2"
                />
              </div>
            </div>
          </section>

          {/* SHIFT SCHEDULE */}

          <section className="sc-card">
            <SectionHeader title="Shift Schedule" />

            <div
              className="sc-tabs"
              role="tablist"
              aria-label="Shift schedule type"
            >
              {[
                "Regular Schedule",
                "Coff Schedule",
                "Custom Schedule",
                "OT Schedule",
              ].map((tab) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={scheduleTab === tab}
                  className={scheduleTab === tab ? "active" : ""}
                  key={tab}
                  onClick={() => setScheduleTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* COFF SCHEDULE */}

            {scheduleTab === "Coff Schedule" ? (
              <div className="sc-coff-generation">
                <ScheduleHeader
                  title="COFF Schedule Settings"
                  description="Configure compensatory off eligibility for regular days and weekly offs / public holidays."
                  icon={FiBriefcase}
                />

                <div className="sc-coff-grid">
                  <CoffScheduleSection
                    title="Regular Day"
                    icon={FiCalendar}
                    rows={form.coffSchedule.regularDay}
                    onChange={(index, key, value) =>
                      updateCoffRow("regularDay", index, key, value)
                    }
                  />

                  <CoffScheduleSection
                    title="WO/PH"
                    icon={FiBriefcase}
                    rows={form.coffSchedule.woPh}
                    onChange={(index, key, value) =>
                      updateCoffRow("woPh", index, key, value)
                    }
                  />
                </div>
              </div>
            ) : scheduleTab === "Custom Schedule" ? (
              <div className="sc-custom-schedule-wrapper">
                <ScheduleHeader
                  title="Custom Schedule Settings"
                  description="Configure grace time, working hour limits and attendance rules."
                  icon={FiCalendar}
                />

                <CustomScheduleSection
                  data={form.customSchedule}
                  onChange={updateCustomSchedule}
                />
              </div>
            ) : scheduleTab === "OT Schedule" ? (
  <div className="sc-ot-schedule-container">
    <ScheduleHeader
      title="OT Schedule Settings"
      description="Configure overtime duration, working limits and allowances."
      icon={FiClock}
    />

    <OTScheduleSection
      data={form.otSchedule}
      onChange={updateOTSchedule}
    />
  </div>
) : (
              <div className="sc-regular-schedule-wrapper">
                <ScheduleHeader
                  title="Regular Schedule Settings"
                  description="Configure working hours, working days and break duration."
                  icon={FiCalendar}
                />

                <div className="sc-schedule-layout">
                  <div className="sc-work-hours">
                    <h3>Work Hours</h3>

                    <div className="sc-grid-hours">
                      <ShiftInput
                        label="Start Time"
                        name="startTime"
                        type="time"
                        value={form.startTime}
                        onChange={(value) =>
                          update(
                            "startTime",
                            value?.target ? value.target.value : value
                          )
                        }
                        required
                      />

                      <ShiftInput
                        label="End Time"
                        name="endTime"
                        type="time"
                        value={form.endTime}
                        onChange={(value) =>
                          update(
                            "endTime",
                            value?.target ? value.target.value : value
                          )
                        }
                        required
                      />

                      <Field
                        label="Working Days"
                        required
                        className="sc-days-field"
                      >
                        <div className="sc-days">
                          {days.map((day) => (
                            <button
                              type="button"
                              key={day}
                              className={
                                form.workingDays.includes(day)
                                  ? "selected"
                                  : ""
                              }
                              onClick={() => toggleDay(day)}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>

                    <div className="sc-break-row">
                      <ShiftSelect
                        label="Break Duration"
                        name="breakDuration"
                        value={form.breakDuration}
                        onChange={(value) =>
                          update("breakDuration", value)
                        }
                        options={withCurrentOption(breakOptions, form.breakDuration)}
                      />

                      <div className="sc-lunch-control">
                        <span className="sc-field-label">
                          Lunch Break
                        </span>

                        <div className="sc-lunch-toggle">
                          <FormToggleSwitch
                            checked={form.lunchBreak}
                            onChange={(value) =>
                              update("lunchBreak", value)
                            }
                            label="Enable lunch break"
                          />

                          <div>
                            <strong>
                              {form.lunchBreak ? "Enabled" : "Disabled"}
                            </strong>

                            <small>
                              {form.lunchBreak
                                ? lunchDisplay
                                : "No lunch break"}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                   {form.lunchBreak && (
  <div className="sc-lunch-schedule-card">

    <div className="sc-lunch-schedule-heading">
      <FiCoffee />
      <span>Lunch Schedule</span>
    </div>

    <div className="sc-lunch-time-grid">

      <ShiftInput
        label="Lunch Start Time"
        name="lunchStart"
        type="time"
        value={form.lunchStart}
        onChange={(value) =>
          update(
            "lunchStart",
            value?.target?.value ?? value
          )
        }
        required
      />

      <ShiftInput
        label="Lunch End Time"
        name="lunchEnd"
        type="time"
        value={lunchEnd(
          form.lunchStart,
          form.breakDuration
        )}
        readOnly
      />

    </div>

  </div>
)}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ADVANCED OPTIONS */}
          <section className="sc-card">
            <SectionHeader title="Advanced Options" />
            <div className="hrms-form-section-body sc-card-content">
              {masterError && <p role="alert">{masterError}</p>}
              <div className="hrms-form-row-3 sc-grid-3">
                <ShiftSelect label="Organization" name="organizationId" value={form.organizationId} onChange={v=>update("organizationId",String(v))} options={masters.organizations} disabled={loadingMasters} />
                <ShiftSelect label="Entity" name="entityId" value={form.entityId} onChange={v=>update("entityId",String(v))} options={masters.entities} disabled={loadingMasters} />
                <ShiftSelect label="Country" name="countryId" value={form.countryId} onChange={v=>update("countryId",String(v))} options={masters.countries} disabled={loadingMasters||form.applicableToAllCountries} />
              </div>
              <FormCheckbox label="Applicable to all countries" name="applicableToAllCountries" checked={form.applicableToAllCountries} onChange={e=>{const checked=e.target.checked;setForm(f=>({...f,applicableToAllCountries:checked,countryId:checked?"":f.countryId}));}} />
            </div>
          </section>
        </main>

        {/* RIGHT PREVIEW COLUMN */}

        <aside className="sc-right-column">
          {/* SHIFT PREVIEW */}

          <section className="sc-card sc-preview-card">
            <div className="sc-preview-heading">
              <div>
                <FiEye />
                <strong>Shift Preview</strong>
              </div>

              <span className="sc-active-pill">
                <i />
                Active
              </span>
            </div>

            <div className="sc-preview-main">
              <div className="sc-preview-info">
                <h2>{form.shiftName || "New Shift"}</h2>

            

                <p>
                  <FiClock />
                  {form.shiftType}
                  &nbsp;|&nbsp;
                  {formatTime(form.startTime)} – {formatTime(form.endTime)}
                </p>

                <p>
                  <FiCoffee />
                  Break: {form.breakDuration}
                  &nbsp;|&nbsp; Lunch:{" "}
                  {form.lunchBreak
                    ? lunchDisplay
                    : "Not set"}
                </p>

                <p>
                  <FiGlobe />
                  Applicable:{" "}
                  {form.applicableToAllCountries
                    ? "Worldwide"
                    : (masters.countries.find(c=>c.value===form.countryId)?.label || "Not selected")}
                </p>
              </div>

              <div className="sc-work-illustration">
                <img
                  src={remote_job}
                  alt="Remote job location illustration"
                  className="sc-remote-job-image"
                />
              </div>
            </div>
          </section>

          {/* OVERVIEW */}

          {/* ======================================================
    WORK MODE OVERVIEW & TIME ZONE
====================================================== */}

<section className="sc-card sc-overview-card">

  {/* WORK MODE OVERVIEW */}

  <div className="sc-overview-chart">
    <h3>Work Mode Overview</h3>

    <div className="sc-work-mode-content">

      {/* DYNAMIC DONUT CHART */}

      <div
        className="sc-work-mode-donut"
        style={{
          background: workModeOverview.gradient,
        }}
        role="img"
        aria-label={`Total assigned employees: ${workModeOverview.total}`}
      >
        <div className="sc-work-mode-donut-center">
          <strong>
            {workModeOverview.total}
          </strong>

          <span>
            {workModeOverview.total === 1
              ? "Employee"
              : "Employees"}
          </span>
        </div>
      </div>

      {/* WORK MODE LEGEND */}

      <div className="sc-work-mode-legend">
        {workModeOverview.segments.map((mode) => (
          <div
            className="sc-work-mode-legend-row"
            key={mode.label}
          >
            <div className="sc-work-mode-legend-label">
              <span
                className="sc-work-mode-dot"
                style={{
                  backgroundColor: mode.color,
                }}
              />

              <span>{mode.label}</span>
            </div>

            <strong>
              {mode.percentage}%
            </strong>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* TIME ZONE */}

  <div className="sc-timezone">
    <h3>Time Zone</h3>

    <div className="sc-timezone-content">
      <span className="sc-clock-icon">
        <FiClock />
      </span>

      <div>
        <strong>
          {form.timeZone === "Asia/Kolkata"
            ? "IST"
            : (form.timeZone || "")
                .split("/")
                .pop()
                .replaceAll("_", " ") || "Not selected"}
        </strong>

        <small>
          {form.timeZone === "Asia/Kolkata"
            ? "(UTC+05:30)"
            : form.timeZone}
        </small>
      </div>
    </div>
  </div>
</section>

          {/* ASSIGNED EMPLOYEES */}

          <section className="sc-card sc-employees-card">
            <div className="sc-employees-heading">
              <h3>Assigned Employees</h3>
            </div>

            <div className="sc-search">
              <FiSearch />

              <FormInput
                name="employeeSearch"
                value={employeeSearch}
                onChange={(event) =>
                  setEmployeeSearch(
                    event?.target ? event.target.value : event
                  )
                }
                placeholder="Search employees..."
                className="sc-search-input sc-input-control"
              />

              {employeeSearch && (
                <button
                  type="button"
                  onClick={() => setEmployeeSearch("")}
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="sc-employee-list">
              {employeeError && <p role="alert">{employeeError}</p>}
              {filteredEmployees.map((employee) => (
                <div className="sc-employee" key={employee.id}>
                  <div className={`sc-avatar ${employee.color}`}>
                    {employee.initials}
                  </div>

                  <div className="sc-employee-details">
                    <strong>{employee.name}</strong>
                    <small>{employee.role}</small>
                  </div>

                  <span
                    className={`sc-employee-mode ${employee.mode.toLowerCase()}`}
                  >
                    {employee.mode}
                  </span>

                  {employee.reassigned && <small>Reassigned</small>}
                </div>
              ))}

              {filteredEmployees.length === 0 && (
                <p className="sc-empty">No employees found.</p>
              )}
            </div>
          </section>
        </aside>
      </div>

      {/* FOOTER */}

      <footer className="hrms-form-footer sc-footer">
       

        <div className="sc-footer-actions">
          <FormButton
            type="button"
            variant="secondary"
            onClick={handleList}
          >
            <FiList />
            List
          </FormButton>

          <FormButton
            type="button"
            variant="primary"
            onClick={handlePublish}
            disabled={saving}
          >
            <FiSave />
            {saving ? "Saving..." : isEdit ? "Update" : "Save"}
          </FormButton>
        </div>
      </footer>
    </div>
  );
}
