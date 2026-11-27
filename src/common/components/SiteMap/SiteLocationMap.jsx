import React, { useEffect, useMemo } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import LocationSearch from "./LocationSearch";

/* =========================================================
   CUSTOM MARKER ICON
========================================================= */

const customIcon = new L.Icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* =========================================================
   COORDINATE VALIDATION
========================================================= */

const getCoordinate = (value, fallback, min, max) => {
  if (value == null || String(value).trim() === "") {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) &&
    number >= min &&
    number <= max
    ? number
    : fallback;
};

/* =========================================================
   MAP UPDATER
========================================================= */

const MapUpdater = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);

  return null;
};

/* =========================================================
   MAP CLICK EVENTS
========================================================= */

const MapEvents = ({ onLocationChange }) => {
  useMapEvents({
    click(event) {
      onLocationChange?.(
        event.latlng.lat.toFixed(6),
        event.latlng.lng.toFixed(6)
      );
    },
  });

  return null;
};

/* =========================================================
   MAIN MAP COMPONENT
========================================================= */

const SiteLocationMap = ({
  latitude,
  longitude,
  radius,
  siteName,
  onLocationChange,
  onLocationSelect,
}) => {
  const position = useMemo(
    () => [
      getCoordinate(latitude, 18.5590, -90, 90),
      getCoordinate(longitude, 73.7868, -180, 180),
    ],
    [latitude, longitude]
  );

  /* =======================================================
     MARKER DRAG
  ======================================================= */

  const handleDragEnd = (event) => {
    const point = event.target.getLatLng();

    onLocationChange?.(
      point.lat.toFixed(6),
      point.lng.toFixed(6)
    );
  };

  /* =======================================================
     SEARCH LOCATION SELECT
  ======================================================= */

  const handleSearchSelect = (location) => {
    const lat = Number(location.lat);
    const lng = Number(location.lon);

    if (
      location.lat == null ||
      location.lon == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return;
    }

    if (onLocationSelect) {
      onLocationSelect(location);
    } else {
      onLocationChange?.(
        lat.toFixed(6),
        lng.toFixed(6)
      );
    }
  };

  return (
    <div className="site-map-container">

      {/* LOCATION SEARCH */}

      <LocationSearch
        onLocationSelect={handleSearchSelect}
      />

      {/* EXISTING LEAFLET MAP */}

      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapUpdater position={position} />

        <MapEvents
          onLocationChange={onLocationChange}
        />

        <Circle
          center={position}
          radius={Number(radius) || 200}
          pathOptions={{
            color: "#3978db",
            fillColor: "#5b8def",
            fillOpacity: 0.2,
            weight: 2,
          }}
        />

        <Marker
          position={position}
          icon={customIcon}
          draggable
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        />
      </MapContainer>

      {/* EXISTING SITE LABEL */}

      <div className="site-map-label">
        <strong>{siteName || "Site Location"}</strong>
        <small>Drag marker to adjust location</small>
      </div>
    </div>
  );
};

export default SiteLocationMap;