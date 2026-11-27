
import { useEffect, useRef, useState } from "react";

import {
  FiShield,
  FiSun,
  FiMoon,
  FiGlobe,
  FiChevronRight,
  FiCheck,
  FiX,
} from "react-icons/fi";

import PageLoader from "../Loader/PageLoader";

import "./SettingsPanel.css";

const SettingsPanel = ({
  show,
  onClose,
  onAdminPanel,
  isAdmin = false,
}) => {
  const panelRef = useRef(null);

  const [isSwitching, setIsSwitching] = useState(false);

  /* =========================================================
     CLOSE ON OUTSIDE CLICK
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        show &&
        !isSwitching &&
        panelRef.current &&
        !panelRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [show, onClose, isSwitching]);

  /* =========================================================
     CLOSE ON ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        show &&
        !isSwitching
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [show, onClose, isSwitching]);

  /* =========================================================
     SWITCH WORKSPACE WITH REUSABLE LOADER
  ========================================================= */

  const handleSwitchWorkspace = async () => {
    if (isSwitching || !onAdminPanel) return;

    const targetWorkspace = isAdmin ? "user" : "admin";

    setIsSwitching(true);

    try {
      await onAdminPanel(targetWorkspace);
    } catch (error) {
      console.error("Workspace switching failed:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  /* =========================================================
     HIDE PANEL
  ========================================================= */

  if (!show && !isSwitching) {
    return null;
  }

  return (
    <>
      {/* REUSABLE PAGE LOADER */}

      {isSwitching && (
        <PageLoader
          fullScreen
          message={
            isAdmin
              ? "Switching to User Panel..."
              : "Switching to Admin Panel..."
          }
        />
      )}

      {/* SETTINGS BACKDROP */}

      <div
        className="settings-backdrop"
        onClick={isSwitching ? undefined : onClose}
      />

      {/* SETTINGS PANEL */}

      {show && (
        <div
          className="settings-panel"
          ref={panelRef}
          aria-busy={isSwitching}
        >
          {/* HEADER */}

          <div className="settings-header">
            <h3>Settings</h3>

            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              disabled={isSwitching}
              aria-label="Close settings"
            >
              <FiX size={17} />
            </button>
          </div>

          {/* SWITCH PANEL */}

          <button
            type="button"
            className="settings-workspace"
            onClick={handleSwitchWorkspace}
            disabled={isSwitching}
          >
            <div className="settings-item-icon">
              <FiShield size={18} />
            </div>

            <div className="settings-item-content">
              <span className="settings-item-title">
                {isAdmin
                  ? "Switch to User Panel"
                  : "Switch to Admin Panel"}
              </span>

              <span className="settings-item-subtitle">
                {isSwitching
                  ? "Preparing workspace..."
                  : "Switch workspace"}
              </span>
            </div>

            <FiChevronRight
              className="settings-item-arrow"
              size={17}
            />
          </button>

          <div className="settings-divider" />

          {/* THEME */}

          <div className="settings-section">
            <div className="settings-section-title">
              Theme
            </div>

            <div className="settings-section-subtitle">
              Choose your appearance
            </div>

            <div className="settings-theme-options">

              {/* LIGHT */}

              <button
                type="button"
                className="settings-theme-option active"
                disabled={isSwitching}
              >
                <div className="settings-theme-icon">
                  <FiSun size={17} />
                </div>

                <span>Light</span>

                <FiCheck
                  className="settings-theme-check"
                  size={15}
                />
              </button>

              {/* DARK */}

              <button
                type="button"
                className="settings-theme-option"
                disabled={isSwitching}
              >
                <div className="settings-theme-icon">
                  <FiMoon size={17} />
                </div>

                <span>Dark</span>
              </button>

            </div>
          </div>

          <div className="settings-divider" />

          {/* LANGUAGE */}

          <div className="settings-section settings-language-section">

            <div className="settings-section-title">
              Language
            </div>

            <div className="settings-section-subtitle">
              Choose your language
            </div>

            <button
              type="button"
              className="settings-language-option"
              disabled={isSwitching}
            >
              <div className="settings-language-left">
                <div className="settings-language-icon">
                  <FiGlobe size={17} />
                </div>

                <span>English</span>
              </div>

              <FiChevronRight size={17} />
            </button>

          </div>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
