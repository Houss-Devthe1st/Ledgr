import { icons } from "@/constants/icons";
import type { ImageSourcePropType } from "react-native";
import { getDb } from "./client";

// ─── Icon serialisation ───────────────────────────────────────────────────────

// Keep this list in sync with SERVICE_ICONS in app/subscriptions/create.tsx
const SERVICE_ICON_MAP: Record<string, ImageSourcePropType> = {
  app:     require("@/assets/images/icon.png"),
  spotify: icons.spotify,
  notion:  icons.notion,
  figma:   icons.figma,
  adobe:   icons.adobe,
  github:  icons.github,
  claude:  icons.claude,
  canva:   icons.canva,
  openai:  icons.openai,
  dropbox: icons.dropbox,
  medium:  icons.medium,
};

function iconToColumns(icon: ImageSourcePropType) {
  for (const [key, val] of Object.entries(SERVICE_ICON_MAP)) {
    if (val === icon) return { icon_key: key, icon_uri: null };
  }
  if (typeof icon === "object" && icon !== null && "uri" in icon) {
    return { icon_key: null, icon_uri: (icon as { uri: string }).uri };
  }
  return { icon_key: null, icon_uri: null };
}

function iconFromColumns(
  icon_key: string | null,
  icon_uri: string | null
): ImageSourcePropType {
  if (icon_key && SERVICE_ICON_MAP[icon_key]) return SERVICE_ICON_MAP[icon_key];
  if (icon_uri) return { uri: icon_uri };
  return SERVICE_ICON_MAP["app"]; // app icon is the default
}

// ─── Row mapping ──────────────────────────────────────────────────────────────

type SubscriptionRow = {
  id:             string;
  icon_key:       string | null;
  icon_uri:       string | null;
  name:           string;
  price:          number;
  currency:       string;
  billing:        string;
  category:       string | null;
  plan:           string | null;
  payment_method: string | null;
  status:         string;
  start_date:     string | null;
  renewal_date:   string | null;
  color:          string | null;
  created_at:     string;
  updated_at:     string;
};

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id:            row.id,
    icon:          iconFromColumns(row.icon_key, row.icon_uri),
    name:          row.name,
    price:         row.price,
    currency:      row.currency,
    billing:       row.billing,
    category:      row.category      ?? undefined,
    plan:          row.plan          ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    status:        row.status,
    startDate:     row.start_date    ?? undefined,
    renewalDate:   row.renewal_date  ?? undefined,
    color:         row.color         ?? undefined,
  };
}

// Maps Subscription camelCase fields to their SQL column names.
// Used to build dynamic UPDATE SET clauses without a long if/else chain.
const FIELD_TO_COLUMN: Record<string, string> = {
  name:          "name",
  price:         "price",
  currency:      "currency",
  billing:       "billing",
  category:      "category",
  plan:          "plan",
  paymentMethod: "payment_method",
  status:        "status",
  startDate:     "start_date",
  renewalDate:   "renewal_date",
  color:         "color",
};

// ─── Repository ───────────────────────────────────────────────────────────────

export async function getAllSubscriptions(): Promise<Subscription[]> {
  const rows = await getDb().getAllAsync<SubscriptionRow>(
    "SELECT * FROM subscriptions ORDER BY created_at DESC"
  );
  return rows.map(rowToSubscription);
}

export async function insertSubscription(
  s: Subscription
): Promise<void> {
  const { icon_key, icon_uri } = iconToColumns(s.icon);
  const now = new Date().toISOString();

  await getDb().runAsync(
    `INSERT INTO subscriptions
       (id, icon_key, icon_uri, name, price, currency, billing,
        category, plan, payment_method, status,
        start_date, renewal_date, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.id, icon_key, icon_uri, s.name, s.price, s.currency ?? "USD", s.billing,
      s.category ?? null, s.plan ?? null, s.paymentMethod ?? null,
      s.status, s.startDate ?? null, s.renewalDate ?? null,
      s.color ?? null, now, now,
    ]
  );
}

export async function updateSubscription(
  id: string,
  updates: Partial<Omit<Subscription, "id">>
): Promise<void> {
  const clauses: string[] = ["updated_at = ?"];
  const values: (string | number | null)[] = [new Date().toISOString()];

  if (updates.icon !== undefined) {
    const { icon_key, icon_uri } = iconToColumns(updates.icon);
    clauses.push("icon_key = ?", "icon_uri = ?");
    values.push(icon_key, icon_uri);
  }

  for (const [field, column] of Object.entries(FIELD_TO_COLUMN)) {
    if (field in updates) {
      clauses.push(`${column} = ?`);
      const val = (updates as Record<string, unknown>)[field];
      values.push(val !== undefined ? (val as string | number | null) : null);
    }
  }

  values.push(id);
  await getDb().runAsync(
    `UPDATE subscriptions SET ${clauses.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteSubscription(id: string): Promise<void> {
  await getDb().runAsync("DELETE FROM subscriptions WHERE id = ?", [id]);
}
