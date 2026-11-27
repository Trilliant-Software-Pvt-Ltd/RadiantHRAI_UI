
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiBriefcase,
  FiUsers,
  FiMonitor,
  FiDollarSign,
  FiCheckCircle,
  FiChevronRight,
  FiCalendar,
  FiSmile,
  FiZap,
  FiArrowRight,
  FiEdit2,
} from "react-icons/fi";

import "./ESSOnboardingDashboard.css";

import EmployeeDetails from "../../../onboarding/components/Form/EmployeeDetails/EmployeeDetails";
import ReportingManager from "../../../onboarding/components/Form/ReportingManager/ReportingManager";
import StatutoryDetails from "../../../onboarding/components/Form/Statutory/Statutory";
import CTCDetails from "../../../onboarding/components/Form/CTCDetails/CTCDetails";
import AssetsDetails from "../../../onboarding/components/Form/AssetsDetails/AssetsDetails";
import AttendanceDetails from "../../../onboarding/components/Form/AttendanceDetails/AttendanceDetails";
import EmpDocument from "../../../onboarding/components/Form/EmployeeDocument/EmpDocument";

// =====================================================
// GET LOGGED-IN EMPLOYEE
// =====================================================

const getLoggedInEmployee = () => {
  let storedUser = {};
  let authData = {};

try {
  storedUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  authData = JSON.parse(sessionStorage.getItem("auth") || "{}");
} catch (error) {
  console.error("Unable to read logged-in employee details:", error);
}

  // Support user data stored inside auth as well.
  const user = Object.keys(storedUser).length
    ? storedUser
    : authData?.user || {};

  const employeeId =
    user?.EmployeeID ||
    user?.employeeId ||
    user?.empId ||
    sessionStorage.getItem("employeeId") ||
    "";

  const employeeName =
    user?.EmployeeName ||
    user?.employeeName ||
    user?.name ||
    user?.Name ||
    "Employee";

  return {
    ...user,

    // Common employee ID properties used by existing forms.
    id: user?.id || employeeId,
    empId: employeeId,
    employeeId: employeeId,
    EmployeeID: employeeId,

    // Common employee name properties.
    name: employeeName,
    EmployeeName: employeeName,

    // Preserve source information where available.
    sourceID:
      user?.sourceID ||
      user?.SourceID ||
      sessionStorage.getItem("sourceID") ||
      "",

    designation:
      user?.designation ||
      user?.Designation ||
      user?.designationName ||
      "",
  };
};

// =====================================================
// ONBOARDING STEPS
// =====================================================

const onboardingSteps = [
  {
    id: 1,
    label: (
      <>
        Welcome
        <br />
        &amp; Profile
      </>
    ),
    icon: <FiUser />,
    status: "active",
  },
  {
    id: 2,
    label: (
      <>
        HR
        <br />
        Formalities
      </>
    ),
    icon: <FiBriefcase />,
    status: "upcoming",
  },
  {
    id: 3,
    label: (
      <>
        Manager
        <br />
        Alignment
      </>
    ),
    icon: <FiUsers />,
    status: "upcoming",
  },
  {
    id: 4,
    label: <>IT Setup</>,
    icon: <FiMonitor />,
    status: "upcoming",
  },
  {
    id: 5,
    label: (
      <>
        Payroll
        <br />
        Setup
      </>
    ),
    icon: <FiDollarSign />,
    status: "upcoming",
  },
  {
    id: 6,
    label: <>You're All Set!</>,
    icon: <FiCheckCircle />,
    status: "upcoming",
  },
];

// =====================================================
// ONBOARDING JOURNEY TASKS
// =====================================================

const journeyTasks = [
  {
    id: 1,
    title: "Update Your Personal Information",
    description: "Keep your profile up to date",
    action: "View",
    completed: true,
    route: "/ess-onboarding/employee-information",
  },
  {
    id: 2,
    title: "Complete HR Documents",
    description: "Share required documents",
    action: "Start",
    completed: false,
    route: "/ess-onboarding/documents",
  },
  {
    id: 3,
    title: "Set Your Preferences",
    description: "Choose language, timezone & more",
    action: "Start",
    completed: false,
    route: "/ess-onboarding/preferences",
  },
];

// =====================================================
// TIMELINE
// =====================================================

const timelineItems = [
  {
    id: 1,
    title: "Today",
    description: "Complete your profile and HR formalities",
    status: "current",
  },
  {
    id: 2,
    title: "Tomorrow",
    description: "Manager alignment & team introduction",
    status: "upcoming",
  },
  {
    id: 3,
    title: "Next Week",
    description: "IT setup & system access",
    status: "upcoming",
  },
  {
    id: 4,
    title: "Final Step",
    description: "Payroll setup & welcome kit",
    status: "upcoming",
  },
];

// =====================================================
// QUICK ACCESS
// =====================================================

const quickAccessItems = [
  {
    id: 1,
    title: "HR",
    subtitle: "Activities",
    description: "Documents, Policies, Declarations",
    icon: <FiUsers />,
    color: "purple",
    formId: "statutory",
  },
  {
    id: 2,
    title: "Manager",
    subtitle: "Activities",
    description: "Team Setup, Goals, Approval",
    icon: <FiUser />,
    color: "blue",
    formId: "reporting-manager",
  },
  {
    id: 3,
    title: "IT",
    subtitle: "Activities",
    description: "Access, Tools, Device Setup",
    icon: <FiMonitor />,
    color: "green",
    formId: "assets-details",
  },
  {
    id: 4,
    title: "Payroll",
    subtitle: "Activities",
    description: "Salary, Benefits, Tax Info",
    icon: <FiDollarSign />,
    color: "orange",
    formId: "ctc",
  },
  {
    id: 5,
    title: "Employee",
    subtitle: "Activities",
    description: "Attendance, Leave, Self Service",
    icon: <FiBriefcase />,
    color: "teal",
    formId: "attendance-details",
  },
];

// =====================================================
// COMPONENT
// =====================================================

function ESSOnboardingDashboard() {
  const [isProfileImageLoaded, setIsProfileImageLoaded] = useState(true);

  // Currently selected Quick Access form.
  const [activeForm, setActiveForm] = useState(null);

  // Get the currently logged-in employee.
  const [loggedInEmployee] = useState(getLoggedInEmployee);

  const navigate = useNavigate();

  const employeeName =
    loggedInEmployee?.name || "Employee";

  // ===================================================
// JOURNEY TASK CLICK
// ===================================================

const handleTaskClick = (route) => {
  if (route === "/ess-onboarding/employee-information") {
    setActiveForm("personal");
  } else if (route === "/ess-onboarding/documents") {
    setActiveForm("documents");
  } else {
    console.info(
      "Onboarding section will be available soon:",
      route
    );
  }
};

  // ===================================================
  // OPEN QUICK ACCESS FORM
  // ===================================================

  const handleQuickAccessClick = (formId) => {
    setActiveForm(formId);
  };

  // ===================================================
  // BACK TO ESS DASHBOARD
  // ===================================================

  const handleBackToDashboard = () => {
    setActiveForm(null);
  };

  // ===================================================
  // RENDER SELECTED EXISTING FORM
  // ===================================================

  const renderActiveForm = () => {
    const commonProps = {
      employee: loggedInEmployee,
      onBackToList: handleBackToDashboard,
    };

    switch (activeForm) {
      case "documents":
        return <EmpDocument {...commonProps} />;

      case "personal":
        return <EmployeeDetails {...commonProps} />;

      case "statutory":
        return <StatutoryDetails {...commonProps} />;

      case "reporting-manager":
        return <ReportingManager {...commonProps} />;

      case "assets-details":
        return <AssetsDetails {...commonProps} />;

      case "ctc":
        return <CTCDetails {...commonProps} />;

      case "attendance-details":
        return <AttendanceDetails {...commonProps} />;

      default:
        return null;
    }
  };

  // ===================================================
  // SHOW SELECTED FORM
  // ===================================================

  if (activeForm) {
    return (
      <div className="ess-onboarding-page">
        {renderActiveForm()}
      </div>
    );
  }

  // ===================================================
  // ESS ONBOARDING DASHBOARD
  // ===================================================

  return (
    <div className="ess-onboarding-page">

      {/* WELCOME BANNER */}

      <section className="ess-welcome-banner">
        <div className="ess-welcome-profile">
          <div className="ess-profile-image-wrap">
            {isProfileImageLoaded ? (
              <img
                src="/images/user.jpg"
                alt="Employee profile"
                onError={() => setIsProfileImageLoaded(false)}
              />
            ) : (
              <div className="ess-profile-fallback">
                <FiUser />
              </div>
            )}

            <button
              type="button"
              className="ess-profile-edit"
              aria-label="Edit profile"
              onClick={() =>
                navigate("/ess-onboarding/employee-information")
              }
            >
              <FiEdit2 />
            </button>
          </div>
        </div>

        <div className="ess-welcome-content">
          <h1>
            Hello {employeeName}! <span>👋</span>
          </h1>

          <p>
            Welcome to RadiantHR! Let's complete your onboarding
            <br className="ess-desktop-break" />
            steps and get you ready for an amazing journey ahead.
          </p>

          <div className="ess-overall-progress">
            <strong>Overall Progress</strong>

            <div className="ess-progress-track">
              <span style={{ width: "20%" }} />
            </div>

            <strong>20%</strong>
          </div>
        </div>

        <div className="ess-welcome-tagline">
          Grow · Belong · Thrive
          <span />
        </div>
      </section>

      {/* ONBOARDING STEP TRACKER */}

      <section
        className="ess-step-tracker"
        aria-label="Onboarding progress"
      >
        {onboardingSteps.map((step) => (
          <div
            className={`ess-step-item ${step.status}`}
            key={step.id}
          >
            <div className="ess-step-circle">
              {step.icon}
              <small>{step.id}</small>
            </div>

            <div className="ess-step-label">
              {step.label}
            </div>
          </div>
        ))}
      </section>

      {/* MAIN DASHBOARD CONTENT */}

      <div className="ess-dashboard-content">

        {/* LEFT CONTENT */}

        <div className="ess-dashboard-left">

          {/* ONBOARDING JOURNEY */}

          <section className="ess-journey-card">
            <div className="ess-journey-heading">
              <div className="ess-heading-number">1</div>

              <div className="ess-journey-heading-text">
                <h2>Your Onboarding Journey</h2>
                <p>
                  Complete the following tasks to move to the next step.
                </p>
              </div>

              <span className="ess-step-count">
                Step 1 of 6
              </span>
            </div>

            <div className="ess-journey-body">

              {/* ILLUSTRATION */}

              <div className="ess-journey-illustration">
                <img
                  src="/images/onboarding-illustration.png"
                  alt="Employee onboarding illustration"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* TASK LIST */}

              <div className="ess-task-list">
                {journeyTasks.map((task) => (
                  <div
                    className="ess-task-row"
                    key={task.id}
                  >
                    <div
                      className={`ess-task-check ${
                        task.completed ? "completed" : ""
                      }`}
                    >
                      {task.completed && <FiCheckCircle />}
                    </div>

                    <div className="ess-task-info">
                      <strong>{task.title}</strong>
                      <span>{task.description}</span>
                    </div>

                    <button
                      type="button"
                      className={`ess-task-action ${
                        task.completed ? "view" : ""
                      }`}
                      onClick={() => handleTaskClick(task.route)}
                    >
                      {task.action}
                      {task.completed && <FiChevronRight />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* QUICK ACCESS */}

          <section className="ess-quick-access">
            <div className="ess-quick-heading">
              <FiZap />
              <h2>Quick Access</h2>
            </div>

            <div className="ess-quick-grid">
              {quickAccessItems.map((item) => (
                <button
                  type="button"
                  className={`ess-quick-card ${item.color}`}
                  key={item.id}
                  onClick={() =>
                    handleQuickAccessClick(item.formId)
                  }
                >
                  <div className="ess-quick-icon">
                    {item.icon}
                  </div>

                  <div className="ess-quick-info">
                    <strong>
                      {item.title}
                      <span>{item.subtitle}</span>
                    </strong>

                    <small>{item.description}</small>
                  </div>

                  <span className="ess-quick-arrow">
                    <FiArrowRight />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT TIMELINE */}

        <aside className="ess-dashboard-right">
          <section className="ess-timeline-card">

            <div className="ess-timeline-heading">
              <FiCalendar />
              <h2>Your Onboarding Timeline</h2>
            </div>

            <div className="ess-timeline-list">
              {timelineItems.map((item) => (
                <div
                  className={`ess-timeline-item ${item.status}`}
                  key={item.id}
                >
                  <span className="ess-timeline-dot" />

                  <div className="ess-timeline-info">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* HELP CARD */}

            <div className="ess-help-card">
              <div className="ess-help-icon">
                <FiSmile />
              </div>

              <div>
                <strong>Need Help?</strong>
                <p>Our team is here for you!</p>

                <button
                  type="button"
                  onClick={() =>
                    (window.location.href =
                      "mailto:hr@radianthr.com")
                  }
                >
                  Contact HR <FiArrowRight />
                </button>
              </div>
            </div>

          </section>
        </aside>
      </div>
    </div>
  );
}

export default ESSOnboardingDashboard;
