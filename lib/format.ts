/** Shared display formatters. Money is stored in minor units (PROMPT.md §5) and formatted here. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatPrice(priceMinor: number | null): string {
  return priceMinor === null ? "No offers yet" : formatRupees(priceMinor);
}

export function formatRupees(amountMinor: number): string {
  return inr.format(amountMinor / 100);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "not recorded";
  return date.format(new Date(iso));
}

export function formatStorage(storageGb: number): string {
  return storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
}
