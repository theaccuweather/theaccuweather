// Optional database (Neon serverless Postgres) holding weather and AQI snapshots for the
// rankings. Without DATABASE_URL the site still works: rankings fall back to live API calls.
import { neon } from '@neondatabase/serverless';

const makeClient = (url: string) => neon(url);
export type Sql = ReturnType<typeof makeClient>;

let client: Sql | null | undefined;

export function getDb(): Sql | null {
  if (client === undefined) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    client = url ? makeClient(url) : null;
  }
  return client;
}

/** Creates the table on first use, so there is no manual database setup. */
export async function ensureSchema(sql: Sql) {
  await sql`create table if not exists snapshots (
    city_id integer not null,
    taken_at timestamptz not null,
    aqi smallint,
    pm25 real,
    temp real,
    code smallint,
    primary key (city_id, taken_at)
  )`;
  await sql`create index if not exists snapshots_taken_at_idx on snapshots (taken_at)`;
}

/** Email alert sign-ups. Unsubscribing deletes the row. */
export async function ensureAlertSchema(sql: Sql) {
  await sql`create table if not exists alert_subs (
    id bigserial primary key,
    email text not null,
    place_name text not null,
    place_href text not null,
    lat real not null,
    lon real not null,
    weather boolean not null default true,
    aqi_threshold smallint,
    token text not null unique,
    confirmed boolean not null default false,
    created_at timestamptz not null default now(),
    last_sent_at timestamptz,
    unique (email, place_href)
  )`;
}
