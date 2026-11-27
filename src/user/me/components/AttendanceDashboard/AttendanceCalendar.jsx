
import React from "react";

import {
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiList,
  FiCalendar,
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
  calendarMode,
  setCalendarMode,
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
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay.getDay() + 6) % 7;

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
    record.date.startsWith(monthPrefix)
  );

  const selectedRecord = records.find(
    (record) => record.date === selectedDate
  );

  const changeMonth = (direction) => {
    setCurrentDate(
      (previous) =>
        new Date(
          previous.getFullYear(),
          previous.getMonth() + direction,
          1
        )
    );
  };

  const handleYearChange = (event) => {
    setCurrentDate(
      new Date(Number(event.target.value), month, 1)
    );
  };

  const handleMonthChange = (event) => {
    setCurrentDate(
      new Date(year, Number(event.target.value), 1)
    );
  };

  return (
    <div className="attendance-calendar-layout">
      <div className="attendance-calendar-main">
        {/* CALENDAR TOOLBAR */}
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
              {Array.from(
                { length: 15 },
                (_, index) => 2020 + index
              ).map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-view-toggle">
            <button
              type="button"
              className={
                calendarMode === "calendar" ? "active" : ""
              }
              onClick={() => setCalendarMode("calendar")}
              aria-label="Calendar view"
            >
              <FiGrid />
            </button>

            <button
              type="button"
              className={
                calendarMode === "list" ? "active" : ""
              }
              onClick={() => setCalendarMode("list")}
              aria-label="List view"
            >
              <FiList />
            </button>
          </div>
        </div>

        {/* MONTHLY CALENDAR */}
        {calendarMode === "calendar" ? (
          <div className="attendance-month-grid">
            {WEEKDAYS.map((day) => (
              <div
                className="attendance-month-weekday"
                key={day}
              >
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

              const record = records.find(
                (item) => item.date === date.key
              );

              return (
                <button
                  type="button"
                  key={date.key}
                  className={`attendance-month-day ${
                    record
                      ? getStatusClass(record.status)
                      : ""
                  } ${
                    selectedDate === date.key ? "selected" : ""
                  }`}
                  onClick={() => setSelectedDate(date.key)}
                >
                  <span>{date.day}</span>

                  {record && <i />}

                  {record && (
                    <small>{record.status}</small>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* CALENDAR LIST VIEW */
          <div className="attendance-calendar-list">
            {monthRecords.length > 0 ? (
              monthRecords.map((record) => (
                <button
                  type="button"
                  key={record.date}
                  className={
                    selectedDate === record.date ? "selected" : ""
                  }
                  onClick={() => setSelectedDate(record.date)}
                >
                  <span>{formatDate(record.date)}</span>

                  <span>{record.hours}</span>

                  <span
                    className={`attendance-status-badge ${getStatusClass(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </button>
              ))
            ) : (
              <div className="attendance-no-records">
                No records for this month.
              </div>
            )}
          </div>
        )}

        {/* CALENDAR LEGEND */}
        <div className="attendance-calendar-legend">
          {[
            "Present",
            "Late",
            "Absent",
            "Half Day",
            "Leave",
          ].map((status) => (
            <span key={status}>
              <i className={getStatusClass(status)} />
              {status}
            </span>
          ))}
        </div>
      </div>

      {/* SELECTED DAY DETAILS */}
      <aside className="attendance-selected-day">
        <h4>Daily Attendance Details</h4>

        <p>{formatDate(selectedDate)}</p>

        {selectedRecord ? (
          <>
            <span
              className={`attendance-status-badge ${getStatusClass(
                selectedRecord.status
              )}`}
            >
              {selectedRecord.status}
            </span>

            <div className="attendance-detail-line">
              <span>Check In</span>
              <strong>
                {formatTime(selectedRecord.checkIn)}
              </strong>
            </div>

            <div className="attendance-detail-line">
              <span>Check Out</span>
              <strong>
                {formatTime(selectedRecord.checkOut)}
              </strong>
            </div>

            <div className="attendance-detail-line">
              <span>Working Hours</span>
              <strong>{selectedRecord.hours}</strong>
            </div>

            <div className="attendance-detail-line">
              <span>Break Time</span>
              <strong>{selectedRecord.break}</strong>
            </div>
          </>
        ) : (
          <div className="attendance-day-empty">
            <FiCalendar />
            <span>No attendance record for this date.</span>
          </div>
        )}
      </aside>
    </div>
  );
};

export default AttendanceCalendar;
