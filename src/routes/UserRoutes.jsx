import { Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import UserLayout from "../layout/user/UserLayout";

import WelcomeBoard from "../user/onboarding/pages/WelcomeBoard/WelcomeBoard";

import AttendanceDashboard from "../user/me/pages/Attendance/AttendanceDashboard";
import LeaveDashboard from "../user/me/pages/Leave/LeaveDashboard";
import Dashboard from "../user/dashboard/pages/Dashboard/Dashboard";
import ESSOnboardingDashboard from "../user/ESSOnboarding/pages/Dashboard/ESSOnboardingDashboard";

// =====================================================
// USER PAGES
// =====================================================

const Preboarding = () => (
  <div>
    <h1>Preboarding</h1>
    <p>Preboarding page</p>
  </div>
);

const BlockSuspend = () => (
  <div>
    <h1>Block or Suspend</h1>
    <p>Block or Suspend page</p>
  </div>
);

const ReassignLeads = () => (
  <div>
    <h1>Reassign Leads</h1>
    <p>Reassign Leads page</p>
  </div>
);

const InactiveEmployees = () => (
  <div>
    <h1>Inactive Employees</h1>
    <p>Inactive Employees page</p>
  </div>
);

const ExecutiveOverview = () => (
  <div>
    <h1>Executive Overview</h1>
    <p>Executive Overview page</p>
  </div>
);

const Payroll = () => (
  <div>
    <h1>Payroll</h1>
    <p>Payroll page</p>
  </div>
);

// =====================================================
// USER ROUTES
// =====================================================

const UserRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["User"]}>
        <UserLayout />
      </ProtectedRoute>
    }
  >
    {/* GLOBAL DASHBOARD */}
    <Route path="/dashboard" element={<Dashboard />} />

    {/* PREBOARDING */}
    <Route path="/preboarding" element={<Preboarding />} />

    {/* ONBOARDING / OPERATION */}
    {/* <Route
            path="/operation/onboarding"
            element={<OnboardingDashboard />}
        /> */}

    <Route
      path="/operation/onboarding/welcome-board"
      element={<WelcomeBoard />}
    />

    <Route
      path="/operation/onboarding/block-suspend"
      element={<BlockSuspend />}
    />

    <Route
      path="/operation/onboarding/reassign-leads"
      element={<ReassignLeads />}
    />

    <Route
      path="/operation/onboarding/inactive-employees"
      element={<InactiveEmployees />}
    />

    {/* ME */}
    <Route path="/me" element={<AttendanceDashboard />} />

    <Route path="/me/leave" element={<LeaveDashboard />} />

    {/* EXECUTIVE OVERVIEW */}
    <Route path="/executive-overview" element={<ExecutiveOverview />} />

    {/* PAYROLL */}
    <Route path="/payroll" element={<Payroll />} />

    {/* ESS ONBOARDING */}

    <Route path="/ess-onboarding" element={<ESSOnboardingDashboard />} />
  </Route>
);

export default UserRoutes;
