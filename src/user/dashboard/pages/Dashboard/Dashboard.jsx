
import {
    FiUsers,
    FiUserCheck,
    FiCalendar,
    FiUserPlus,
    FiArrowRight,
    FiClock,
    FiFileText,
    FiEdit3,
    FiDollarSign,
    FiBriefcase,
    FiBell,
} from "react-icons/fi";

import Chart from "react-apexcharts";
import "../Dashboard/Dashboard.css";

const stats = [
    {
        title: "Total Employees",
        value: "248",
        change: "7.3%",
        text: "vs last month",
        icon: FiUsers,
        type: "green",
    },
    {
        title: "On Leave Today",
        value: "12",
        change: "",
        text: "View details",
        icon: FiUserCheck,
        type: "purple",
    },
    {
        title: "Pending Approvals",
        value: "5",
        change: "",
        text: "View all",
        icon: FiClock,
        type: "orange",
    },
    {
        title: "New Joiners",
        value: "3",
        change: "",
        text: "This month",
        icon: FiUserPlus,
        type: "blue",
    },
];

const upcomingLeaves = [
    {
        name: "Priya Sharma",
        type: "Casual Leave",
        date: "26 Jun 2026",
        status: "Approved",
        initials: "PS",
    },
    {
        name: "Rohit Verma",
        type: "Sick Leave",
        date: "27 Jun 2026",
        status: "Pending",
        initials: "RV",
    },
    {
        name: "Sneha Patil",
        type: "Earned Leave",
        date: "30 Jun 2026",
        status: "Approved",
        initials: "SP",
    },
    {
        name: "Amit Kumar",
        type: "Casual Leave",
        date: "01 Jul 2026",
        status: "Approved",
        initials: "AK",
    },
];

const quickActions = [
    {
        label: "Apply Leave",
        icon: FiCalendar,
    },
    {
        label: "Mark Attendance",
        icon: FiUserCheck,
    },
    {
        label: "Raise Request",
        icon: FiEdit3,
    },
    {
        label: "View Payslip",
        icon: FiDollarSign,
    },
];

const attendanceOptions = {
    chart: {
        type: "donut",
        toolbar: {
            show: false,
        },
        fontFamily: "inherit",
    },
    labels: ["Present", "Absent", "Late", "Half Day"],
    colors: ["#55c7b3", "#f08b8b", "#f4c96b", "#70b8e8"],
    dataLabels: {
        enabled: false,
    },
    legend: {
        show: false,
    },
    stroke: {
        width: 2,
        colors: ["#ffffff"],
    },
    plotOptions: {
        pie: {
            expandOnClick: false,
            donut: {
                size: "72%",
                labels: {
                    show: true,
                    name: {
                        show: false,
                    },
                    value: {
                        show: false,
                    },
                    total: {
                        show: true,
                        label: "Present",
                        color: "#27313b",
                        fontSize: "12px",
                        fontWeight: 500,
                        formatter: () => "92%",
                    },
                },
            },
        },
    },
    tooltip: {
        theme: "light",
    },
};

const attendanceSeries = [228, 12, 6, 2];

function StatCard({ title, value, change, text, icon: Icon, type }) {
    return (
        <div className={`dashboard-stat-card1 stat-${type}`}>
            <div className="cards d-flex">
                <div
                    className="stat-card-top1"
                    style={{ marginRight: "30px", marginLeft: "10px" }}
                >
                    <div className={`stat-icon1 ${type}`}>
                        <Icon size={20} />
                    </div>
                </div>

                <div card-content>
                    <span className="stat-title1">{title}</span>

                    <div className="stat-value1">{value}</div>

                    <div className="stat-footer1">
                        {change && (
                            <span className="stat-change1">{change}</span>
                        )}

                        <span className="stat-description1">{text}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Dashboard() {
    return (
        <div className="dashboard-page1">

            {/* =================================================
                WELCOME HEADER
            ================================================= */}

            <div className="dashboard-welcome-header1">
                <div className="dashboard-welcome-content1">
                    <div className="welcome-title-row1">
                        <h1>Good Morning, Shubham!</h1>
                    </div>

                    <p>
                        Here's what's happening in your organization today.
                    </p>
                </div>

                <div className="dashboard-welcome-visual1">
                    <div className="welcome-date1">
                        <FiCalendar size={12} />
                        <span>Thu, 26 Jun 2026</span>
                    </div>

                    <div className="welcome-illustration1" aria-hidden="true">
                        <div className="illustration-person1">
                            <div className="person-head1" />
                            <div className="person-hair1" />
                            <div className="person-body1" />
                            <div className="person-arm1" />
                        </div>

                        <div className="illustration-laptop1" />

                        <div className="illustration-plant1">
                            <span />
                            <span />
                            <i />
                        </div>
                    </div>
                </div>
            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="dashboard-stat-grid1">
                {stats.map((stat) => (
                    <StatCard key={stat.title} {...stat} />
                ))}
            </div>

            {/* =================================================
                MAIN DASHBOARD ROW
            ================================================= */}

            <div className="dashboard-main-grid1">

                {/* Attendance Overview */}

                <div className="dashboard-card1 attendance-overview-card1">
                    <div className="dashboard-card-header1 compact-header1">
                        <h3>Attendance Overview</h3>

                        <button className="card-filter-btn1" type="button">
                            Today <FiCalendar size={12} />
                        </button>
                    </div>

                    <div className="attendance-overview-content1">
                        <div className="attendance-donut1">
                            <Chart
                                options={attendanceOptions}
                                series={attendanceSeries}
                                type="donut"
                                height={155}
                            />
                        </div>

                        <div className="attendance-summary1">
                            <div className="attendance-summary-item1">
                                <span className="attendance-dot1 present" />
                                <span>Present</span>
                                <strong>228</strong>
                            </div>

                            <div className="attendance-summary-item1">
                                <span className="attendance-dot1 absent" />
                                <span>Absent</span>
                                <strong>12</strong>
                            </div>

                            <div className="attendance-summary-item1">
                                <span className="attendance-dot1 late" />
                                <span>Late</span>
                                <strong>6</strong>
                            </div>

                            <div className="attendance-summary-item1">
                                <span className="attendance-dot1 half-day" />
                                <span>Half Day</span>
                                <strong>2</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Leave */}

                <div className="dashboard-card1 upcoming-leave-card1">
                    <div className="dashboard-card-header1 compact-header1">
                        <h3>Upcoming Leave</h3>

                        <button className="view-all-link1" type="button">
                            View all ?
                        </button>
                    </div>

                    <div className="leave-list1">
                        {upcomingLeaves.map((leave) => (
                            <div
                                className="leave-list-item1"
                                key={`${leave.name}-${leave.date}`}
                            >
                                <div className="leave-avatar1">
                                    {leave.initials}
                                </div>

                                <div className="leave-person1">
                                    <strong>{leave.name}</strong>

                                    <span>
                                        {leave.type} | {leave.date}
                                    </span>
                                </div>

                                <span
                                    className={`leave-status1 ${
                                        leave.status === "Pending"
                                            ? "pending"
                                            : "approved"
                                    }`}
                                >
                                    {leave.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}

                <div className="dashboard-card1 quick-actions-card1">
                    <div className="dashboard-card-header1 compact-header1">
                        <h3>Quick Actions</h3>
                    </div>

                    <div className="quick-actions-list1">
                        {quickActions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <button
                                    className="quick-action-btn1"
                                    type="button"
                                    key={action.label}
                                >
                                    <span className="quick-action-icon1">
                                        <Icon size={15} />
                                    </span>

                                    <span>{action.label}</span>

                                    <FiArrowRight
                                        className="quick-action-arrow1"
                                        size={14}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* =================================================
                OPTIONAL LOWER SUMMARY
            ================================================= */}

            <div className="dashboard-bottom-strip1">
                <div className="bottom-strip-item1">
                    <span className="bottom-strip-icon1">
                        <FiBell size={15} />
                    </span>

                    <div>
                        <strong>5 pending approvals</strong>
                        <span>Need your attention</span>
                    </div>
                </div>

                <div className="bottom-strip-item1">
                    <span className="bottom-strip-icon1">
                        <FiBriefcase size={15} />
                    </span>

                    <div>
                        <strong>3 new joiners</strong>
                        <span>Joining this month</span>
                    </div>
                </div>

                <div className="bottom-strip-item1">
                    <span className="bottom-strip-icon1">
                        <FiFileText size={15} />
                    </span>

                    <div>
                        <strong>12 leave requests</strong>
                        <span>Upcoming employee leaves</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
