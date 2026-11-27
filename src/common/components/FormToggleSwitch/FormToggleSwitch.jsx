
import React from "react";
import { FiCheck, FiX } from "react-icons/fi";
import "./FormToggleSwitch.css";

function FormToggleSwitch({
  checked = false,
  onChange,
  label = "Toggle setting",
  disabled = false,
  id,
}) {
  return (
    <button
      id={id}
      type="button"
      className={`hrms-toggle-switch ${checked ? "active" : ""}`}
      onClick={() => onChange?.(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
    >
      <span className="hrms-toggle-switch-thumb">
        {checked ? <FiCheck /> : <FiX />}
      </span>
    </button>
  );
}

export default FormToggleSwitch;
