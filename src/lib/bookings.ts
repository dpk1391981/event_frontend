// ─── Plan Bookings — localStorage tracking ────────────────────────────────────
// Stores vendors the user has connected with via the plan page.
// Used to show "✓ Connected" badges across the app.

export interface BookedVendor {
  vendorId: number;
  vendorName: string;
  category: string;
  price: number;
  eventType: string;
  planTag: string;
  bookedAt: string; // ISO
  groupId: string;
}

const KEY = 'pt_plan_bookings';

export function getBookings(): BookedVendor[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function addBookings(vendors: BookedVendor[]): void {
  if (typeof window === 'undefined') return;
  const existing = getBookings();
  const existing_ids = new Set(existing.map((b) => b.vendorId));
  const fresh = vendors.filter((v) => !existing_ids.has(v.vendorId));
  localStorage.setItem(KEY, JSON.stringify([...existing, ...fresh]));
}

export function isVendorContacted(vendorId: number): boolean {
  return getBookings().some((b) => b.vendorId === vendorId);
}

export function clearBookings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
