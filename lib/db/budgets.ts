import { getDb } from "./client";

const KEY = "monthly";

export async function getMonthlyBudget(): Promise<number | null> {
  const row = await getDb().getFirstAsync<{ amount: number }>(
    "SELECT amount FROM budgets WHERE key = ?",
    [KEY]
  );
  return row?.amount ?? null;
}

export async function setMonthlyBudget(amount: number): Promise<void> {
  await getDb().runAsync(
    "INSERT OR REPLACE INTO budgets (key, amount) VALUES (?, ?)",
    [KEY, amount]
  );
}

export async function clearMonthlyBudget(): Promise<void> {
  await getDb().runAsync("DELETE FROM budgets WHERE key = ?", [KEY]);
}
