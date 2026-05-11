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
}

async function _runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY);"
  );

  const row = await db.getFirstAsync<{ max_v: number | null }>(
    "SELECT MAX(version) AS max_v FROM _migrations"
  );
  const current = row?.max_v ?? 0;

  for (const { version, sql } of MIGRATIONS) {
    if (version > current) {
      await db.withTransactionAsync(async () => {
        await db.execAsync(sql);
        await db.runAsync(
          "INSERT INTO _migrations (version) VALUES (?)",
          [version]
        );
      });
    }
  }
}
