// Lightweight client-side persistence for the customer's profile.
// Saved to localStorage so the app "always remembers" returning customers —
// their name, phone, delivery location, and map pin are pre-filled at
// checkout and the phone is shared across referrals/receipts.
// SSR-safe: all access guards `typeof window`.

export type CustomerProfile = {
  name: string;
  phone: string;
  location: string;
  lat: number | null;
  lng: number | null;
  savedAt: string | null; // ISO timestamp of last order
};

const KEY = "wb_customer_profile";

const EMPTY: CustomerProfile = {
  name: "",
  phone: "",
  location: "",
  lat: null,
  lng: null,
  savedAt: null,
};

export function getCustomerProfile(): CustomerProfile {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CustomerProfile>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      location: typeof parsed.location === "string" ? parsed.location : "",
      lat: typeof parsed.lat === "number" ? parsed.lat : null,
      lng: typeof parsed.lng === "number" ? parsed.lng : null,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : null,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveCustomerProfile(p: Partial<CustomerProfile>): CustomerProfile {
  const next = { ...getCustomerProfile(), ...p, savedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore quota / privacy-mode errors
    }
  }
  return next;
}

export function clearCustomerProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
