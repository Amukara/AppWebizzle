"use client";

import { useEffect, useRef } from "react";
import { GoogleMap, addMarker, addPolyline } from "./GoogleMap";
import { Store, MapPin, Bike } from "lucide-react";
import { DEFAULT_CENTER } from "@/lib/maps";
import type { OrderTracking } from "@/lib/types";

type Props = {
  tracking: OrderTracking;
  className?: string;
};

export function RiderTrackingMap({ tracking, className }: Props) {
  const vendor = tracking.map?.vendor ?? null;
  const customer = tracking.map?.customer ?? null;
  const rider = tracking.map?.rider ?? null;

  const vendorMarker = useRef<google.maps.Marker | null>(null);
  const customerMarker = useRef<google.maps.Marker | null>(null);
  const riderMarker = useRef<google.maps.Marker | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);

  // Determine map bounds center: prefer midpoint of vendor+customer, else vendor.
  const center =
    vendor && customer
      ? { lat: (vendor.lat + customer.lat) / 2, lng: (vendor.lng + customer.lng) / 2 }
      : vendor ?? DEFAULT_CENTER;

  const onReady = (map: google.maps.Map) => {
    // Vendor pin
    if (vendor) {
      if (!vendorMarker.current) {
        vendorMarker.current = addMarker(map, {
          position: { lat: vendor.lat, lng: vendor.lng },
          title: vendor.name,
          emoji: vendor.emoji || "🏪",
          color: "#0B7A4F",
        });
      } else {
        vendorMarker.current.setPosition({ lat: vendor.lat, lng: vendor.lng });
      }
    }
    // Customer pin
    if (customer) {
      if (!customerMarker.current) {
        customerMarker.current = addMarker(map, {
          position: { lat: customer.lat, lng: customer.lng },
          title: "Your delivery address",
          emoji: "🏠",
          color: "#F4A623",
        });
      } else {
        customerMarker.current.setPosition({ lat: customer.lat, lng: customer.lng });
      }
    }
    // Route line vendor → customer
    if (vendor && customer) {
      if (lineRef.current) lineRef.current.setMap(null);
      lineRef.current = addPolyline(
        map,
        [
          { lat: vendor.lat, lng: vendor.lng },
          { lat: customer.lat, lng: customer.lng },
        ],
        "#0B7A4F"
      );
    }
    // Rider pin (only when moving)
    if (rider) {
      if (!riderMarker.current) {
        riderMarker.current = addMarker(map, {
          position: { lat: rider.lat, lng: rider.lng },
          title: tracking.rider?.name ?? "Your rider",
          emoji: "🛵",
          color: "#4CB04F",
        });
      } else {
        riderMarker.current.setPosition({ lat: rider.lat, lng: rider.lng });
      }
    }
    // Fit bounds to include all points.
    if (vendor && customer) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend({ lat: vendor.lat, lng: vendor.lng });
      bounds.extend({ lat: customer.lat, lng: customer.lng });
      if (rider) bounds.extend({ lat: rider.lat, lng: rider.lng });
      map.fitBounds(bounds, 60);
    }
  };

  return (
    <GoogleMap
      center={center}
      zoom={14}
      className={className ?? "h-48 w-full overflow-hidden rounded-xl"}
      onReady={onReady}
      deps={[
        vendor?.lat,
        vendor?.lng,
        customer?.lat,
        customer?.lng,
        rider?.lat,
        rider?.lng,
      ]}
      fallback={
        <FallbackTrackingMap
          vendor={vendor}
          customer={customer}
          rider={rider}
          distanceKm={tracking.map?.distanceKm ?? null}
          progressPct={tracking.progressPct}
          status={tracking.status}
        />
      }
    />
  );
}

// Styled SVG fallback showing the vendor → rider → customer journey as a
// path diagram with the rider at the right progress point.
function FallbackTrackingMap({
  vendor,
  customer,
  rider,
  distanceKm,
  progressPct,
  status,
}: {
  vendor: { lat: number; lng: number; name: string; emoji: string } | null;
  customer: { lat: number; lng: number } | null;
  rider: { lat: number; lng: number } | null;
  distanceKm: number | null;
  progressPct: number;
  status: string;
}) {
  const showRider = status === "DISPATCHED" || status === "DELIVERED";
  const riderX = 10 + (progressPct / 100) * 80; // 10% → 90%
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br from-brand-light/50 to-muted p-3">
      <svg viewBox="0 0 100 40" className="h-full w-full" preserveAspectRatio="none">
        <line
          x1="10" y1="30" x2="90" y2="30"
          stroke="#0B7A4F" strokeWidth="0.8" strokeDasharray="2,1.5" opacity="0.6"
        />
        <circle cx="10" cy="30" r="3.2" fill="#0B7A4F" stroke="#fff" strokeWidth="0.8" />
        <circle cx="90" cy="30" r="3.2" fill="#F4A623" stroke="#fff" strokeWidth="0.8" />
        {showRider && (
          <circle cx={riderX} cy="30" r="2.8" fill="#4CB04F" stroke="#fff" strokeWidth="0.8" />
        )}
      </svg>
      <div className="flex items-center justify-between px-1 text-[10px]">
        <span className="flex items-center gap-0.5 font-semibold text-brand">
          <Store size={10} /> {vendor?.emoji ?? "🏪"} Pickup
        </span>
        <span className="text-muted-foreground">
          {distanceKm !== null ? `${distanceKm} km` : ""}
        </span>
        <span className="flex items-center gap-0.5 font-semibold text-gold-dark">
          <MapPin size={10} /> Drop-off
        </span>
      </div>
      {showRider && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-mpesa/10 px-2 py-0.5 text-[10px] font-semibold text-mpesa">
          <Bike size={10} /> Rider en route · {progressPct}%
        </div>
      )}
      <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-muted-foreground">
        Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for the interactive map
      </p>
    </div>
  );
}
