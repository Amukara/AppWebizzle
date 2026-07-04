"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LocationStatus =
  | "idle"        // haven't asked yet
  | "prompting"   // currently waiting for getCurrentPosition
  | "granted"     // we have coords
  | "denied"      // user said no (or browser blocked)
  | "unavailable"; // geolocation API not supported

export type LocationState = {
  status: LocationStatus;
  coords: { lat: number; lng: number } | null;
  error: string | null;
};

const LOCATION_SESSION_KEY = "wb_location_prompted";

/**
 * Custom hook that wraps the browser Geolocation API.
 *
 * • `requestLocation()` — triggers the browser permission prompt.
 * • Persists "already prompted" in sessionStorage so we only nag once
 *   per session when the user explicitly dismisses.
 * • If the user previously granted access (and we still have a cached
 *   coord pair in localStorage via the customer profile), we auto-set
 *   to "granted" on mount.
 */
export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    status: "idle",
    coords: null,
    error: null,
  });
  const promptedRef = useRef(false);

  // On mount, check if the customer profile already has saved coords
  // (from a previous order checkout). If so, skip prompting entirely.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const profileRaw = window.localStorage.getItem("wb_customer_profile");
      if (profileRaw) {
        const p = JSON.parse(profileRaw);
        if (typeof p.lat === "number" && typeof p.lng === "number") {
          setState({ status: "granted", coords: { lat: p.lat, lng: p.lng }, error: null });
          return;
        }
      }
    } catch { /* ignore */ }

    // Also check if we already prompted this session and user dismissed
    try {
      if (sessionStorage.getItem(LOCATION_SESSION_KEY) === "dismissed") {
        setState((s) => ({ ...s, status: "denied", error: "Location was previously declined this session." }));
      }
    } catch { /* ignore */ }
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setState({ status: "unavailable", coords: null, error: "Geolocation is not supported by your browser." });
      return;
    }

    setState((s) => ({ ...s, status: "prompting", error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setState({ status: "granted", coords, error: null });
        promptedRef.current = true;
      },
      (err) => {
        let msg = "Could not get your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access was denied. You can enable it in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable. Please try again.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        setState({ status: "denied", coords: null, error: msg });
        promptedRef.current = true;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 } // cache for 5 min
    );
  }, []);

  const dismiss = useCallback(() => {
    // Remember that user dismissed this session
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(LOCATION_SESSION_KEY, "dismissed");
      }
    } catch { /* ignore */ }
    setState((s) => ({ ...s, status: "denied", error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ status: "idle", coords: null, error: null });
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(LOCATION_SESSION_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  return { ...state, requestLocation, dismiss, reset };
}