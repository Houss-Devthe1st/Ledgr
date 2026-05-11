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
  {
    version: 3,
    sql: `CREATE TABLE IF NOT EXISTS budgets (
      key        TEXT PRIMARY KEY NOT NULL,
      amount     REAL NOT NULL
    )`,
  },
  {
    version: 4,
    sql: `
      DROP TABLE IF EXISTS subscriptions;
      DROP TABLE IF EXISTS budgets;
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
      CREATE TABLE budgets (
        key        TEXT PRIMARY KEY NOT NULL,
        amount     REAL NOT NULL
      )
    `,
  },
];
