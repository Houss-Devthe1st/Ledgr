import * as SQLite from "expo-sqlite";
import { MIGRATIONS } from "./migrations";

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error("Database not initialized. Call initDb() first.");
  return _db;
}

export async function initDb(): Promise<void> {
  _db = SQLite.openDatabaseSync("ledgr.db");
  await _runMigrations(_db);
  await _db.runAsync(
    "CREATE TABLE IF NOT EXISTS budgets (key TEXT PRIMARY KEY NOT NULL, amount REAL NOT NULL)"
  );
}

async function _runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.runAsync(
    "CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)"
  );

  const row = await db.getFirstAsync<{ max_v: number | null }>(
    "SELECT MAX(version) AS max_v FROM _migrations"
  );
  const current = row?.max_v ?? 0;

  for (const { version, sql } of MIGRATIONS) {
    if (version > current) {
      const stmts = sql
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const stmt of stmts) {
        await db.runAsync(stmt);
      }
      await db.runAsync(
        "INSERT INTO _migrations (version) VALUES (?)",
        [version]
      );
    }
  }
}
