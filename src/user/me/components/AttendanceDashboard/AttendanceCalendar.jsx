import React, { useMemo } from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiZap,
} from "react-icons/fi";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AttendanceCalendar = ({
  records = [],
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
  formatDate,
  formatTime,
  getStatusClass,
  show24Hour,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const makeDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

  const todayKey = makeDateKey(new Date());

  const monthDays = [
    ...Array(offset).fill(null),
    ...Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(year, month, index + 1);

      return {
        day: index + 1,
        key: makeDateKey(date),
      };
    }),
  ];

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthRecords = records.filter((record) =>
    record.date.startsWith(monthPrefix),
  );

  const selectedRecord = records.find((record) => record.date === selectedDate);

  const changeMonth = (direction) => {
    setCurrentDate(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + direction, 1),
    );
  };

  const handleYearChange = (event) => {
    setCurrentDate(new Date(Number(event.target.value), month, 1));
  };

  const handleMonthChange = (event) => {
    setCurrentDate(new Date(year, Number(event.target.value), 1));
  };

  // REGULARIZATION REMINDER DATE (DEMO: 3 DAYS)
  const getRegularizationDate = (dateValue) => {
    const date = new Date(`${dateValue}T00:00:00`);

    date.setDate(date.getDate() + 3);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // CHECK MISSING PUNCH
  const hasMissingPunch = (record) => {
    return (
      !record.checkIn ||
      !record.checkOut ||
      record.checkIn === "-" ||
      record.checkOut === "-"
    );
  };

  // GENERATE AI SUGGESTIONS FROM ATTENDANCE RECORDS
  const aiSuggestions = useMemo(() => {
    const suggestions = monthRecords
      .filter((record) => {
        const status = String(record.status || "").toLowerCase();

        return (
          ["late", "absent", "half day"].includes(status) ||
          hasMissingPunch(record)
        );
      })
      .map((record) => {
        const missingPunch = hasMissingPunch(record);
        const status = String(record.status || "").toLowerCase();

        let suggestion = {};

        if (missingPunch && status !== "absent") {
          suggestion = {
            type: "missing-punch",
            title: "Missing Punch Detected",
            action: "Submit Punch Request",
            icon: <FiClock />,
          };
        } else if (status === "absent") {
          suggestion = {
            type: "absent",
            title: "Absent Attendance Mark",
            action: "Regularize Attendance",
            icon: <FiAlertCircle />,
          };
        } else if (status === "late") {
          suggestion = {
            type: "late",
            title: "Late Arrival Detected",
            action: "Review Late Mark",
            icon: <FiAlertTriangle />,
          };
        } else if (status === "half day") {
          suggestion = {
            type: "half-day",
            title: "Half Day Attendance",
            action: "Review Attendance",
            icon: <FiInfo />,
          };
        }

        return {
          ...suggestion,
          date: record.date,
          dateLabel: formatDate(record.date),
          deadline: getRegularizationDate(record.date),
          record,
        };
      });

    // Show a reminder when the selected past date has no record.
    if (!selectedRecord && selectedDate && selectedDate <= todayKey) {
      suggestions.unshift({
        type: "no-record",
        title: "Attendance Record Not Found",
        action: "Verify Attendance",
        icon: <FiAlertCircle />,
        date: selectedDate,
        dateLabel: formatDate(selectedDate),
        deadline: getRegularizationDate(selectedDate),
      });
    }

    return suggestions;
  }, [
    monthRecords,
    selectedRecord,
    selectedDate,
    todayKey,
    formatDate,
    formatTime,
  ]);

  const selectedStatus = selectedRecord
    ? getStatusClass(selectedRecord.status)
    : "";

  return (
    <>
      <div className="attendance-calendar-layout">
        {/* =========================================
            CALENDAR MAIN
        ========================================= */}

        <div className="attendance-calendar-main">
          {/* TOOLBAR */}

          <div className="attendance-calendar-toolbar">
            <div className="attendance-calendar-navigation">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="attendance-calendar-selectors">
              <select
                className="attendance-select"
                value={month}
                onChange={handleMonthChange}
              >
                {MONTHS.map((name, index) => (
                  <option value={index} key={name}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="attendance-select"
                value={year}
                onChange={handleYearChange}
              >
                {Array.from({ length: 15 }, (_, index) => 2020 + index).map(
                  (value) => (
                    <option value={value} key={value}>
                      {value}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          {/* LEGEND AT TOP */}

          <div className="attendance-calendar-legend">
            {[
              { label: "Present", className: "present" },
              { label: "Late", className: "late" },
              { label: "Absent", className: "absent" },
              { label: "Half Day", className: "half-day" },
              { label: "Leave", className: "leave" },
            ].map((item) => (
              <span key={item.label}>
                <i className={item.className} />
                {item.label}
              </span>
            ))}
          </div>

          {/* MONTHLY CALENDAR */}

          <div className="attendance-month-grid">
            {WEEKDAYS.map((day) => (
              <div className="attendance-month-weekday" key={day}>
                {day}
              </div>
            ))}

            {monthDays.map((date, index) => {
              if (!date) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="attendance-month-empty"
                  />
                );
              }

              const record = records.find((item) => item.date === date.key);

              const statusClass = record ? getStatusClass(record.status) : "";

              const isSelected = selectedDate === date.key;
              const isToday = todayKey === date.key;

              return (
                <button
                  type="button"
                  key={date.key}
                  aria-label={`${formatDate(date.key)} ${
                    record?.status || "No attendance record"
                  }`}
                  aria-pressed={isSelected}
                  className={`
                      attendance-month-day
                      ${statusClass}
                      ${isSelected ? "selected" : ""}
                      ${isToday ? "today" : ""}
                    `}
                  onClick={() => setSelectedDate(date.key)}
                >
                  <span>{date.day}</span>

                  {record && <i />}

                  {record && <small>{record.status}</small>}

                  {/* HOVER ATTENDANCE DETAILS */}

                  <div className="attendance-date-tooltip">
                    <strong>{formatDate(date.key)}</strong>

                    {record ? (
                      <>
                        <span
                          className={`attendance-date-tooltip-status ${statusClass}`}
                        >
                          {record.status}
                        </span>

                        <div className="attendance-date-tooltip-row">
                          <span>Check In</span>
                          <b>{formatTime(record.checkIn)}</b>
                        </div>

                        <div className="attendance-date-tooltip-row">
                          <span>Check Out</span>
                          <b>{formatTime(record.checkOut)}</b>
                        </div>

                        <div className="attendance-date-tooltip-row">
                          <span>Working Hours</span>
                          <b>{record.hours || "-"}</b>
                        </div>
                      </>
                    ) : (
                      <span className="attendance-date-tooltip-empty">
                        No attendance record available for this date.
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================
            AI SUGGESTIONS PANEL
        ========================================= */}

        <aside className="attendance-selected-day">
          <div className="attendance-ai-heading">
            <span className="attendance-ai-icon">
              <FiZap />
            </span>

            <h4>AI Suggestions</h4>
          </div>

          <p className="attendance-ai-subtitle">
            Attendance alerts and recommended actions based on your records.
          </p>

          <div className="attendance-ai-count">
            <FiAlertCircle />
            {aiSuggestions.length} Attention Required
          </div>

          {aiSuggestions.length > 0 ? (
            <div className="attendance-ai-list">
              {aiSuggestions.map((item, index) => (
                <div
                  className={`attendance-ai-card ${item.type}`}
                  key={`${item.date}-${item.type}-${index}`}
                  onClick={() => setSelectedDate(item.date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedDate(item.date);
                    }
                  }}
                >
                  <div className="attendance-ai-card-top">
                    <span className="attendance-ai-card-icon">{item.icon}</span>

                    <div className="attendance-ai-card-content">
                      <strong>{item.title}</strong>

                      <small>{item.dateLabel}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="attendance-ai-empty">
              <FiCheckCircle />

              <strong>Everything looks good!</strong>

              <span>
                No attendance issues or pending suggestions found for this
                month.
              </span>
            </div>
          )}

          <div className="attendance-ai-note">
            <FiInfo style={{ marginRight: 4 }} />
            Suggestions are based on available attendance records.
          </div>
        </aside>
      </div>
    </>
  );
};

export default AttendanceCalendar;
