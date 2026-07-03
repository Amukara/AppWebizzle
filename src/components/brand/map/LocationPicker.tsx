"use client";

import { useRef, useState } from "react";
import { GoogleMap, addMarker } from "./GoogleMap";
import { MapPin, Crosshair, CheckCircle2 } from "lucide-react";
import { DEFAULT_CENTER } from "@/lib/maps";
import { Button } from "@/components/ui/button";

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (coords: LatLng, address: string) => void;
  className?: string;
};

// Reverse-geocode coordinates → a human-readable address using the Maps
// Geocoder. Returns "" on any failure (best-effort).
function reverseGeocode(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) return resolve("");
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve("");
        }
      }
    );
  });
}

export function LocationPicker({ value, onChange, className }: Props) {
  // `value` is the source of truth for the pin position (controlled component).
  // We keep a local `address` only for the reverse-geocode display.
  const [address, setAddress] = useState("");
  const [resolving, setResolving] = useState(false);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const pin: LatLng | null = value;

  const placeMarker = (map: google.maps.Map, pos: LatLng) => {
    if (markerRef.current) {
      markerRef.current.setPosition(pos);
    } else {
      markerRef.current = addMarker(map, {
        position: pos,
        title: "Delivery location",
        color: "#0B7A4F",
      });
      markerRef.current.setDraggable(true);
      markerRef.current.addListener("dragend", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) handleSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });
    }
    map.panTo(pos);
  };

  const handleSelect = async (pos: LatLng) => {
    setResolving(true);
    const addr = await reverseGeocode(pos.lat, pos.lng);
    setAddress(addr);
    setResolving(false);
    onChange(pos, addr);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => handleSelect({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <MapPin size={14} className="text-brand" /> Delivery location on map
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={useMyLocation}
        >
          <Crosshair size={12} /> Use my location
        </Button>
      </div>
      <GoogleMap
        center={pin ?? DEFAULT_CENTER}
        zoom={pin ? 15 : 13}
        className="h-56 w-full overflow-hidden rounded-xl border border-border"
        onReady={(map) => {
          if (pin) placeMarker(map, pin);
          map.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) handleSelect({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          });
        }}
        deps={[pin?.lat, pin?.lng]}
        fallback={
          <FallbackPicker
            value={pin}
            onUseLocation={useMyLocation}
            address={address}
            resolving={resolving}
          />
        }
      />
      {pin && address && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-brand-light/50 p-2 text-xs text-foreground">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-brand" />
          <span>{resolving ? "Resolving address…" : address}</span>
        </div>
      )}
      {pin && !address && !resolving && (
        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted p-2 text-xs text-muted-foreground">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>
            Pin set at {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)} — enter a
            delivery address below to help your rider.
          </span>
        </div>
      )}
    </div>
  );
}

// Non-Google fallback: a static SVG map with a draggable-feeling pin picker.
function FallbackPicker({
  value,
  onUseLocation,
  address,
  resolving,
}: {
  value: LatLng | null;
  onUseLocation: () => void;
  address: string;
  resolving: boolean;
}) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-brand-light/60 to-muted">
      <MapPin size={28} className="text-brand" />
      <p className="px-6 text-center text-xs text-muted-foreground">
        {value
          ? `Pin at ${value.lat.toFixed(4)}, ${value.lng.toFixed(4)}`
          : "Tap “Use my location” to drop a pin."}
      </p>
      {address && (
        <p className="max-w-xs px-6 text-center text-xs text-foreground">
          {resolving ? "Resolving…" : address}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1"
        onClick={onUseLocation}
      >
        <Crosshair size={12} /> Use my location
      </Button>
    </div>
  );
}
