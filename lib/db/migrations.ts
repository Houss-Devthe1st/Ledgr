type Migration = { version: number; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS subscriptions (
        id              TEXT    PRIMARY KEY NOT NULL,
        icon_key        TEXT,
        icon_uri        TEXT,
        name            TEXT    NOT NULL,
        price           REAL    NOT NULL,
        currency        TEXT    NOT NULL DEFAULT 'USD',
        billing         TEXT    NOT NULL DEFAULT 'Monthly',
        category        TEXT,
        plan            TEXT,
        payment_method  TEXT,
        status          TEXT    NOT NULL DEFAULT 'active',
        start_date      TEXT,
        renewal_date    TEXT,
        color           TEXT,
        created_at      TEXT    NOT NULL,
        updated_at      TEXT    NOT NULL
      );
    `,
  },
  {
    version: 2,
    sql: `
      DROP TABLE IF EXISTS subscriptions;
      CREATE TABLE subscriptions (
        id              TEXT    PRIMARY KEY NOT NULL,
        icon_key        TEXT,
        icon_uri        TEXT,
        name            TEXT    NOT NULL,
        price           REAL    NOT NULL,
        currency        TEXT    NOT NULL DEFAULT 'USD',
        billing         TEXT    NOT NULL DEFAULT 'Monthly',
        category        TEXT,
        plan            TEXT,
        payment_method  TEXT,
        status          TEXT    NOT NULL DEFAULT 'active',
        start_date      TEXT,
        renewal_date    TEXT,
        color           TEXT,
        created_at      TEXT    NOT NULL,
        updated_at      TEXT    NOT NULL
      );
    `,
  },
  // Future migrations go here — increment version, add SQL:
  // { version: 3, sql: `ALTER TABLE subscriptions ADD COLUMN notes TEXT;` },
];
