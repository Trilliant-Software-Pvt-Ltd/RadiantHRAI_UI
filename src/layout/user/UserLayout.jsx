
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import PageTransition from "../../common/components/Animations/OverallPageTransition";
import Sidebar from "../../common/components/Sidebar/Sidebar";
import Header from "../../common/components/Header/Header";
import ModuleNav from "../../common/components/ModuleNav/ModuleNav";

import "../../layout/user/RadiantHRLayout.css";
import "../../common/components/Sidebar/Sidebar.css";
import "../../common/components/Header/Header.css";
import "../../common/components/ModuleNav/ModuleNav.css";

/* =========================================================
   DASHBOARD PATHS
========================================================= */

// Pages that should use dashboard-content styling
const DASHBOARD_PATHS = [
  "/dashboard",
  "/ess-onboarding",
];

/* =========================================================
   USER LAYOUT
========================================================= */

function UserLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const location = useLocation();

  /* =========================================================
     CHECK DASHBOARD PAGE
  ========================================================= */

  const isDashboardPage = DASHBOARD_PATHS.includes(
    location.pathname
  );

  return (
    <div className="hrms-layout">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="hrms-main">

        {/* =================================================
            HEADER
        ================================================== */}

        <Header
          setMobileOpen={setMobileOpen}
        />

        {/* =================================================
            MODULE NAV
        ================================================== */}

        <ModuleNav />

        {/* =================================================
            PAGE CONTENT WITH SMOOTH ANIMATION
        ================================================== */}

        <main
          className={`hrms-content ${
            isDashboardPage ? "dashboard-content" : ""
          }`}
        >
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>

      </div>

    </div>
  );
}

export default UserLayout;
