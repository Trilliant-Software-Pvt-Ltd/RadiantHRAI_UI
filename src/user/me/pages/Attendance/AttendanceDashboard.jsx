import React, { useMemo, useState } from "react";

import {
  FiCalendar,
  FiClock,
  FiLogIn,
  FiLogOut,
  FiMapPin,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
  FiHome,
  FiFileText,
  FiCoffee,
  FiUsers,
  FiUser,
  FiBriefcase,
  FiCalendar as FiCalendarOff,
  FiSun,
} from "react-icons/fi";

import WFHRequest from "../../components/Forms/Attendance/WFHRequest";
import LeaveRequestForm from "../../components/Forms/Leave/LeaveRequestForm";
import PunchMissingRequest from "../../components/Forms/Attendance/PunchMissingRequest";
import AttendanceRegularizationForm from "../../components/Forms/Attendance/AttendanceRegularization";

import AttendanceLog from "../../components/AttendanceDashboard/AttendanceLog";
import AttendanceCalendar from "../../components/AttendanceDashboard/AttendanceCalendar";
import AttendanceRequests from "../../components/AttendanceDashboard/AttendanceRequests";

import "./AttendanceDashboard.css";

/* =========================================================
   CONSTANTS
========================================================= */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FULL_WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* =========================================================
   DATE HELPERS
========================================================= */

const makeDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   GENERATE CURRENT WEEK DYNAMICALLY
========================================================= */

const getCurrentWeekTimings = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = makeDateKey(today);

  const monday = new Date(today);
  const dayOffset = (today.getDay() + 6) % 7;

  monday.setDate(today.getDate() - dayOffset);

  const timings = [
    { working: "08h 45m", break: "01h 00m" },
    { working: "09h 10m", break: "01h 00m" },
    { working: "08h 30m", break: "00h 45m" },
    { working: "09h 00m", break: "01h 00m" },
    { working: "08h 50m", break: "01h 00m" },
    { working: "-", break: "-" },
    { working: "-", break: "-" },
  ];

  return WEEKDAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const dateKey = makeDateKey(date);

    let status;

    if (dateKey === todayKey) {
      status = "Today";
    } else if (index >= 5) {
      status = "Week Off";
    } else if (date < today) {
      status = "Present";
    } else {
      status = "Normal";
    }

    return {
      id: day,
      day: FULL_WEEKDAYS[index],
      date: String(date.getDate()),
      dateKey,
      working: date > today ? "-" : timings[index].working,
      break: date > today ? "-" : timings[index].break,
      status,
    };
  });
};

/* =========================================================
   SAMPLE ATTENDANCE RECORDS
========================================================= */

const sampleRecords = [
  {
    date: "2026-10-01",
    checkIn: "09:05",
    checkOut: "18:20",
    status: "Present",
    hours: "09:15",
    break: "01:00",
  },
  {
    date: "2026-10-02",
    checkIn: "09:25",
    checkOut: "18:30",
    status: "Late",
    hours: "09:05",
    break: "01:00",
  },
  {
    date: "2026-10-05",
    checkIn: "08:55",
    checkOut: "18:15",
    status: "Present",
    hours: "09:20",
    break: "01:00",
  },
  {
    date: "2026-10-06",
    checkIn: "09:00",
    checkOut: "18:00",
    status: "Present",
    hours: "09:00",
    break: "01:00",
  },
  {
    date: "2026-10-07",
    checkIn: "09:15",
    checkOut: "13:30",
    status: "Half Day",
    hours: "04:15",
    break: "00:15",
  },
  {
    date: "2026-10-08",
    checkIn: "-",
    checkOut: "-",
    status: "Absent",
    hours: "00:00",
    break: "00:00",
  },
  {
    date: "2026-10-09",
    checkIn: "09:10",
    checkOut: "18:25",
    status: "Present",
    hours: "09:15",
    break: "01:00",
  },
  {
    date: "2026-10-12",
    checkIn: "08:58",
    checkOut: "18:05",
    status: "Present",
    hours: "09:07",
    break: "01:00",
  },
  {
    date: "2026-10-13",
    checkIn: "09:18",
    checkOut: "18:10",
    status: "Late",
    hours: "08:52",
    break: "01:00",
  },
  {
    date: "2026-10-14",
    checkIn: "09:02",
    checkOut: "18:12",
    status: "Present",
    hours: "09:10",
    break: "01:00",
  },
  {
    date: "2026-10-15",
    checkIn: "09:00",
    checkOut: "18:00",
    status: "Present",
    hours: "09:00",
    break: "01:00",
  },
  {
    date: "2026-10-16",
    checkIn: "09:12",
    checkOut: "18:15",
    status: "Present",
    hours: "09:03",
    break: "01:00",
  },
];

/* =========================================================
   STATS DATA
========================================================= */

const statsData = {
  "Last Week": {
    mine: {
      present: "05",
      absent: "00",
      average: "08h 48m",
      onTime: "80%",
      late: "01",
    },
    team: {
      present: "42",
      absent: "03",
      average: "08h 35m",
      onTime: "86%",
      late: "06",
    },
  },

  "This Week": {
    mine: {
      present: "03",
      absent: "00",
      average: "08h 48m",
      onTime: "100%",
      late: "00",
    },
    team: {
      present: "38",
      absent: "02",
      average: "08h 42m",
      onTime: "91%",
      late: "04",
    },
  },

  "This Month": {
    mine: {
      present: "12",
      absent: "01",
      average: "08h 58m",
      onTime: "83%",
      late: "02",
    },
    team: {
      present: "176",
      absent: "08",
      average: "08h 40m",
      onTime: "88%",
      late: "14",
    },
  },
};

/* =========================================================
   ATTENDANCE STATUS HELPERS
========================================================= */

const getStatusClass = (status) => {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  const statusMap = {
    present: "present",
    late: "late",
    absent: "absent",
    halfday: "half-day",
    leave: "leave",
    onleave: "leave",
    weekoff: "week-off",
    weeklyoff: "week-off",
    today: "today",
    holiday: "holiday",
    pending: "pending",
    normal: "normal",
  };

  return statusMap[normalized] || "";
};

/* =========================================================
   WEEKLY ATTENDANCE HELPERS
========================================================= */

const getWeekStatus = (day) => {
  return getStatusClass(day.status) || "unmarked";
};

const getWeekStatusLabel = (status) => {
  const labels = {
    present: "Present",
    absent: "Absent",
    late: "Late",
    "half-day": "Half Day",
    leave: "Leave",
    "week-off": "Week Off",
    today: "Today",
    holiday: "Holiday",
    unmarked: "No Record",
    normal: "",
  };

  return labels[status] ?? "No Record";
};

/* =========================================================
   WEEKLY STATUS MESSAGES
========================================================= */

const weekMessages = {
  "week-off": {
    title: "Enjoy your day off!",
    description:
      "This is your scheduled weekly off. No working hours are expected.",
    icon: <FiCalendarOff />,
  },

  absent: {
    title: "No attendance recorded",
    description: "There are no working hours recorded for this day.",
    icon: <FiAlertCircle />,
  },

  leave: {
    title: "Leave day",
    description: "You are marked as on leave for this day.",
    icon: <FiCalendar />,
  },

  holiday: {
    title: "Public holiday",
    description: "No regular shift is scheduled for this day.",
    icon: <FiSun />,
  },

  unmarked: {
    title: "No attendance record",
    description: "Attendance details are not available for this day.",
    icon: <FiCalendar />,
  },
};

/* =========================================================
   ATTENDANCE DASHBOARD
========================================================= */

function Attendance() {
  /* STATS STATE */

  const [statsPeriod, setStatsPeriod] = useState("Last Week");
  const [statsType, setStatsType] = useState("mine");

  /* CALENDAR STATE */

  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [selectedDate, setSelectedDate] = useState(() =>
    makeDateKey(new Date()),
  );

  /* TABS STATE */

  const [activeTab, setActiveTab] = useState("log");

  /* WEEKLY TIMINGS STATE */

  const [selectedWeekday, setSelectedWeekday] = useState(() => {
    return WEEKDAYS[(new Date().getDay() + 6) % 7];
  });

  /* RECORDS AND REQUESTS */

  const [records, setRecords] = useState(sampleRecords);
  const [requests, setRequests] = useState([]);

  /* ATTENDANCE ACTIONS */

  const [isClockedIn, setIsClockedIn] = useState(true);
  const [showWfhForm, setShowWfhForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showPunchMissing, setShowPunchMissing] = useState(false);
  const [showRegularizeForm, setShowRegularizeForm] = useState(false);
  const [selectedRegularizeRecord, setSelectedRegularizeRecord] =
    useState(null);

  /* FILTERS */

  const [filterStatus, setFilterStatus] = useState("All");
  const [show24Hour, setShow24Hour] = useState(false);

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const selectedStats = statsData[statsPeriod][statsType];

  const weekTimings = useMemo(() => getCurrentWeekTimings(), []);

  /* =========================================================
     FORMAT TIME
  ========================================================= */

  const formatTime = (time) => {
    if (!time || time === "-") return "-";

    const [hours, minutes] = time.split(":").map(Number);

    if (show24Hour) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0",
      )}`;
    }

    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${String(displayHour).padStart(
      2,
      "0",
    )}:${String(minutes).padStart(2, "0")} ${suffix}`;
  };

  /* =========================================================
     REQUEST HANDLERS
  ========================================================= */

  const handleAddWfhRequest = (request) => {
    setRequests((previous) => [request, ...previous]);

    setShowWfhForm(false);
    setActiveTab("requests");
  };

  const handleAddPunchMissingRequest = (request) => {
    setRequests((previous) => [request, ...previous]);

    setShowPunchMissing(false);
    setActiveTab("requests");
  };

  const handleOpenRegularizeForm = (record) => {
    setSelectedRegularizeRecord(record);
    setShowRegularizeForm(true);
  };
  /* =========================================================
     CLOCK OUT
  ========================================================= */

  const handleClockOut = () => {
    setIsClockedIn(false);
  };

  /* =========================================================
     STATS CARDS
  ========================================================= */

  const statsCards = [
    {
      label: "Present Days",
      value: selectedStats.present,
      icon: <FiCheckCircle />,
      color: "green",
    },
    {
      label: "Absent Days",
      value: selectedStats.absent,
      icon: <FiAlertCircle />,
      color: "red",
    },
    {
      label: "Average Hours / Day",
      value: selectedStats.average,
      icon: <FiClock />,
      color: "blue",
    },
    {
      label: "On-time Arrival",
      value: selectedStats.onTime,
      icon: <FiLogIn />,
      color: "orange",
    },
  ];

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="attendance-page">
      {/* =====================================================
          1. ATTENDANCE STATS
      ===================================================== */}

      <section className="attendance-section">
        <div className="attendance-section-heading">
          <div>
            <h3>Attendance Stats</h3>
            <p>Attendance overview and performance summary.</p>
          </div>

          <select
            className="attendance-select attendance-period-select"
            value={statsPeriod}
            onChange={(event) => setStatsPeriod(event.target.value)}
          >
            <option>Last Week</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>

        <div className="d-flex justify-content-between attendance-stats-top-row">
          <div className="attendance-stats-switch">
            <button
              className={statsType === "mine" ? "active" : ""}
              onClick={() => setStatsType("mine")}
            >
              <FiUser /> My Stats
            </button>

            <button
              className={statsType === "team" ? "active" : ""}
              onClick={() => setStatsType("team")}
            >
              <FiUsers /> My Team Stats
            </button>
          </div>

          <div className="attendance-stats">
            <span>
              <FiClock /> Late arrivals
            </span>

            <strong>{selectedStats.late}</strong>
          </div>
        </div>

        <div className="attendance-stats-grid">
          {statsCards.map((item) => (
            <div className="attendance-stat-card" key={item.label}>
              <div className={`attendance-stat-icon ${item.color}`}>
                {item.icon}
              </div>

              <div className="attendance-stat-content">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{statsPeriod}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          2. TIMINGS + ACTIONS
      ===================================================== */}

      <div className="attendance-middle-grid">
        {/* WEEKLY TIMINGS */}

        <section className="attendance-section attendance-timings-section">
          <div className="attendance-section-heading">
            <div>
              <h3>Timings</h3>
              <p>Your weekly attendance and work duration.</p>
            </div>

            <span className="attendance-week-label">
              <FiCalendar /> This Week
            </span>
          </div>

          {/* WEEK STRIP */}

          <div className="attendance-week-strip">
            {weekTimings.map((day) => {
              const status = getWeekStatus(day);

              return (
                <button
                  key={day.id}
                  type="button"
                  aria-pressed={selectedWeekday === day.id}
                  aria-label={`${day.day}, ${day.date}: ${
                    getWeekStatusLabel(status) || "No status"
                  }`}
                  title={`${day.day} - ${
                    getWeekStatusLabel(status) || "No status"
                  }`}
                  className={`attendance-week-day status-${status} ${
                    selectedWeekday === day.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedWeekday(day.id)}
                >
                  <span className="attendance-week-day-name">{day.id}</span>

                  <strong>{day.date}</strong>

                  <span className="attendance-week-status">
                    {status !== "normal" && (
                      <>
                        <i />
                        <span>{getWeekStatusLabel(status)}</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SELECTED DAY DETAILS */}

          {weekTimings
            .filter((day) => day.id === selectedWeekday)
            .map((day) => {
              const status = getWeekStatus(day);

              const isNonWorkingDay = Object.prototype.hasOwnProperty.call(
                weekMessages,
                status,
              );

              return (
                <div className="attendance-timing-details" key={day.id}>
                  <div className="attendance-timing-title">
                    <strong>{day.day}</strong>

                    <span className={`attendance-detail-status ${status}`}>
                      {getWeekStatusLabel(status)}
                    </span>
                  </div>

                  {isNonWorkingDay ? (
                    <div className={`attendance-day-message ${status}`}>
                      <span className="attendance-day-message-icon">
                        {weekMessages[status].icon}
                      </span>

                      <div>
                        <strong>{weekMessages[status].title}</strong>

                        <p>{weekMessages[status].description}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="attendance-timing-metrics">
                      <div>
                        <span>
                          <FiClock /> Working Hours
                        </span>

                        <strong>{day.working || "—"}</strong>
                      </div>

                      <div>
                        <span>
                          <FiCoffee /> Break Time
                        </span>

                        <strong>{day.break || "—"}</strong>
                      </div>

                      <div>
                        <span>
                          <FiBriefcase /> Shift Duration
                        </span>

                        <strong>{day.shiftDuration || "09h 00m"}</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {/* SHIFT INFORMATION */}

          <div className="attendance-shift-info">
            <div>
              <span>Shift Timing</span>

              <strong>
                {formatTime("09:00")} - {formatTime("18:00")}
              </strong>
            </div>

            <div>
              <span>Location</span>

              <strong>
                <FiMapPin /> Office
              </strong>
            </div>
          </div>
        </section>

        {/* ATTENDANCE ACTIONS */}

        <section className="attendance-section attendance-actions-section">
          <div className="attendance-section-heading">
            <div>
              <h3>Actions</h3>
              <p>Quick access to attendance actions.</p>
            </div>
          </div>

          <div className="attendance-clock-card">
            <div className="attendance-clock-status">
              <span
                className={isClockedIn ? "status-online" : "status-offline"}
              />

              {isClockedIn ? "Currently Clocked In" : "Clocked Out"}
            </div>

            <div className="attendance-clock-time">{formatTime("09:00")}</div>

            <p>Today's attendance</p>

            <button
              className="attendance-clock-out-btn"
              onClick={handleClockOut}
              disabled={!isClockedIn}
            >
              <FiLogOut /> Check Out
            </button>
          </div>

          <div className="attendance-action-list">
            {/* WORK FROM HOME */}

            <button type="button" onClick={() => setShowWfhForm(true)}>
              <span className="attendance-action-icon blue">
                <FiHome />
              </span>

              <span>
                <strong>Work From Home</strong>
                <small>Submit a WFH request</small>
              </span>

              <FiChevronRight />
            </button>

            {/* PUNCH MISSING */}

            <button type="button" onClick={() => setShowPunchMissing(true)}>
              <span className="attendance-action-icon orange">
                <FiClock />
              </span>

              <span>
                <strong>Punch Missing</strong>
                <small>Request missing punch</small>
              </span>

              <FiChevronRight />
            </button>

            {/* ATTENDANCE POLICY */}

            <button type="button" disabled>
              <span className="attendance-action-icon purple">
                <FiFileText />
              </span>

              <span>
                <strong>Attendance Policy</strong>
                <small>View attendance rules</small>
              </span>

              <FiChevronRight />
            </button>
          </div>
        </section>
      </div>

      {/* =====================================================
          3. LOGS & REQUESTS
      ===================================================== */}

      <section className="attendance-section attendance-records-section">
        <div className="attendance-section-heading attendance-records-heading">
          <div>
            <h3>Logs & Requests</h3>
            <p>Manage your attendance records and requests.</p>
          </div>
        </div>

        {/* TABS */}

        <div className="attendance-tabs">
          <button
            className={activeTab === "log" ? "active" : ""}
            onClick={() => setActiveTab("log")}
          >
            Attendance Log
          </button>

          <button
            className={activeTab === "calendar" ? "active" : ""}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar
          </button>

          <button
            className={activeTab === "requests" ? "active" : ""}
            onClick={() => setActiveTab("requests")}
          >
            Attendance Requests
            {requests.length > 0 && (
              <span className="attendance-request-count">
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* ATTENDANCE LOG COMPONENT */}

        {activeTab === "log" && (
          <AttendanceLog
            records={records}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            formatDate={formatDate}
            formatTime={formatTime}
            getStatusClass={getStatusClass}
            onOpenWfhForm={() => setShowWfhForm(true)}
            onOpenPunchMissingForm={() => setShowPunchMissing(true)}
            onOpenLeaveForm={() => setShowLeaveForm(true)}
            onOpenRegularizeForm={handleOpenRegularizeForm}
          />
        )}

        {/* ATTENDANCE CALENDAR COMPONENT */}

        {activeTab === "calendar" && (
          <AttendanceCalendar
            records={records}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            formatDate={formatDate}
            formatTime={formatTime}
            getStatusClass={getStatusClass}
            show24Hour={show24Hour}
          />
        )}

        {/* ATTENDANCE REQUESTS COMPONENT */}

        {activeTab === "requests" && (
          <AttendanceRequests requests={requests} formatDate={formatDate} />
        )}
      </section>

      {/* =====================================================
          4. WFH REQUEST FORM
      ===================================================== */}

      <WFHRequest
        show={showWfhForm}
        onClose={() => setShowWfhForm(false)}
        onSubmit={handleAddWfhRequest}
        employeeOptions={[]}
      />

      {/* =====================================================
          5. PUNCH MISSING REQUEST FORM
      ===================================================== */}

      <PunchMissingRequest
        show={showPunchMissing}
        onClose={() => setShowPunchMissing(false)}
        onSubmit={handleAddPunchMissingRequest}
      />

      {/* LEAVE REQUEST FORM */}

      <LeaveRequestForm
        show={showLeaveForm}
        onClose={() => setShowLeaveForm(false)}
        onSubmit={(request) => {
          setRequests((previous) => [request, ...previous]);
          setShowLeaveForm(false);
          setActiveTab("requests");
        }}
      />

      {/* ATTENDANCE REGULARIZATION FORM */}

      <AttendanceRegularizationForm
        show={showRegularizeForm}
        onClose={() => {
          setShowRegularizeForm(false);
          setSelectedRegularizeRecord(null);
        }}
        record={selectedRegularizeRecord}
        onSubmit={(request) => {
          setRequests((previous) => [request, ...previous]);
          setShowRegularizeForm(false);
          setSelectedRegularizeRecord(null);
          setActiveTab("requests");
        }}
      />
    </div>
  );
}

export default Attendance;
