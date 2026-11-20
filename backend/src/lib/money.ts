/** Store amounts are kept in cents. The storefront works in whole currency units. */
export const toUnits = (cents: number) => cents / 100;
export const toCents = (units: number) => Math.round(units * 100);

export const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(cents / 100);
