#!/usr/bin/env node

/**
 * BarBar PostgreSQL Initializer and Diagnostic Tool
 */

import { Sequelize, DataTypes } from "sequelize";
import { Client } from "pg";
import fs from "fs";
import path from "path";

// Read .env if present
try {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [k, ...v] = trimmed.split("=");
        if (k && v.length) {
          process.env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  }
} catch {}

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgres://${process.env.DB_USER || process.env.USER || "postgres"}:${process.env.DB_PASSWORD || ""}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "barbar"}`;

console.log("==========================================================");
console.log("      BarBar PostgreSQL Initialization & Diagnostics     ");
console.log("==========================================================");
console.log(`Connecting to: ${databaseUrl.replace(/:([^:@]+)@/, ":****@")}`);

async function run() {
  // Step 1: Ensure database exists
  try {
    const isNeon = databaseUrl.includes("neon.tech") || databaseUrl.includes("sslmode=require");
    if (isNeon) {
      console.log(`1. Neon Serverless Postgres detected (cloud pre-provisioned).`);
    } else {
      const url = new URL(databaseUrl);
      const targetDb = url.pathname.replace(/^\//, "");
      const adminUrl = new URL(databaseUrl);
      adminUrl.pathname = "/postgres";

      console.log(`1. Checking if PostgreSQL database "${targetDb}" exists...`);
      const adminClient = new Client({
        connectionString: adminUrl.toString(),
        connectionTimeoutMillis: 5000,
      });

      try {
        await adminClient.connect();
        const res = await adminClient.query(
          "SELECT 1 FROM pg_database WHERE datname = $1",
          [targetDb]
        );
        if (res.rowCount === 0) {
          console.log(`   Database "${targetDb}" does not exist. Creating...`);
          await adminClient.query(`CREATE DATABASE "${targetDb}"`);
          console.log(`   ✓ Created database "${targetDb}" successfully!`);
        } else {
          console.log(`   ✓ Database "${targetDb}" already exists.`);
        }
        await adminClient.end();
      } catch (adminErr) {
        console.log(`   Notice: Could not connect to default /postgres DB (${adminErr.message}).`);
        console.log(`   Proceeding directly to target database...`);
      }
    }
  } catch (err) {
    console.warn(`   URL parse warning: ${err.message}`);
  }

  // Step 2: Test Sequelize Connection
  console.log("2. Connecting via Sequelize ORM...");
  const isSsl =
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("sslmode=require") ||
    process.env.DB_SSL === "true";

  const sequelize = new Sequelize(databaseUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: isSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  });

  try {
    await sequelize.authenticate();
    console.log("   ✓ Connection authenticated successfully.");
  } catch (authErr) {
    console.error(`\n❌ Failed to connect to PostgreSQL: ${authErr.message}\n`);
    console.log("Suggestions:");
    console.log("1. Check if PostgreSQL is running: brew services list");
    console.log("2. Start PostgreSQL: brew services start postgresql@14");
    console.log("3. Check credentials in your .env file: DATABASE_URL=postgres://user:password@localhost:5432/barbar\n");
    process.exit(1);
  }

  // Step 3: Define models and sync schema
  console.log("3. Synchronizing tables and schema...");

  // User
  const User = sequelize.define("User", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    settings: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
  }, { tableName: "users", timestamps: true });

  // Session
  const Session = sequelize.define("TranscriptionSession", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    mode: { type: DataTypes.STRING(32), allowNull: false },
    status: { type: DataTypes.STRING(32), allowNull: false },
    sourceFileName: { type: DataTypes.STRING(512), allowNull: true },
    sourceFileUrl: { type: DataTypes.TEXT, allowNull: true },
    sourceMediaAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    durationSeconds: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    modelIdentifier: { type: DataTypes.STRING(128), allowNull: false },
    armenianizationEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    punctuationEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    hasUnsavedChanges: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: "transcription_sessions", timestamps: true });

  // Segment
  const Segment = sequelize.define("TranscriptionSegment", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false },
    sequenceOrder: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.FLOAT, allowNull: false },
    endTime: { type: DataTypes.FLOAT, allowNull: false },
    rawText: { type: DataTypes.TEXT, allowNull: false },
    finalizedText: { type: DataTypes.TEXT, allowNull: false },
    isEdited: { type: DataTypes.BOOLEAN, defaultValue: false },
    confidence: { type: DataTypes.FLOAT, defaultValue: 0.95 },
  }, { tableName: "transcription_segments", timestamps: true, updatedAt: false });

  // Span
  const Span = sequelize.define("ArmenianizationSpan", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    segmentId: { type: DataTypes.UUID, allowNull: false },
    originalToken: { type: DataTypes.STRING(255), allowNull: false },
    replacementToken: { type: DataTypes.STRING(255), allowNull: false },
    lemma: { type: DataTypes.STRING(255), allowNull: false },
    startCharIndex: { type: DataTypes.INTEGER, allowNull: false },
    endCharIndex: { type: DataTypes.INTEGER, allowNull: false },
    confidence: { type: DataTypes.FLOAT, defaultValue: 0.92 },
    state: { type: DataTypes.STRING(32), defaultValue: "applied" },
  }, { tableName: "armenianization_spans", timestamps: true, updatedAt: false });

  // Glossary
  const Glossary = sequelize.define("GlossaryTerm", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    foreignStem: { type: DataTypes.STRING(255), allowNull: false },
    armenianLemma: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(64), defaultValue: "general" },
    confidence: { type: DataTypes.FLOAT, defaultValue: 0.9 },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: "glossary_terms", timestamps: true, updatedAt: false });

  // SpecialTerm
  const SpecialTerm = sequelize.define("SpecialTerm", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    term: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(64), defaultValue: "brand" },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: "special_terms", timestamps: true, updatedAt: false });

  // LatencyMetric
  const Latency = sequelize.define("LatencyMetric", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false },
    segmentId: { type: DataTypes.UUID, allowNull: true },
    speechStartOffset: { type: DataTypes.FLOAT, allowNull: false },
    timeToFirstInterimMs: { type: DataTypes.FLOAT, allowNull: false },
    finalizationDelayMs: { type: DataTypes.FLOAT, allowNull: false },
    processingDurationMs: { type: DataTypes.FLOAT, allowNull: false },
  }, { tableName: "latency_metrics", timestamps: true, updatedAt: false, createdAt: "measuredAt" });

  try {
    await sequelize.sync({ alter: true });
  } catch {
    await sequelize.sync();
  }
  console.log("   ✓ All tables created/verified successfully.");

  // Step 4: Seed initial terms
  console.log("4. Checking initial glossary and special terms...");
  const glossaryCount = await Glossary.count();
  if (glossaryCount === 0) {
    console.log("   Seeding default Armenian glossary terms...");
    const sampleTerms = [
      { foreignStem: "meeting", armenianLemma: "հանդիպում", category: "business", isSystem: true },
      { foreignStem: "report", armenianLemma: "հաշվետվություն", category: "business", isSystem: true },
      { foreignStem: "email", armenianLemma: "նամակ", category: "technology", isSystem: true },
      { foreignStem: "deadline", armenianLemma: "վերջնաժամկետ", category: "business", isSystem: true },
      { foreignStem: "task", armenianLemma: "առաջադրանք", category: "business", isSystem: true },
    ];
    await Glossary.bulkCreate(sampleTerms);
    console.log(`   ✓ Seeded ${sampleTerms.length} initial glossary terms.`);
  } else {
    console.log(`   ✓ Glossary already contains ${glossaryCount} terms.`);
  }

  const specialCount = await SpecialTerm.count();
  if (specialCount === 0) {
    console.log("   Seeding default special terms...");
    const sampleSpecial = [
      { term: "Google", category: "brand", isSystem: true },
      { term: "Apple", category: "brand", isSystem: true },
      { term: "Microsoft", category: "brand", isSystem: true },
      { term: "Python", category: "technology", isSystem: true },
      { term: "Docker", category: "technology", isSystem: true },
    ];
    await SpecialTerm.bulkCreate(sampleSpecial);
    console.log(`   ✓ Seeded ${sampleSpecial.length} special terms.`);
  } else {
    console.log(`   ✓ Special terms table already contains ${specialCount} terms.`);
  }

  await sequelize.close();
  console.log("==========================================================");
  console.log("  ✓ [BarBar DB] PostgreSQL is FULLY READY and OPERATIONAL!");
  console.log("==========================================================\n");
}

run().catch((e) => {
  console.error("Initialization script failed:", e);
  process.exit(1);
});
