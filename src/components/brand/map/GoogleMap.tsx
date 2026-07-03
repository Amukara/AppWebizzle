"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Map as MapIcon } from "lucide-react";

// The Maps JS API key is safe to expose client-side — Google's JS API is
// designed for browser use and is protected via HTTP-referrer restrictions in
// the Google Cloud console. Read from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

let loaderPromise: Promise<typeof google> | null = null;
function loadMaps(): Promise<typeof google> | null {
  if (!API_KEY) return null;
  if (typeof window === "undefined") return null;
  if (!loaderPromise) {
    loaderPromise = new Loader({
      apiKey: API_KEY,
      version: "weekly",
      libraries: ["marker", "geometry"],
    }).load();
  }
  return loaderPromise;
}

type Props = {
  onReady?: (map: google.maps.Map) => void;
  center: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  fallback?: ReactNode;
  deps?: unknown[];
};

export function GoogleMap({
  onReady,
  center,
  zoom = 14,
  className,
  fallback,
  deps = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    API_KEY ? "loading" : "fallback"
  );

  useEffect(() => {
    if (!API_KEY || !containerRef.current) return;
    let cancelled = false;
    loadMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        } else {
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(zoom);
        }
        setStatus("ready");
        onReady?.(mapRef.current);
      })
      .catch(() => setStatus("fallback"));
    return () => {
      cancelled = true;
    };
  }, [center.lat, center.lng, zoom, ...deps]);

  if (status === "fallback" || !API_KEY) {
    return (
      <div className={className}>
        {fallback ?? <DefaultFallback center={center} />}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className ?? "h-full w-full"}
      style={{ background: "#e8eef0" }}
    />
  );
}

function DefaultFallback({ center }: { center: { lat: number; lng: number } }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-light/60 to-muted text-center">
      <MapIcon className="text-brand" size={28} />
      <p className="px-6 text-sm font-semibold text-foreground">
        Interactive map unavailable
      </p>
      <p className="max-w-xs px-6 text-xs text-muted-foreground">
        Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable Google Maps.
        Showing coordinates instead:
      </p>
      <p className="font-mono text-xs text-muted-foreground">
        {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
      </p>
    </div>
  );
}

// ---- marker helpers ----

export function addMarker(
  map: google.maps.Map,
  opts: {
    position: { lat: number; lng: number };
    title?: string;
    emoji?: string;
    color?: string;
  }
): google.maps.Marker {
  const google = window.google;
  const isAdvanced =
    google.maps.marker && google.maps.marker.AdvancedMarkerElement;
  if (isAdvanced) {
    const pin = new google.maps.PinElement({
      background: opts.color ?? "#0B7A4F",
      borderColor: "#fff",
      glyph: opts.emoji
        ? (() => {
            const span = document.createElement("span");
            span.textContent = opts.emoji;
            span.style.fontSize = "18px";
            return span;
          })()
        : undefined,
    });
    return new google.maps.marker.AdvancedMarkerElement({
      map,
      position: opts.position,
      title: opts.title ?? "",
      content: pin.element,
    }) as unknown as google.maps.Marker;
  }
  return new google.maps.Marker({
    map,
    position: opts.position,
    title: opts.title ?? "",
  });
}

export function addPolyline(
  map: google.maps.Map,
  path: { lat: number; lng: number }[],
  color = "#0B7A4F"
): google.maps.Polyline {
  return new google.maps.Polyline({
    map,
    path,
    strokeColor: color,
    strokeWeight: 4,
    strokeOpacity: 0.8,
    geodesic: true,
  });
}

export { API_KEY as GOOGLE_MAPS_API_KEY };
