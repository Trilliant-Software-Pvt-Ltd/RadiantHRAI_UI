
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiMinus,
  FiArrowDownLeft,
  FiArrowUpRight,
} from "react-icons/fi";

import FormOffcanvas from "../../../../../common/components/offcanvas/FormOffcanvas";
import FormTime from "../../../../../common/components/Form/FormTime";

import "./AttendanceRegularization.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  requestType: "adjust",
  entries: [],
  note: "",
};

/* =========================================================
   HELPERS
========================================================= */

const formatSelectedDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "—";

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const period = hours >= 12 ? "PM" : "AM";
  const formattedHour = hours % 12 || 12;

  return `${String(formattedHour).padStart(2, "0")}:${String(
    minutes,
  ).padStart(2, "0")} ${period}`;
};

const getTimeInMinutes = (time) => {
  if (!time) return null;

  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

/* =========================================================
   COMPONENT
========================================================= */

function AttendanceRegularization({
  show,
  onClose,
  onSubmit,
  selectedDate = "",
  shiftTimings = "12:00 AM - 09:00 AM",
}) {
  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    entries: [],
  });

  const [errors, setErrors] = useState({});

  /* =========================================================
     UPDATE FIELD
  ========================================================= */

  const updateField = (name, value) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  /* =========================================================
     UPDATE TIME ENTRY
  ========================================================= */

  const updateTimeEntry = (id, field, value) => {
    setFormData((previous) => ({
      ...previous,
      entries: previous.entries.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value,
            }
          : entry,
      ),
    }));

    setErrors((previous) => ({
      ...previous,
      [id]: "",
      entries: "",
    }));
  };

  /* =========================================================
     ADD TIME ENTRY
  ========================================================= */

  const addTimeEntry = () => {
    setFormData((previous) => ({
      ...previous,
      entries: [
        ...previous.entries,
        {
          id: Date.now(),
          inTime: "",
          outTime: "",
        },
      ],
    }));

    setErrors((previous) => ({
      ...previous,
      entries: "",
    }));
  };

  /* =========================================================
     REMOVE TIME ENTRY
  ========================================================= */

  const removeTimeEntry = (id) => {
    setFormData((previous) => ({
      ...previous,
      entries: previous.entries.filter((entry) => entry.id !== id),
    }));

    setErrors((previous) => {
      const updatedErrors = { ...previous };
      delete updatedErrors[id];
      return updatedErrors;
    });
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateForm = () => {
    if (formData.requestType === "exempt") {
      setErrors({});
      return true;
    }

    const nextErrors = {};

    if (formData.entries.length === 0) {
      nextErrors.entries = "Please add at least one time log.";
    }

    formData.entries.forEach((entry) => {
      if (!entry.inTime || !entry.outTime) {
        nextErrors[entry.id] = "Please select both IN and OUT times.";
        return;
      }

      const inMinutes = getTimeInMinutes(entry.inTime);
      const outMinutes = getTimeInMinutes(entry.outTime);

      if (outMinutes <= inMinutes) {
        nextErrors[entry.id] = "OUT time must be after IN time.";
      }
    });

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      ...INITIAL_FORM,
      entries: [],
    });

    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const requestData = {
      id: Date.now(),
      type: "Attendance Regularization",
      date: selectedDate,
      shiftTimings,
      requestType: formData.requestType,
      entries:
        formData.requestType === "adjust"
          ? formData.entries.map((entry) => ({
              inTime: entry.inTime,
              outTime: entry.outTime,
            }))
          : [],
      note: formData.note.trim() || "—",
      status: "Pending",
    };

    onSubmit?.(requestData);

    resetForm();
    onClose?.();
  };

  /* =========================================================
     FOOTER
  ========================================================= */

  const footer = (
    <div className="attendance-regularization-footer">
      <button
        type="button"
        className="hrms-form-button hrms-form-button-secondary"
        onClick={handleClose}
      >
        Cancel
      </button>

      <button
        type="submit"
        form="attendance-regularization-form"
        className="hrms-form-button hrms-form-button-primary"
      >
        Request
      </button>
    </div>
  );

  /* =========================================================
     DISPLAY DATE
  ========================================================= */

  const displayDate = useMemo(
    () => formatSelectedDate(selectedDate),
    [selectedDate],
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <FormOffcanvas
      show={show}
      onClose={handleClose}
      title="Request Attendance Regularization"
      width="480px"
      footer={footer}
    >
      <form
        id="attendance-regularization-form"
        className="attendance-regularization-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* SELECTED DATE AND SHIFT TIMINGS */}

        <div className="ar-summary">
          <div className="ar-summary-item">
            <span className="ar-summary-label">Selected date</span>
            <strong>{displayDate}</strong>
          </div>

          <div className="ar-summary-item ar-summary-shift">
            <span className="ar-summary-label">Shift timings</span>
            <strong>{shiftTimings}</strong>
          </div>
        </div>

        {/* REQUEST TYPE */}

        <div className="ar-request-options">
          <label className="ar-radio-option">
            <input
              type="radio"
              name="requestType"
              value="adjust"
              checked={formData.requestType === "adjust"}
              onChange={() => updateField("requestType", "adjust")}
            />

            <span className="ar-radio-custom"></span>

            <span className="hrms-form-label">
              Add/update time entries to adjust attendance logs.
            </span>
          </label>

          <label className="ar-radio-option">
            <input
              type="radio"
              name="requestType"
              value="exempt"
              checked={formData.requestType === "exempt"}
              onChange={() => updateField("requestType", "exempt")}
            />

            <span className="ar-radio-custom"></span>

            <span className="hrms-form-label">
              Raise regularization request to exempt this day from
              penalization policy.
            </span>
          </label>
        </div>

        {/* ATTENDANCE ADJUSTMENT */}

        {formData.requestType === "adjust" && (
          <>
            <div className="ar-instruction">
              Click and select time stamp box that you would like to adjust and
              make changes to the time
            </div>

            <div className="ar-adjustment-section">
              <h6 className="ar-section-title">Attendance Adjustment</h6>

              {/* SHOW ADD LOG BUTTON INITIALLY */}

              {formData.entries.length === 0 && (
                <button
                  type="button"
                  className="ar-add-log-button"
                  onClick={addTimeEntry}
                >
                  <FiPlus />
                  Add Log
                </button>
              )}

              {errors.entries && (
                <span className="ar-entry-error ar-general-error">
                  {errors.entries}
                </span>
              )}

              {/* SHOW TIME FIELDS AFTER ADD LOG */}

              {formData.entries.length > 0 && (
                <div className="ar-entries">
                  {formData.entries.map((entry, index) => (
                    <div className="ar-entry-wrapper" key={entry.id}>
                      <div className="ar-entry-row">
                        {/* ADD ENTRY */}

                        {index === 0 ? (
                          <button
                            type="button"
                            className="ar-entry-action ar-add-entry"
                            onClick={addTimeEntry}
                            title="Add time entry"
                            aria-label="Add time entry"
                          >
                            <FiPlus />
                          </button>
                        ) : (
                          <span className="ar-entry-action-placeholder"></span>
                        )}

                        {/* IN TIME */}

                        <div className="ar-time-field">
                          <span className="ar-entry-direction ar-in-direction">
                            <FiArrowDownLeft />
                          </span>

                          <FormTime
                            label=""
                            name={`inTime-${entry.id}`}
                            value={entry.inTime}
                            onChange={(event) =>
                              updateTimeEntry(
                                entry.id,
                                "inTime",
                                event.target.value,
                              )
                            }
                            placeholder="Select time"
                            required
                          />
                        </div>

                        {/* OUT TIME */}

                        <div className="ar-time-field">
                          <span className="ar-entry-direction ar-out-direction">
                            <FiArrowUpRight />
                          </span>

                          <FormTime
                            label=""
                            name={`outTime-${entry.id}`}
                            value={entry.outTime}
                            onChange={(event) =>
                              updateTimeEntry(
                                entry.id,
                                "outTime",
                                event.target.value,
                              )
                            }
                            placeholder="Select time"
                            required
                            min={entry.inTime || undefined}
                          />
                        </div>

                        {/* ADD / REMOVE */}

                        <div className="ar-entry-controls">
                          <button
                            type="button"
                            className="ar-entry-action ar-add-entry"
                            onClick={addTimeEntry}
                            title="Add another entry"
                            aria-label="Add another entry"
                          >
                            <FiPlus />
                          </button>

                          <button
                            type="button"
                            className="ar-entry-action ar-remove-entry"
                            onClick={() => removeTimeEntry(entry.id)}
                            title="Remove entry"
                            aria-label="Remove entry"
                          >
                            <FiMinus />
                          </button>
                        </div>
                      </div>

                      {errors[entry.id] && (
                        <span className="ar-entry-error">
                          {errors[entry.id]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* NOTE */}

        <div className="ar-note-group">
          <label htmlFor="arNote" className="hrms-form-label">Note</label>

          <textarea
            id="arNote"
            name="note"
            rows="4"
            placeholder="Enter note"
            value={formData.note}
            onChange={(event) => updateField("note", event.target.value)}
          />
        </div>
      </form>
    </FormOffcanvas>
  );
}

export default AttendanceRegularization;
