
import { useState } from "react";
import { FiClock } from "react-icons/fi";

import FormOffcanvas from "../../../../../common/components/offcanvas/FormOffcanvas";
import DynamicCalendar from "../../../../../common/components/calendar/DynamicCalendar";
import FormTime from "../../../../../common/components/Form/FormTime";

import "./PunchMissingRequest.css";

const INITIAL_FORM = {
  punchType: "IN",
  attendanceDate: "",
  logDate: "",
  time: "",
  reason: "",
};

function PunchMissingRequest({ show, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});

  // ========================================
  // VALIDATE FIELD
  // ========================================
  const validateField = (name, value, currentData = formData) => {
    let error = "";

    if (name === "punchType" && !value) {
      error = "Please select punch type";
    }

    if (name === "attendanceDate" && !value) {
      error = "Please select attendance date";
    }

    if (name === "logDate") {
      if (!value) {
        error = "Please select log date";
      } else if (
        currentData.attendanceDate &&
        value < currentData.attendanceDate
      ) {
        error = "Log date cannot be before attendance date";
      }
    }

    if (name === "time" && !value) {
      error = "Please select punch time";
    }

    if (name === "reason" && !value.trim()) {
      error = "Please enter a reason";
    }

    return error;
  };

  // ========================================
  // UPDATE FIELD
  // ========================================
  const updateField = (name, value) => {
    const updatedData = {
      ...formData,
      [name]: value,
    };

    setFormData(updatedData);

    setErrors((previous) => ({
      ...previous,
      [name]: validateField(name, value, updatedData),

      ...(name === "attendanceDate"
        ? {
            logDate: validateField(
              "logDate",
              updatedData.logDate,
              updatedData
            ),
          }
        : {}),
    }));
  };

  // ========================================
  // HANDLE NORMAL INPUT CHANGE
  // ========================================
  const handleChange = (event) => {
    if (!event?.target) return;

    const { name, value } = event.target;

    updateField(name, value);
  };

  // ========================================
  // HANDLE DATE CHANGE
  // ========================================
  const handleDateChange = (event) => {
    if (!event?.target) return;

    const { name, value } = event.target;

    updateField(name, value);
  };

  // ========================================
  // VALIDATE FORM
  // ========================================
  const validateForm = () => {
    const nextErrors = {};

    Object.keys(INITIAL_FORM).forEach((key) => {
      nextErrors[key] = validateField(
        key,
        formData[key],
        formData
      );
    });

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  // ========================================
  // RESET FORM
  // ========================================
  const resetForm = () => {
    setFormData({ ...INITIAL_FORM });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  // ========================================
  // SUBMIT FORM
  // ========================================
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const newRequest = {
      id: Date.now(),
      type: "Punch Missing",
      punchType: formData.punchType,
      attendanceDate: formData.attendanceDate,
      logDate: formData.logDate,
      time: formData.time,
      reason: formData.reason.trim(),
      status: "Pending",
    };

    onSubmit?.(newRequest);
    resetForm();
  };

  // ========================================
  // OFFCANVAS FOOTER
  // ========================================
  const footer = (
    <div className="punch-missing-footer-actions">
      <button
        type="button"
        className="hrms-form-button hrms-form-button-secondary"
        onClick={handleClose}
      >
        Cancel
      </button>

      <button
        type="submit"
        form="punch-missing-request-form"
        className="hrms-form-button hrms-form-button-primary"
      >
        Request
      </button>
    </div>
  );

  return (
    <FormOffcanvas
      show={show}
      onClose={handleClose}
      title="Punch Missing Request"
      width="480px"
      footer={footer}
    >
      <form
        id="punch-missing-request-form"
        className="punch-missing-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* IN / OUT */}
        <div className="hrms-form-group">
          <label className="hrms-form-label">
            In / Out <span className="hrms-required">*</span>
          </label>

          <div className="punch-missing-type-switch">
            {["IN", "OUT"].map((type) => (
              <button
                key={type}
                type="button"
                className={
                  formData.punchType === type ? "active" : ""
                }
                onClick={() => updateField("punchType", type)}
              >
                {type}
              </button>
            ))}
          </div>

          {errors.punchType && (
            <span className="hrms-field-error">
              {errors.punchType}
            </span>
          )}
        </div>

        {/* ATTENDANCE DATE */}
        <div className="hrms-form-group">
          <DynamicCalendar
            label="Attendance Date"
            name="attendanceDate"
            value={formData.attendanceDate}
            onChange={handleDateChange}
            mode="dd-mm-yyyy"
            placeholder="dd/mm/yyyy"
            required
            error={errors.attendanceDate}
          />
        </div>

        {/* LOG DATE */}
        <div className="hrms-form-group">
          <DynamicCalendar
            label="Log Date"
            name="logDate"
            value={formData.logDate}
            onChange={handleDateChange}
            mode="dd-mm-yyyy"
            placeholder="dd/mm/yyyy"
            minDate={formData.attendanceDate || undefined}
            required
            error={errors.logDate}
          />
        </div>

        {/* TIME */}
        <div className="hrms-form-group">
          <FormTime
            label="Time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            error={errors.time}
          />
        </div>

        {/* REASON */}
        <div className="hrms-form-group">
          <label
            htmlFor="punchMissingReason"
            className="hrms-form-label"
          >
            Reason <span className="hrms-required">*</span>
          </label>

          <textarea
            id="punchMissingReason"
            name="reason"
            className="hrms-form-control"
            rows={3}
            placeholder="Enter reason for missing punch"
            value={formData.reason}
            onChange={(event) =>
              updateField("reason", event.target.value)
            }
          />

          {errors.reason && (
            <span className="hrms-field-error">
              {errors.reason}
            </span>
          )}
        </div>
      </form>
    </FormOffcanvas>
  );
}

export default PunchMissingRequest;
