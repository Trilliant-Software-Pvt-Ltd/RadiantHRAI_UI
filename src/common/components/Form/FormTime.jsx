import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

function FormTime({
  label,
  name,
  value = "",
  onChange,
  required = false,
  disabled = false,
  error = "",
  min,
  max,
  step = 60,
  placeholder = "Select time",
}) {
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const popupRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);

  const parseTime = (time) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;

    const [h, m] = time.split(":").map(Number);
    if (h > 23 || m > 59) return null;

    return { hour: h, minute: m };
  };

  const current = parseTime(value);

  const initialHour = current ? current.hour % 12 || 12 : 9;

  const initialMinute = current ? current.minute : 0;
  const initialPeriod = current && current.hour >= 12 ? "PM" : "AM";

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  const minValue = parseTime(min);
  const maxValue = parseTime(max);

  const to24Hour = (hour, period) => {
    if (period === "AM") return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  };

  const formatValue = (hour, minute, period) => {
    const h = to24Hour(hour, period);

    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const formatDisplay = (time) => {
    if (!time) return "";

    const parsed = parseTime(time);
    if (!parsed) return time;

    const hour = parsed.hour % 12 || 12;
    const period = parsed.hour >= 12 ? "PM" : "AM";

    return `${String(hour).padStart(2, "0")}:${String(parsed.minute).padStart(
      2,
      "0",
    )} ${period}`;
  };

  const isValidTime = (hour, minute, period) => {
    const h = to24Hour(hour, period);
    const total = h * 60 + minute;

    const minTotal = minValue ? minValue.hour * 60 + minValue.minute : null;

    const maxTotal = maxValue ? maxValue.hour * 60 + maxValue.minute : null;

    if (minTotal !== null && total < minTotal) return false;
    if (maxTotal !== null && total > maxTotal) return false;

    return true;
  };

  const minuteStep = Math.max(1, Math.ceil(Number(step || 60) / 60));

  const minuteOptions = useMemo(() => {
    const options = [];

    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.push(minute);
    }

    return options;
  }, [minuteStep]);

  const updateValue = (hour, minute, period) => {
    if (!isValidTime(hour, minute, period)) return;

    onChange?.({
      target: {
        name,
        value: formatValue(hour, minute, period),
      },
    });
  };

  useEffect(() => {
    if (!current) return;

    setSelectedHour(current.hour % 12 || 12);
    setSelectedMinute(current.minute);
    setSelectedPeriod(current.hour >= 12 ? "PM" : "AM");
  }, [value]);

  const updatePosition = () => {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const popupWidth = Math.min(170, window.innerWidth - 24);
    const popupHeight = 200;

    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < popupHeight && rect.top > popupHeight;

    let left = rect.left;
    let top = openAbove ? rect.top - popupHeight - 5 : rect.bottom + 5;

    if (left + popupWidth > window.innerWidth - 12) {
      left = window.innerWidth - popupWidth - 12;
    }

    left = Math.max(12, left);

    if (top + popupHeight > window.innerHeight - 12) {
      top = window.innerHeight - popupHeight - 12;
    }

    setPosition({
      top: Math.max(12, top),
      left,
      width: popupWidth,
    });
  };

  const openPicker = () => {
    if (disabled) return;

    if (current) {
      setSelectedHour(current.hour % 12 || 12);
      setSelectedMinute(current.minute);
      setSelectedPeriod(current.hour >= 12 ? "PM" : "AM");
    }

    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current?.contains(event.target) ||
        popupRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const handleHour = (hour) => {
    if (!isValidTime(hour, selectedMinute, selectedPeriod)) return;

    setSelectedHour(hour);
    updateValue(hour, selectedMinute, selectedPeriod);
  };

  const handleMinute = (minute) => {
    if (!isValidTime(selectedHour, minute, selectedPeriod)) return;

    setSelectedMinute(minute);
    updateValue(selectedHour, minute, selectedPeriod);
  };

  const handlePeriod = (period) => {
    if (!isValidTime(selectedHour, selectedMinute, period)) return;

    setSelectedPeriod(period);
    updateValue(selectedHour, selectedMinute, period);
  };

  return (
    <div
      className={`hrms-form-group hrms-time-picker-wrapper ${
        isOpen ? "is-open" : ""
      }`}
      ref={wrapperRef}
    >
      {label && (
        <label className="hrms-form-label" htmlFor={name}>
          {label}
          {required && <span className="hrms-required">*</span>}
        </label>
      )}

      <div className="hrms-time-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          id={name}
          name={name}
          className={`hrms-form-control hrms-time-control ${
            error ? "hrms-form-control-error" : ""
          }`}
          value={formatDisplay(value)}
          placeholder={placeholder}
          readOnly
          onClick={openPicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          autoComplete="off"
        />

        <button
          type="button"
          className="hrms-time-picker-icon"
          onClick={openPicker}
          disabled={disabled}
          tabIndex={-1}
          aria-label="Open time picker"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
      </div>

      {error && <span className="hrms-form-error">{error}</span>}

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={popupRef}
            className="hrms-time-picker-popup"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            role="dialog"
            aria-label="Choose time"
          >
            <div className="hrms-time-picker-columns">
              {/* HOURS */}
              <div className="hrms-time-picker-column">
                <div className="hrms-time-picker-options">
                  {Array.from({ length: 12 }, (_, index) => {
                    const hour = index + 1;
                    const valid = isValidTime(
                      hour,
                      selectedMinute,
                      selectedPeriod,
                    );

                    return (
                      <button
                        key={hour}
                        type="button"
                        className={`hrms-time-picker-option ${
                          selectedHour === hour ? "is-selected" : ""
                        }`}
                        disabled={!valid}
                        onClick={() => handleHour(hour)}
                      >
                        {String(hour).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MINUTES */}
              <div className="hrms-time-picker-column">
                <div className="hrms-time-picker-options">
                  {minuteOptions.map((minute) => {
                    const valid = isValidTime(
                      selectedHour,
                      minute,
                      selectedPeriod,
                    );

                    return (
                      <button
                        key={minute}
                        type="button"
                        className={`hrms-time-picker-option ${
                          selectedMinute === minute ? "is-selected" : ""
                        }`}
                        disabled={!valid}
                        onClick={() => handleMinute(minute)}
                      >
                        {String(minute).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM / PM */}
              <div className="hrms-time-picker-column hrms-time-period-column">
                <div className="hrms-time-picker-options">
                  {["AM", "PM"].map((period) => {
                    const valid = isValidTime(
                      selectedHour,
                      selectedMinute,
                      period,
                    );

                    return (
                      <button
                        key={period}
                        type="button"
                        className={`hrms-time-picker-option ${
                          selectedPeriod === period ? "is-selected" : ""
                        }`}
                        disabled={!valid}
                        onClick={() => handlePeriod(period)}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export default FormTime;
