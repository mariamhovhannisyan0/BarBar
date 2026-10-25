import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../sequelize";

// 1. TranscriptionSession
export interface SessionAttributes {
  id: string;
  userId?: string;
  title: string;
  mode: "audio_file" | "video_file" | "live_microphone";
  status: "idle" | "preprocessing" | "transcribing" | "completed" | "failed" | "interrupted";
  sourceFileName?: string;
  sourceFileUrl?: string;
  sourceMediaAvailable: boolean;
  durationSeconds: number;
  modelIdentifier: string;
  armenianizationEnabled: boolean;
  punctuationEnabled: boolean;
  hasUnsavedChanges: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TranscriptionSession
  extends Model<SessionAttributes, Optional<SessionAttributes, "id" | "hasUnsavedChanges" | "sourceMediaAvailable" | "durationSeconds">>
  implements SessionAttributes
{
  declare id: string;
  declare userId?: string;
  declare title: string;
  declare mode: "audio_file" | "video_file" | "live_microphone";
  declare status: "idle" | "preprocessing" | "transcribing" | "completed" | "failed" | "interrupted";
  declare sourceFileName?: string;
  declare sourceFileUrl?: string;
  declare sourceMediaAvailable: boolean;
  declare durationSeconds: number;
  declare modelIdentifier: string;
  declare armenianizationEnabled: boolean;
  declare punctuationEnabled: boolean;
  declare hasUnsavedChanges: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TranscriptionSession.init(
  {
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
  },
  { sequelize, tableName: "transcription_sessions", timestamps: true }
);

// 2. TranscriptionSegment
export interface SegmentAttributes {
  id: string;
  sessionId: string;
  sequenceOrder: number;
  startTime: number;
  endTime: number;
  rawText: string;
  finalizedText: string;
  isEdited: boolean;
  confidence?: number;
  createdAt?: Date;
}

export class TranscriptionSegment
  extends Model<SegmentAttributes, Optional<SegmentAttributes, "id" | "isEdited" | "confidence">>
  implements SegmentAttributes
{
  declare id: string;
  declare sessionId: string;
  declare sequenceOrder: number;
  declare startTime: number;
  declare endTime: number;
  declare rawText: string;
  declare finalizedText: string;
  declare isEdited: boolean;
  declare confidence?: number;
  declare readonly createdAt: Date;
}

TranscriptionSegment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false },
    sequenceOrder: { type: DataTypes.INTEGER, allowNull: false },
    startTime: { type: DataTypes.FLOAT, allowNull: false },
    endTime: { type: DataTypes.FLOAT, allowNull: false },
    rawText: { type: DataTypes.TEXT, allowNull: false },
    finalizedText: { type: DataTypes.TEXT, allowNull: false },
    isEdited: { type: DataTypes.BOOLEAN, defaultValue: false },
    confidence: { type: DataTypes.FLOAT, defaultValue: 0.95 },
  },
  { sequelize, tableName: "transcription_segments", timestamps: true, updatedAt: false }
);

// 3. ArmenianizationSpan
export interface SpanAttributes {
  id: string;
  segmentId: string;
  originalToken: string;
  replacementToken: string;
  lemma: string;
  startCharIndex: number;
  endCharIndex: number;
  confidence: number;
  state: "applied" | "reverted" | "customized";
  createdAt?: Date;
}

export class ArmenianizationSpan
  extends Model<SpanAttributes, Optional<SpanAttributes, "id" | "state">>
  implements SpanAttributes
{
  declare id: string;
  declare segmentId: string;
  declare originalToken: string;
  declare replacementToken: string;
  declare lemma: string;
  declare startCharIndex: number;
  declare endCharIndex: number;
  declare confidence: number;
  declare state: "applied" | "reverted" | "customized";
  declare readonly createdAt: Date;
}

ArmenianizationSpan.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    segmentId: { type: DataTypes.UUID, allowNull: false },
    originalToken: { type: DataTypes.STRING(128), allowNull: false },
    replacementToken: { type: DataTypes.STRING(128), allowNull: false },
    lemma: { type: DataTypes.STRING(128), allowNull: false },
    startCharIndex: { type: DataTypes.INTEGER, allowNull: false },
    endCharIndex: { type: DataTypes.INTEGER, allowNull: false },
    confidence: { type: DataTypes.FLOAT, allowNull: false },
    state: { type: DataTypes.STRING(32), defaultValue: "applied" },
  },
  { sequelize, tableName: "armenianization_spans", timestamps: true, updatedAt: false }
);

// 4. GlossaryTerm
export interface GlossaryAttributes {
  id: string;
  userId?: string;
  foreignStem: string;
  armenianLemma: string;
  category: string;
  confidence: number;
  isSystem: boolean;
  createdAt?: Date;
}

export class GlossaryTerm
  extends Model<GlossaryAttributes, Optional<GlossaryAttributes, "id" | "isSystem" | "confidence" | "category">>
  implements GlossaryAttributes
{
  declare id: string;
  declare userId?: string;
  declare foreignStem: string;
  declare armenianLemma: string;
  declare category: string;
  declare confidence: number;
  declare isSystem: boolean;
  declare readonly createdAt: Date;
}

GlossaryTerm.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    foreignStem: { type: DataTypes.STRING(128), allowNull: false },
    armenianLemma: { type: DataTypes.STRING(128), allowNull: false },
    category: { type: DataTypes.STRING(64), defaultValue: "general" },
    confidence: { type: DataTypes.FLOAT, defaultValue: 0.95 },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: "glossary_terms", timestamps: true, updatedAt: false }
);

// 5. SpecialTerm
export interface SpecialTermAttributes {
  id: string;
  userId?: string;
  term: string;
  category: string;
  isSystem: boolean;
  createdAt?: Date;
}

export class SpecialTerm
  extends Model<SpecialTermAttributes, Optional<SpecialTermAttributes, "id" | "isSystem" | "category">>
  implements SpecialTermAttributes
{
  declare id: string;
  declare userId?: string;
  declare term: string;
  declare category: string;
  declare isSystem: boolean;
  declare readonly createdAt: Date;
}

SpecialTerm.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    term: { type: DataTypes.STRING(128), allowNull: false },
    category: { type: DataTypes.STRING(64), defaultValue: "brand" },
    isSystem: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: "special_terms", timestamps: true, updatedAt: false }
);

// Backward compatibility alias
export const ProtectedTerm = SpecialTerm;
export type ProtectedTermAttributes = SpecialTermAttributes;

// 6. LatencyMetric
export interface LatencyMetricAttributes {
  id: string;
  sessionId: string;
  segmentId?: string;
  speechStartOffset: number;
  timeToFirstInterimMs: number;
  finalizationDelayMs: number;
  processingDurationMs: number;
  measuredAt?: Date;
}

export class LatencyMetric
  extends Model<LatencyMetricAttributes, Optional<LatencyMetricAttributes, "id" | "segmentId" | "measuredAt">>
  implements LatencyMetricAttributes
{
  declare id: string;
  declare sessionId: string;
  declare segmentId?: string;
  declare speechStartOffset: number;
  declare timeToFirstInterimMs: number;
  declare finalizationDelayMs: number;
  declare processingDurationMs: number;
  declare readonly measuredAt: Date;
}

LatencyMetric.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sessionId: { type: DataTypes.UUID, allowNull: false },
    segmentId: { type: DataTypes.UUID, allowNull: true },
    speechStartOffset: { type: DataTypes.FLOAT, allowNull: false },
    timeToFirstInterimMs: { type: DataTypes.FLOAT, allowNull: false },
    finalizationDelayMs: { type: DataTypes.FLOAT, allowNull: false },
    processingDurationMs: { type: DataTypes.FLOAT, allowNull: false },
  },
  { sequelize, tableName: "latency_metrics", timestamps: true, updatedAt: false, createdAt: "measuredAt" }
);

// Associations
TranscriptionSession.hasMany(TranscriptionSegment, { foreignKey: "sessionId", as: "segments", onDelete: "CASCADE" });
TranscriptionSegment.belongsTo(TranscriptionSession, { foreignKey: "sessionId" });

TranscriptionSegment.hasMany(ArmenianizationSpan, { foreignKey: "segmentId", as: "replacements", onDelete: "CASCADE" });
ArmenianizationSpan.belongsTo(TranscriptionSegment, { foreignKey: "segmentId" });

TranscriptionSession.hasMany(LatencyMetric, { foreignKey: "sessionId", as: "latencies", onDelete: "CASCADE" });
LatencyMetric.belongsTo(TranscriptionSession, { foreignKey: "sessionId" });

// Sync helper
let _synced = false;
export async function syncDatabase() {
  if (!_synced) {
    try {
      const { ensurePostgresDatabaseExists } = await import("../sequelize");
      await ensurePostgresDatabaseExists();
      await sequelize.authenticate();
      await sequelize.sync();
      _synced = true;
      console.log("[BarBar DB] ✓ PostgreSQL database connected and synchronized successfully.");
    } catch (err: any) {
      console.error(
        `[BarBar DB] ❌ PostgreSQL connection failed: ${err.message}\n` +
        `Please ensure PostgreSQL service is active (e.g. 'brew services start postgresql@14' or verify DATABASE_URL in .env).`
      );
      throw err;
    }
  }
}
