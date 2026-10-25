export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      console.log("[BarBar DB] Server starting up. Connecting to PostgreSQL...");
      const { syncDatabase } = await import("./lib/db/models");
      const { seedDatabaseIfEmpty } = await import("./lib/db/seed");
      await syncDatabase();
      await seedDatabaseIfEmpty();
    } catch (error: any) {
      console.error("[BarBar DB] ❌ PostgreSQL startup connection error:", error.message);
    }
  }
}

