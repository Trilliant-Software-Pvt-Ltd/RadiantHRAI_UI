import React, { useEffect, useRef, useState } from "react";
import { FiSearch, FiMapPin, FiX, FiLoader } from "react-icons/fi";

import { searchLocations } from "../../services/geoapifyService";

import "./LocationSearch.css";

const LocationSearch = ({ onLocationSelect }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const selectedRef = useRef(false);

  /* =====================================================
     SEARCH LOCATIONS WITH DEBOUNCE
  ===================================================== */

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current = false;
      return;
    }

    if (query.trim().length < 3) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    setLoading(true);
    setError("");
    setSuggestions([]);

    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(
          query,
          controller.signal
        );

        if (controller.signal.aborted) return;

        setSuggestions(results);
        setActiveIndex(-1);
      } catch (err) {
        if (controller.signal.aborted) return;

        setSuggestions([]);

        setError(
          err.response?.status === 429
            ? "Too many requests. Please try again shortly."
            : "Unable to search locations."
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /* =====================================================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ===================================================== */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* =====================================================
     SELECT LOCATION
  ===================================================== */

  const handleSelect = (location) => {
    selectedRef.current = location.formatted !== query;

    setQuery(location.formatted || "");
    setSuggestions([]);
    setIsOpen(false);
    setLoading(false);
    setActiveIndex(-1);
    setError("");

    onLocationSelect?.(location);
  };

  /* =====================================================
     CLEAR SEARCH
  ===================================================== */

  const handleClear = () => {
    selectedRef.current = false;

    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setLoading(false);
    setError("");
    setActiveIndex(-1);
  };

  /* =====================================================
     KEYBOARD NAVIGATION
  ===================================================== */

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((previous) =>
        Math.min(previous + 1, suggestions.length - 1)
      );
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((previous) =>
        Math.max(previous - 1, 0)
      );
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (isOpen && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      }
    }
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div
      className="site-location-search"
      ref={containerRef}
    >
      <div className="site-location-search-input">

        <FiSearch className="site-location-search-icon" />

        <input
          type="text"
          value={query}
          placeholder="Search address, city or location..."
          autoComplete="off"
          aria-label="Search location"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {loading && (
          <FiLoader className="site-location-search-loader" />
        )}

        {query && (
          <button
            type="button"
            className="site-location-search-clear"
            onClick={handleClear}
            aria-label="Clear location search"
          >
            <FiX />
          </button>
        )}
      </div>

      {isOpen && query.trim().length >= 3 && (
        <div className="site-location-suggestions">

          {loading ? (
            <div className="site-location-search-message">
              Searching locations...
            </div>
          ) : error ? (
            <div className="site-location-search-message site-location-search-error">
              {error}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="site-location-search-message">
              No matching locations found.
            </div>
          ) : (
            <>
              <div className="site-location-suggestions-heading">
                Suggested Locations
              </div>

              {suggestions.map((location, index) => (
                <button
                  type="button"
                  key={location.place_id || index}
                  className={`site-location-suggestion ${
                    activeIndex === index ? "active" : ""
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(location)}
                >
                  <span className="site-location-pin">
                    <FiMapPin />
                  </span>

                  <span className="site-location-suggestion-text">
                    <strong>
                      {location.address_line1 ||
                        location.name ||
                        location.formatted}
                    </strong>

                    {location.address_line2 && (
                      <small>{location.address_line2}</small>
                    )}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;