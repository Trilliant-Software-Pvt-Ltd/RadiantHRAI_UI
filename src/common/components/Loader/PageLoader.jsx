
import React from "react";
import "./PageLoader.css";

const PageLoader = ({
  message = "Loading page content...",
  fullScreen = false,
}) => {
  return (
    <div
      className={`hrms-page-loader ${
        fullScreen ? "hrms-loader-fullscreen" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="hrms-loader-content">
        <div className="hrms-loader-symbol">
          <div className="hrms-loader-ring" />

          <div className="hrms-loader-center">
            R
          </div>
        </div>

        <h3 className="hrms-loader-title">
          Radiant<span>HR</span>
        </h3>

        <p className="hrms-loader-message">
          {message}
        </p>

        <div className="hrms-loader-progress">
          <div className="hrms-loader-progress-bar" />
        </div>
      </div>
    </div>
  );
};

export default PageLoader;
