import 'server-only';
import type { ShippingZone } from '@/generated/prisma/client';
import { db } from './db';
import { HttpError } from './http';

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const pinDigits = (s: string) => s.replace(/\D/g, '');

/** Splits "673, 6730 680" into ["673", "6730", "680"]: digits only, no repeats. */
export const parsePinPrefixes = (raw: string) => [...new Set(raw.split(/[\s,]+/).map(pinDigits).filter(Boolean))];

/**
 * Picks the zone for an address:
 * 1. the zone with the longest PIN prefix the postcode starts with,
 * 2. else a zone that lists the shopper's state,
 * 3. else a catch-all zone (no PINs and no states).
 * Ties go to the higher priority. Returns null when no zone covers the address.
 */
export function matchZone(zones: ShippingZone[], postcode: string, state: string) {
  const pin = pinDigits(postcode);
  const byPriority = (a: ShippingZone, b: ShippingZone) => b.priority - a.priority;

  let best: { zone: ShippingZone; length: number } | null = null;
  for (const zone of [...zones].sort(byPriority)) {
    for (const prefix of zone.pinPrefixes) {
      if (pin.startsWith(prefix) && (!best || prefix.length > best.length)) best = { zone, length: prefix.length };
    }
  }
  if (best) return best.zone;

  const wanted = clean(state);
  const byState = zones.filter((z) => wanted && z.states.some((s) => clean(s) === wanted)).sort(byPriority)[0];
  if (byState) return byState;

  return zones.filter((z) => z.pinPrefixes.length === 0 && z.states.length === 0).sort(byPriority)[0] ?? null;
}

export type ShippingQuote = { cost: number; zone: string | null; minDays: number | null; maxDays: number | null };

/**
 * Prices delivery for an order worth `orderTotal` cents (after any discount).
 * With no active zones, delivery is free everywhere. With zones set up, an
 * address no zone covers can't be delivered to.
 */
export async function quoteShipping(postcode: string, state: string, orderTotal: number): Promise<ShippingQuote> {
  const zones = await db.shippingZone.findMany({ where: { active: true } });
  if (zones.length === 0) return { cost: 0, zone: null, minDays: null, maxDays: null };

  const zone = matchZone(zones, postcode, state);
  if (!zone) throw new HttpError(400, 'Sorry, we don’t deliver to this PIN code yet. Please check it, or contact us for help.');
  const free = zone.freeAbove != null && orderTotal >= zone.freeAbove;
  return { cost: free ? 0 : zone.rate, zone: zone.name, minDays: zone.minDays, maxDays: zone.maxDays };
}

export const deliveryDays = (min: number, max: number) => (min === max ? `${min} days` : `${min}–${max} days`);
