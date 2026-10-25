import { Sequelize } from "sequelize";
import { Client } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _sequelizeInstance: Sequelize | undefined;
  // eslint-disable-next-line no-var
  var _pgDbChecked: boolean | undefined;
}

/**
 * Returns PostgreSQL connection string from environment variables.
 * Defaults to local PostgreSQL on port 5432 with database 'barbar'.
 */
export function getPostgresUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST || process.env.PGHOST || "localhost";
  const port = process.env.DB_PORT || process.env.PGPORT || "5432";
  const user = process.env.DB_USER || process.env.PGUSER || process.env.USER || "postgres";
  const password = process.env.DB_PASSWORD || process.env.PGPASSWORD || "";
  const database = process.env.DB_NAME || process.env.PGDATABASE || "barbar";

  const auth = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user);

  return `postgres://${auth}@${host}:${port}/${database}`;
}

/**
 * Ensures the target PostgreSQL database exists.
 * If not, connects to default 'postgres' database and runs CREATE DATABASE.
 */
export async function ensurePostgresDatabaseExists(): Promise<void> {
  if (global._pgDbChecked) return;

  const fullUrl = getPostgresUrl();
  try {
    // Cloud managed databases (Neon, Supabase, Render, AWS RDS) are pre-provisioned
    if (
      fullUrl.includes("neon.tech") ||
      fullUrl.includes("supabase.co") ||
      fullUrl.includes("render.com") ||
      fullUrl.includes("rds.amazonaws.com")
    ) {
      global._pgDbChecked = true;
      return;
    }

    const url = new URL(fullUrl);
    const targetDb = url.pathname.replace(/^\//, "");
    if (!targetDb || targetDb === "postgres") {
      global._pgDbChecked = true;
      return;
    }

    const adminUrl = new URL(fullUrl);
    adminUrl.pathname = "/postgres";

    const client = new Client({
      connectionString: adminUrl.toString(),
      connectionTimeoutMillis: 3000,
    });

    await client.connect();
    const checkRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb]
    );

    if (checkRes.rowCount === 0) {
      console.log(`[BarBar DB] PostgreSQL database "${targetDb}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`[BarBar DB] Database "${targetDb}" created successfully!`);
    }

    await client.end();
    global._pgDbChecked = true;
  } catch (err: any) {
    // If auto-creation check fails (e.g. permission or target DB exists), proceed to direct connection
    console.debug("[BarBar DB] Postgres auto-create check notice:", err.message);
  }
}

export const getSequelize = (): Sequelize => {
  if (global._sequelizeInstance) {
    return global._sequelizeInstance;
  }

  const databaseUrl = getPostgresUrl();

  const isNeonOrSsl =
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("sslmode=require") ||
    process.env.DB_SSL === "true" ||
    (process.env.NODE_ENV === "production" &&
      !databaseUrl.includes("localhost") &&
      !databaseUrl.includes("127.0.0.1"));

  const instance = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? false : false,
    pool: {
      max: process.env.NODE_ENV === "production" ? 5 : 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: isNeonOrSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  });

  global._sequelizeInstance = instance;
  return instance;
};

export const sequelize = getSequelize();
