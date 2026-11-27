import React from "react";
import {
  FiArrowLeft,
  FiUsers,
  FiUser,
  FiFileText,
  FiBriefcase,
  FiMonitor,
  FiDollarSign,
  FiCheckCircle,
  FiBarChart2,
  FiPlus,
  FiDownload,
  FiSettings,
  FiClock,
  FiChevronRight,
  FiZap,
} from "react-icons/fi";

import "./EmpOnboardingDetails.css";

const ONBOARDING_STAGES = [
  { label: "Employee Profile", icon: FiUser },
  { label: "HR Formalities", icon: FiFileText },
  { label: "Manager Alignment", icon: FiUsers },
  { label: "IT Setup", icon: FiMonitor },
  { label: "Payroll Setup", icon: FiDollarSign },
  { label: "Completion", icon: FiCheckCircle },
];

const ONBOARDING_TASKS = [
  {
    title: "Employee Profile",
    description:
      "Review and complete employee personal and professional details",
    icon: FiUsers,
    color: "purple",
  },
  {
    title: "HR Formalities",
    description: "Verify documents and complete HR checklist",
    icon: FiFileText,
    color: "green",
  },
  {
    title: "Manager Alignment",
    description: "Confirm reporting manager and team details",
    icon: FiUsers,
    color: "blue",
  },
  {
    title: "IT Setup",
    description: "Approve IT access and asset allocation",
    icon: FiMonitor,
    color: "violet",
  },
  {
    title: "Payroll Setup",
    description: "Validate payroll details and statutory information",
    icon: FiDollarSign,
    color: "teal",
  },
  {
    title: "Employee Activation",
    description: "Confirm onboarding completion and activate employee",
    icon: FiCheckCircle,
    color: "lime",
  },
];

const ONBOARDING_FORM_MAP = {
  "Employee Profile": "personal",
  "HR Formalities": "emp-document",
  "Manager Alignment": "reporting-manager",
  "IT Setup": "assets-details",
  "Payroll Setup": "ctc",
};

function EmpOnboardingDetails({ employee, onBack, onOpenForm }) {
  const totalSteps = ONBOARDING_STAGES.length;

  // Existing employee progress is on a 0–7 scale.
  // Map it to the six stages displayed in this dashboard.
  const completedSteps = Math.min(
    totalSteps,
    Math.max(0, Number(employee?.progress) || 0),
  );

  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  const pendingCount = totalSteps - completedSteps;

  const joiningDate = employee?.joiningDate
    ? new Date(employee.joiningDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not specified";

  return (
    <div className="eod-page">
      {/* HEADER BANNER */}
      <section className="eod-banner">
        <div className="eod-banner-content">
          <button type="button" className="eod-back-button" onClick={onBack}>
            <FiArrowLeft />
            Back to Employees
          </button>

          <h1>Employee Onboarding</h1>
          <p>
            Track and manage onboarding progress for{" "}
            <strong>{employee?.name}</strong>.
          </p>

          <div className="eod-employee-info">
            {employee?.avatar ? (
              <img src={employee.avatar} alt={employee.name} />
            ) : (
              <div className="eod-avatar-fallback">
                <FiUser />
              </div>
            )}

            <div>
              <strong>{employee?.name}</strong>
              <span>
                {employee?.empId} · {employee?.designation}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ONBOARDING STAGES */}
      <section className="p-2">
        <div className="eod-stages">
          {ONBOARDING_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = index < completedSteps;
            const isCurrent = index === completedSteps;

            return (
              <div
                className={`eod-stage ${
                  isCompleted ? "completed" : ""
                } ${isCurrent ? "current" : ""}`}
                key={stage.label}
              >
                <div className="eod-stage-icon">
                  <StageIcon />
                  <span>{index + 1}</span>
                </div>
                <span className="eod-stage-label">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* MAIN DASHBOARD GRID */}
      <div className="eod-dashboard-grid">
        {/* LEFT COLUMN */}
        <div className="eod-main-column">
          {/* ONBOARDING TASKS */}
          <section className="eod-card eod-tasks-card">
            <div className="eod-card-heading">
              <div className="eod-heading-title">
                <span className="eod-heading-icon purple">
                  <FiUsers />
                </span>
                <h2>Onboarding Tasks</h2>
              </div>

              <span className="eod-task-count">
                {completedSteps} of {totalSteps} completed
              </span>
            </div>

            <div className="eod-task-list">
              {ONBOARDING_TASKS.map((task, index) => {
                const TaskIcon = task.icon;
                const isCompleted = index < completedSteps;

                return (
                  <div className="eod-task-row" key={task.title}>
                    <div className={`eod-task-icon ${task.color}`}>
                      <TaskIcon />
                    </div>

                    <div className="eod-task-description">
                      <strong>{task.title}</strong>
                      <span>{task.description}</span>
                    </div>

                    <div className="eod-task-status">
                      <strong>{isCompleted ? "1" : "0"}</strong>
                      <span>{isCompleted ? "Completed" : "Pending"}</span>
                    </div>

                    <div className="eod-task-overdue">
                      <strong>0</strong>
                      <span>Overdue</span>
                    </div>

                    <button
                      type="button"
                      className="eod-review-button"
                      disabled={!ONBOARDING_FORM_MAP[task.title]}
                      onClick={() => {
                        const formId = ONBOARDING_FORM_MAP[task.title];

                        if (formId) {
                          onOpenForm(formId);
                        }
                      }}
                    >
                      {isCompleted ? "View" : "Review"}
                      <FiChevronRight />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* NEW JOINERS + GREAT WORK */}
          <div className="eod-bottom-row">
            {/* NEW JOINERS */}
            <section className="eod-card eod-new-joiners-card">
              <div className="eod-card-heading">
                <div className="eod-heading-title">
                  <span className="eod-heading-icon purple">
                    <FiUsers />
                  </span>
                  <h2>New Joiners This Month</h2>
                </div>
              </div>

              <div className="eod-new-joiners-list">
                {[
                  {
                    name: "Ananya Sharma",
                    date: "18 Nov",
                    avatar: "/images/ess-onboarding/new-joiners/ananya.png",
                  },
                  {
                    name: "Rohit Kumar",
                    date: "19 Nov",
                    avatar: "/images/ess-onboarding/new-joiners/rohit.png",
                  },
                  {
                    name: "Sneha Iyer",
                    date: "20 Nov",
                    avatar: "/images/ess-onboarding/new-joiners/sneha.png",
                  },
                  {
                    name: "Vikram Singh",
                    date: "21 Nov",
                    avatar: "/images/ess-onboarding/new-joiners/vikram.png",
                  },
                ].map((person) => (
                  <div className="eod-new-joiner" key={person.name}>
                    <img
                      src={person.avatar}
                      alt={person.name}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        event.currentTarget.nextElementSibling.style.display =
                          "flex";
                      }}
                    />

                    <div className="eod-new-joiner-fallback">
                      {person.name.charAt(0)}
                    </div>

                    <div className="eod-new-joiner-info">
                      <strong>{person.name}</strong>
                      <span>Joining: {person.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* GREAT WORK */}
            <section className="eod-great-work-card">
              <div className="eod-trophy-illustration">🏆</div>

              <div className="eod-great-work-content">
                <strong>Great Work!</strong>
                <p>
                  You're helping new talent
                  <br />
                  start their journey with us.
                </p>
              </div>

              <span className="eod-confetti eod-confetti-one">✦</span>
              <span className="eod-confetti eod-confetti-two">✦</span>
              <span className="eod-confetti eod-confetti-three">✦</span>
            </section>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="eod-side-column">
          {/* OVERVIEW */}
          <section className="eod-card eod-overview-card">
            <div className="eod-card-heading">
              <div className="eod-heading-title">
                <span className="eod-heading-icon">
                  <FiBarChart2 />
                </span>
                <h2>Onboarding Overview</h2>
              </div>
            </div>

            <div className="eod-overview-content">
              <div
                className="eod-progress-ring"
                style={{
                  "--eod-progress": `${progressPercentage}%`,
                }}
              >
                <div className="eod-progress-inner">
                  <strong>{progressPercentage}%</strong>
                  <span>
                    Overall
                    <br />
                    Progress
                  </span>
                </div>
              </div>

              <div className="eod-progress-legend">
                <div>
                  <i className="completed-dot" />
                  <span>Completed</span>
                  <strong>{completedSteps}</strong>
                </div>
                <div>
                  <i className="pending-dot" />
                  <span>Pending</span>
                  <strong>{pendingCount}</strong>
                </div>
                <div>
                  <i className="overdue-dot" />
                  <span>Overdue</span>
                  <strong>0</strong>
                </div>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="eod-card eod-quick-card">
            <div className="eod-card-heading">
              <div className="eod-heading-title">
                <span className="eod-heading-icon yellow">
                  <FiZap />
                </span>
                <h2>Quick Actions</h2>
              </div>
            </div>

            <div className="eod-quick-actions">
              <button type="button">
                <FiPlus />
                <span>Create New Onboarding</span>
                <FiChevronRight />
              </button>
              <button type="button">
                <FiCheckCircle />
                <span>View Pending Approvals</span>
                <FiChevronRight />
              </button>
              <button type="button">
                <FiDownload />
                <span>Download Reports</span>
                <FiChevronRight />
              </button>
              <button type="button">
                <FiSettings />
                <span>Onboarding Settings</span>
                <FiChevronRight />
              </button>
            </div>
          </section>

          {/* RECENT ACTIVITY */}
          <section className="eod-card eod-activity-card">
            <div className="eod-card-heading">
              <div className="eod-heading-title">
                <span className="eod-heading-icon">
                  <FiClock />
                </span>
                <h2>Recent Activity</h2>
              </div>
            </div>

            <div className="eod-activity-list">
              <div className="eod-activity-item">
                <span className="eod-activity-avatar">
                  {employee?.name?.charAt(0)?.toUpperCase() || "E"}
                </span>
                <div>
                  <strong>{employee?.name}</strong>
                  <span>Employee onboarding record</span>
                  <small>{joiningDate}</small>
                </div>
              </div>

              <div className="eod-activity-item">
                <span className="eod-activity-avatar">HR</span>
                <div>
                  <strong>Onboarding progress</strong>
                  <span>
                    {completedSteps} of {totalSteps} stages completed
                  </span>
                  <small>Current progress</small>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default EmpOnboardingDetails;
