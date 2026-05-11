import dayjs from "dayjs";

// Standard UUID v4. crypto.randomUUID() is unavailable in Hermes.
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Advance a date by one billing cycle. Used for auto-computing renewalDate on
// subscription creation and for rolling it forward when marking as paid.
export function computeNextRenewalDate(
  baseDate: string | undefined,
  billing: string
): string {
  let next = baseDate ? dayjs(baseDate) : dayjs();
  const now = dayjs();

  // Advance by one cycle at a time until we land in the future.
  // Handles overdue subscriptions that are multiple cycles behind.
  do {
    switch (billing) {
      case "Yearly":  next = next.add(1, "year");  break;
      case "Weekly":  next = next.add(1, "week");  break;
      case "Daily":   next = next.add(1, "day");   break;
      default:        next = next.add(1, "month"); break;
    }
  } while (next.isBefore(now));

  return next.toISOString();
}

export function toMonthly(s: { price: number; billing: string }): number {
  switch (s.billing) {
    case "Yearly":  return s.price / 12;
    case "Weekly":  return s.price * 4.33;
    case "Daily":   return s.price * 30;
    default:        return s.price;
  }
}

export const formatCurrency = (value: number, currency = "USD"): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return value.toFixed(2);
  }
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid()
    ? parsedDate.format("MM/DD/YYYY")
    : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
