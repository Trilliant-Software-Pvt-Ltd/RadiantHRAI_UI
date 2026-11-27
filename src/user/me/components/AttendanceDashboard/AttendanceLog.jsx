import React, { useRef, useState, useEffect } from "react";

import {
  FiMoreHorizontal,
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiEdit2,
  FiMessageSquare,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
} from "react-icons/fi";

/* =========================================================
   DATE HELPERS
========================================================= */

const getShortDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);

  return parsedDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const getDateLabel = (date) => {
  if (!date) return "-";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   ATTENDANCE STATUS HELPERS
========================================================= */

const getStatusType = (status = "") => {
  const normalized = String(status)
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (normalized === "present") return "present";
  if (normalized === "late") return "late";
  if (normalized === "absent") return "absent";
  if (normalized === "halfday") return "half-day";

  if (normalized === "leave" || normalized === "onleave") {
    return "leave";
  }

  if (
    normalized === "weekoff" ||
    normalized === "weeklyoff" ||
    normalized === "woff"
  ) {
    return "week-off";
  }

  if (normalized === "wfh" || normalized === "workfromhome") {
    return "wfh";
  }

  if (normalized === "holiday") return "holiday";

  return "normal";
};

const getStatusLabel = (status = "") => {
  const type = getStatusType(status);

  const labels = {
    present: "PRESENT",
    late: "LATE",
    absent: "ABSENT",
    "half-day": "HALF DAY",
    leave: "LEAVE",
    "week-off": "W-OFF",
    wfh: "WFH",
    holiday: "HOLIDAY",
    normal: "",
  };

  return labels[type] || status.toUpperCase();
};

/* =========================================================
   HOURS HELPERS
========================================================= */

const getEffectiveHours = (record) => {
  return record?.effectiveHours || record?.hours || "00h 00m";
};

const getBreakHours = (record) => {
  return record?.breakTaken || record?.break || "00h 00m";
};

const getGrossHours = (record) => {
  return record?.grossHours || record?.gross || record?.hours || "00h 00m";
};

/* =========================================================
   ATTENDANCE LOG COMPONENT
========================================================= */

const AttendanceLog = ({
  records = [],
  filterStatus = "All",
  setFilterStatus,
  formatDate,
  formatTime,
  getStatusClass,
  onOpenWfhForm,
  onOpenPunchMissingForm,
  onOpenLeaveForm,
  onOpenRegularizeForm,
}) => {
  /* =========================================================
     STATES
  ========================================================= */

  const [selectedPeriod, setSelectedPeriod] = useState("30 DAYS");

  // Present row details popup
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Other rows request popup
  const [selectedActionRecord, setSelectedActionRecord] = useState(null);

  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    right: 0,
  });

  const tableWrapperRef = useRef(null);
  const popupRef = useRef(null);

  /* =========================================================
     FILTER RECORDS
  ========================================================= */

  const filteredRecords = records.filter((record) =>
    filterStatus === "All" ? true : record.status === filterStatus,
  );

  /* =========================================================
     CLOSE POPUPS
  ========================================================= */

  const closePopup = () => {
    setSelectedRecord(null);
    setSelectedActionRecord(null);
  };

  /* =========================================================
     CLOSE POPUP ON OUTSIDE CLICK / ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  /* =========================================================
     GET POPUP POSITION
  ========================================================= */

  const getPopupPosition = (row) => {
    const wrapper = tableWrapperRef.current;

    if (!wrapper || !row) return null;

    const rowRect = row.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    return {
      top: rowRect.top - wrapperRect.top + rowRect.height - 4,
      right: 0,
    };
  };

  /* =========================================================
     PRESENT ROW CLICK
     Opens only attendance details popup
  ========================================================= */

  const handleRowClick = (record, event) => {
    const status = getStatusType(record.status);

    // Only Present rows open the attendance details popup
    if (status !== "present") return;

    if (selectedRecord?.date === record.date) {
      closePopup();
      return;
    }

    const position = getPopupPosition(event.currentTarget);

    if (!position) return;

    setPopupPosition(position);

    setSelectedActionRecord(null);
    setSelectedRecord(record);
  };

  /* =========================================================
     THREE DOT CLICK
     Opens request links popup for other statuses
  ========================================================= */

  const handleMoreClick = (record, event) => {
    event.stopPropagation();

    const row = event.currentTarget.closest("tr");

    const position = getPopupPosition(row);

    if (!position) return;

    if (selectedActionRecord?.date === record.date) {
      closePopup();
      return;
    }

    setPopupPosition(position);

    setSelectedRecord(null);
    setSelectedActionRecord(record);
  };

  /* =========================================================
     REGULARIZE ATTENDANCE
  ========================================================= */

  const handleRegularize = (record) => {
  closePopup();
  onOpenRegularizeForm?.(record);
};

  /* =========================================================
     OPEN EXISTING WFH FORM
  ========================================================= */

  const handleOpenWfh = () => {
    closePopup();

    if (onOpenWfhForm) {
      onOpenWfhForm();
    }
  };

  /* =========================================================
     OPEN EXISTING PUNCH MISSING FORM
  ========================================================= */

  const handleOpenPunchMissing = () => {
    closePopup();

    if (onOpenPunchMissingForm) {
      onOpenPunchMissingForm();
    }
  };

  /* =========================================================
     ATTENDANCE VISUAL
  ========================================================= */

  const getAttendanceVisual = (record) => {
    const status = getStatusType(record.status);

    if (status === "leave" || status === "week-off") {
      return null;
    }

    if (status === "absent" || status === "holiday") {
      return (
        <span className="attendance-visual-empty">No Time Entries Logged</span>
      );
    }

    return (
      <div className={`attendance-visual-bar ${status}`}>
        <div className="attendance-visual-timeline">
          <span />

          {Array.from({ length: 20 }, (_, index) => (
            <i key={index} />
          ))}
        </div>

        <FiMapPin className="attendance-visual-location" />
      </div>
    );
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="attendance-log-component">
      {/* =====================================================
          DATE RANGE HEADER
      ===================================================== */}

      <div className="attendance-log-period">
        <h4>
          {selectedPeriod === "30 DAYS" ? "Last 30 Days" : selectedPeriod}
        </h4>

        <div className="attendance-log-period-tabs">
          {["30 DAYS", "OCT", "SEP", "AUG", "JUL", "JUN", "MAY"].map(
            (period) => (
              <button
                type="button"
                key={period}
                className={selectedPeriod === period ? "active" : ""}
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </button>
            ),
          )}
        </div>
      </div>

      {/* =====================================================
          ATTENDANCE TABLE
      ===================================================== */}

      <div className="attendance-log-table-wrapper" ref={tableWrapperRef}>
        <table className="attendance-log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Attendance Visual</th>
              <th>Effective Hours</th>
              <th>Break Taken</th>
              <th>Gross Hours</th>
              <th>Arrival</th>
              <th>Log</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => {
                const status = getStatusType(record.status);

                const isSelected =
                  selectedRecord?.date === record.date ||
                  selectedActionRecord?.date === record.date;

                // Three dots are shown only for non-present rows
                const showMore = status !== "present";

                return (
                  <tr
                    key={record.date}
                    className={`attendance-log-row ${status} ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={(event) => handleRowClick(record, event)}
                  >
                    {/* DATE */}

                    <td>
                      <div className="attendance-log-date">
                        <span>{getShortDate(record.date)}</span>

                        {status !== "normal" && (
                          <span className={`attendance-log-status ${status}`}>
                            {getStatusLabel(record.status)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ATTENDANCE VISUAL */}

                    <td>
                      <div className="attendance-log-visual">
                        {getAttendanceVisual(record)}
                      </div>
                    </td>

                    {/* EFFECTIVE HOURS */}

                    <td>
                      <div className="attendance-log-effective">
                        <span>{getEffectiveHours(record)}</span>
                      </div>
                    </td>

                    {/* BREAK */}

                    <td>{getBreakHours(record)}</td>

                    {/* GROSS */}

                    <td>{getGrossHours(record)}</td>

                    {/* ARRIVAL */}

                    <td>
                      {status === "present" || status === "late" ? (
                        <div className="attendance-log-arrival">
                          <FiCheckCircle
                            className={status === "late" ? "late" : "ontime"}
                          />

                          <span>{status === "late" ? "Late" : "On Time"}</span>
                        </div>
                      ) : null}
                    </td>

                    {/* LOG / MORE ACTIONS */}

                    <td>
                      <div className="attendance-log-actions">
                        {showMore && (
                          <button
                            type="button"
                            className="attendance-log-more"
                            title="More options"
                            aria-label={`More options for ${getDateLabel(
                              record.date,
                            )}`}
                            onClick={(event) => handleMoreClick(record, event)}
                          >
                            <FiMoreHorizontal />
                          </button>
                        )}

                        {status === "present" && (
                          <FiCheckCircle className="attendance-log-present-icon" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="attendance-log-empty">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* =====================================================
            1. PRESENT ROW - ATTENDANCE DETAILS POPUP
        ===================================================== */}

        {selectedRecord && (
          <>
            <div
              className="attendance-log-popup-backdrop"
              onClick={closePopup}
            />

            <div
              className="attendance-log-popup"
              ref={popupRef}
              style={{
                top: `${popupPosition.top}px`,
                right: `${popupPosition.right}px`,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* POPUP HEADER */}

              <div className="attendance-log-popup-header">
                <div>
                  <strong>
                    {selectedRecord.shiftName || "Flexi shift"}

                    {selectedRecord.shiftDate
                      ? ` (${selectedRecord.shiftDate})`
                      : ""}
                  </strong>

                  <span>
                    {formatTime(selectedRecord.checkIn)} -{" "}
                    {formatTime(selectedRecord.checkOut)}
                  </span>
                </div>

                <button
                  type="button"
                  className="attendance-log-popup-close"
                  onClick={closePopup}
                  aria-label="Close popup"
                >
                  <FiX />
                </button>
              </div>

              {/* REGULARIZE */}

              <button
                type="button"
                className="attendance-log-regularize"
                onClick={() => handleRegularize(selectedRecord)}
              >
                <FiEdit2 />
                <span>Regularize</span>
              </button>

              {/* ATTENDANCE DETAILS */}

              <div className="attendance-log-popup-details">
                <strong>{selectedRecord.type || selectedRecord.status}</strong>

                <div className="attendance-log-punches">
                  {/* PUNCH IN */}

                  <div>
                    <FiArrowDownLeft className="punch-in" />

                    <span>{formatTime(selectedRecord.checkIn)}</span>

                    <FiMessageSquare className="punch-message" />
                  </div>

                  {/* PUNCH OUT */}

                  <div>
                    <FiArrowUpRight className="punch-out" />

                    <span>{formatTime(selectedRecord.checkOut)}</span>
                  </div>
                </div>

                {selectedRecord.reason && (
                  <p className="attendance-log-popup-reason">
                    {selectedRecord.reason}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {/* =====================================================
            2. OTHER ROWS - REQUEST FORM POPUP
        ===================================================== */}

        {selectedActionRecord && (
          <>
            <div
              className="attendance-action-menu-backdrop"
              onClick={closePopup}
            />

            <div
              className="attendance-action-menu"
              ref={popupRef}
              style={{
                top: `${popupPosition.top}px`,
                right: `${popupPosition.right}px`,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  handleRegularize(selectedActionRecord);
                }}
              >
                Regularize
              </button>

              <button type="button" onClick={handleOpenWfh}>
                Apply WFH Request
              </button>

              <button
                type="button"
                onClick={() => {
                  closePopup();
                  console.log("Apply On Duty:", selectedActionRecord);
                }}
              >
                Apply On Duty
              </button>

              <button
                type="button"
                onClick={() => {
                  closePopup();
                  onOpenLeaveForm?.();
                }}
              >
                Request Leave
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceLog;
