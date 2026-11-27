import axios from "axios";

/* =========================================================
   GEOAPIFY AXIOS CLIENT
========================================================= */

const geoapifyClient = axios.create({
  baseURL: "https://api.geoapify.com/v1/geocode",
  timeout: 10000,
});

/* =========================================================
   API KEY
========================================================= */

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("Geoapify API key is missing.");
  }

  return apiKey;
};

/* =========================================================
   REMOVE DUPLICATE LOCATIONS
========================================================= */

const removeDuplicateLocations = (locations) => {
  const uniqueLocations = new Map();

  locations.forEach((location) => {
    const key =
      location.place_id ||
      `${location.lat}_${location.lon}_${location.formatted}`;

    if (!uniqueLocations.has(key)) {
      uniqueLocations.set(key, location);
    }
  });

  return Array.from(uniqueLocations.values());
};

/* =========================================================
   AUTOCOMPLETE API
========================================================= */

export const autocompleteLocations = async (query, signal) => {
  const text = query?.trim();

  if (!text || text.length < 3) {
    return [];
  }

  const response = await geoapifyClient.get("/autocomplete", {
    params: {
      text,
      format: "json",
      limit: 20,
      apiKey: getApiKey(),
    },
    signal,
  });

  return response.data?.results || [];
};

/* =========================================================
   GEOCODING API
========================================================= */

export const geocodeAddress = async (query, signal) => {
  const text = query?.trim();

  if (!text || text.length < 3) {
    return [];
  }

  const response = await geoapifyClient.get("/search", {
    params: {
      text,
      format: "json",
      limit: 20,
      apiKey: getApiKey(),
    },
    signal,
  });

  return response.data?.results || [];
};

/* =========================================================
   COMBINED LOCATION SEARCH
========================================================= */

export const searchLocations = async (query, signal) => {
  const text = query?.trim();

  if (!text || text.length < 3) {
    return [];
  }

  const [autocompleteResult, geocodingResult] =
    await Promise.allSettled([
      autocompleteLocations(text, signal),
      geocodeAddress(text, signal),
    ]);

  if (signal?.aborted) {
    throw new axios.CanceledError("Location search cancelled");
  }

  const autocompleteResults =
    autocompleteResult.status === "fulfilled"
      ? autocompleteResult.value
      : [];

  const geocodingResults =
    geocodingResult.status === "fulfilled"
      ? geocodingResult.value
      : [];

  if (
    autocompleteResult.status === "rejected" &&
    geocodingResult.status === "rejected"
  ) {
    throw autocompleteResult.reason;
  }

  /* Combine all available results */

  const combinedResults = removeDuplicateLocations([
    ...geocodingResults,
    ...autocompleteResults,
  ]);

  /* Debugging */

  console.log("Search Query:", text);

  console.log(
    "Autocomplete Results:",
    autocompleteResults
  );

  console.log(
    "Geocoding Results:",
    geocodingResults
  );

  console.log(
    "Total Unique Locations:",
    combinedResults.length
  );

  /* Return all results without frontend restriction */

  return combinedResults;
};

/* =========================================================
   REVERSE GEOCODING API
========================================================= */

export const reverseGeocode = async (
  latitude,
  longitude,
  signal
) => {
  const response = await geoapifyClient.get("/reverse", {
    params: {
      lat: latitude,
      lon: longitude,
      format: "json",
      limit: 1,
      apiKey: getApiKey(),
    },
    signal,
  });

  return response.data?.results?.[0] || null;
};