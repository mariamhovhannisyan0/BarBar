# Software Design & Technical Architecture Specification (SDDS)

## BarBar — Speech-to-Text Transcription Web Platform (Armenian)

*Bachelor's Diploma Project in Software Engineering*

| Field | Value |
|---|---|
| Document ID | SDD-STT-001 |
| Companion Document | FRS-STT-001 (Functional Requirements Specification) |
| Version / Status | 1.0 / Draft for Review |
| Date | October 2026 |
| Target Platforms | Web (Vercel / Cloud & Local Development / Self-hosted Docker) |
| Author | [Student Full Name] |
| Supervisor | [Academic Title and Name] |
| University | [Name of University] |

---

## 1. Introduction, Objectives and Scope

### 1.1 Purpose
This Software Design and Technical Architecture Specification (SDDS) defines the technical architecture, component design, data structures, streaming protocols, and deployment strategies for the **BarBar** Armenian speech-to-text platform. It serves as the definitive engineering blueprint for the implementation, verification, and deployment phases of the diploma project, translating the requirements established in `FRS-STT-001` into concrete software constructs.

### 1.2 System Scope
BarBar is an end-to-end, full-stack web application dedicated to converting spoken Armenian (standard Eastern Armenian) into written text across three operational modalities:
1. **Prerecorded Audio File Processing** (WAV, MP3, M4A, FLAC, OGG).
2. **Video File Audio Extraction & Transcription** (MP4, AVI, MKV, MOV, WebM).
3. **Low-Latency Real-Time Microphone Transcription** (continuous streaming with distinct interim hypotheses and finalized segments).

Beyond basic acoustic recognition, the platform incorporates an independent **Contextual Armenianization** pipeline for loanwords/foreign terms, an automated **Armenian Punctuation and Formatting** engine, a rich interactive transcript editor with one-click revert capabilities, session history management, audio playback synchronized with transcript cues, and multi-format export (UTF-8 TXT, formatted DOCX, and timed SRT).

### 1.3 Deployment Paradigms: Hybrid Cloud & Local Support
To satisfy user privacy requirements alongside modern web accessibility, the platform is engineered with a **hybrid deployment topology**:
- **Cloud Web Deployment:** The Next.js frontend and application API routes deploy natively to **Vercel** with global CDN edge delivery; relational data resides on managed **PostgreSQL** (e.g., Neon Serverless Postgres, Supabase, or AWS RDS); audio/video media files are stored via S3-compatible object storage (Cloudflare R2, AWS S3); and the heavy ASR/NLP inference engine runs on a dedicated containerized backend (Docker on AWS ECS, RunPod, or Railway).
- **Local / Self-Hosted Deployment:** The entire ecosystem runs fully offline or on an on-premise local environment via `docker-compose` (Next.js web container + PostgreSQL container + Python ASR container + MinIO local object storage) without external network dependencies.

---

## 2. Technology Stack and Environment Justification

The software stack has been chosen to satisfy non-functional constraints: zero recurring external API costs (`C-002`, `C-003`), 100% open-source or permissive licensing, execution feasibility on commodity hardware without requiring enterprise GPUs (`AC-009`), and high-responsiveness live streaming.

```mermaid
graph TD
    subgraph Client ["Client Browser Tier"]
        UI["Next.js 15 Client (React 19, TypeScript)"]
        WA["Web Audio API & AudioWorklet (16 kHz PCM)"]
        WSClient["WebSocket Streaming Client"]
        Editor["Tiptap / Lexical Rich Transcript Editor"]
    end

    subgraph WebTier ["Web Application & Gateway Tier (Vercel / Local)"]
        NextServer["Next.js App Router (Server Actions & Route Handlers)"]
        ORM["Sequelize ORM (PostgreSQL)"]
        ExportEngine["Export Engine (docx, txt, srt)"]
    end

    subgraph DataTier ["Data & Storage Tier"]
        Postgres[(PostgreSQL Database)]
        ObjectStore[("S3 / Cloudflare R2 / Local MinIO")]
    end

    subgraph MLTier ["ASR & NLP Microservice (Python 3.11+ / FastAPI)"]
        FastAPIWS["FastAPI WebSocket & HTTP Controller"]
        VADEngine["Silero VAD (ONNX Runtime)"]
        ASREngine["Hugging Face Armenian ASR Engine (Whisper Fine-Tuned / Transformers)"]
        NLPModule["Contextual Armenianization Engine"]
        PunctModule["Armenian Punctuation Engine"]
        MediaProc["FFmpeg Media Ingestion Worker"]
    end

    WA -->|16 kHz PCM Chunks| WSClient
    WSClient <-->|WebSocket Stream| FastAPIWS
    UI <-->|HTTPS / Server Actions| NextServer
    NextServer <-->|Database Queries| Postgres
    NextServer <-->|Signed Media URLs| ObjectStore
    NextServer -->|Job Delegation| FastAPIWS
    FastAPIWS <-->|Read / Write Metadata| Postgres
    FastAPIWS <-->|Audio Stream Read| ObjectStore
    FastAPIWS --> VADEngine --> ASREngine --> NLPModule --> PunctModule
```

### 2.1 Technology Selection Matrix

| Tier / Subsystem | Technology | Version | Purpose & Architectural Justification |
|---|---|---|---|
| **Web Frontend** | Next.js (App Router) | 15.x (React 19) | Modern React framework with Server Components, optimized client hydration, dynamic routing, and native Vercel optimization. |
| **Language (Web)** | TypeScript | 5.5+ | Full end-to-end type safety across client UI, server actions, database entities, and streaming payloads. |
| **Styling & UI Kit** | Tailwind CSS + Shadcn UI (Radix) | Latest | Accessible, performant UI components with native dark/light theme, progress meters, and responsive layouts. |
| **Audio Capture** | Web Audio API (`AudioWorklet`) | Standard W3C | Non-blocking downsampling of microphone input to 16 kHz, 16-bit mono PCM chunks directly on the client thread. |
| **Rich Text Editor** | Tiptap (ProseMirror core) | 2.x | Extensible headless rich text editor allowing custom inline marks (`ArmenianizedSpan`), interactive tooltips, and segment timestamps. |
| **Relational Database** | PostgreSQL | 16.x | ACID-compliant relational data management, JSONB support for token replacement spans, full-text search capability, and robust concurrency. |
| **Database ORM** | Sequelize ORM | 6.x / 7.x (`pg`, `pg-hstore`) | Industry-standard promise-based Node.js ORM for PostgreSQL with connection pooling, declarative model associations, and schema synchronization. |
| **ASR & NLP Backend** | Python + FastAPI | 3.11+, 0.115+ | High-performance asynchronous HTTP and WebSocket routing interfacing directly with native C/C++ and PyTorch machine learning runtimes. |
| **Speech Recognition Engine** | Hugging Face Armenian ASR Models | Transformers 4.45+ / CTranslate2 | Ready-to-use pre-trained and fine-tuned Armenian speech models downloaded directly from Hugging Face Hub (e.g., fine-tuned Whisper on Armenian Common Voice / FLEURS such as `taruma/whisper-small-armenian` and checkpoints from Hugging Face Hub). Supported via Hugging Face `transformers` pipeline and `faster-whisper` Hugging Face hub loader for INT8/FP16 performance. |
| **Comparison ASR Engine** | Hugging Face Alternative Checkpoints / Sherpa-ONNX | Latest | Pluggable alternative model checkpoint from Hugging Face Hub satisfying `FR-027` (allowing direct comparative WER/CER benchmarking on Armenian speech data). |
| **Voice Activity Detection** | Silero VAD | 5.x (ONNX) | Millisecond-level neural speech/silence detection running locally; filters noise and prevents hallucination during speech pauses (`FR-015`). |
| **Media Demuxing / Transcoding**| FFmpeg / FFprobe | 6.x / 7.x | Robust extraction of audio tracks from video/audio containers to standardized 16 kHz 16-bit WAV without modifying sources (`FR-003, FR-010`). |
| **Object / File Storage** | S3 API / Cloudflare R2 / MinIO | Standard | Scalable storage for raw audio uploads, extracted temporary WAV tracks, and optional live session audio recordings (`FR-022`). |

---

## 3. System Architecture and Component Decomposition

BarBar follows a layered, decoupled service architecture adhering to the **Separation of Concerns (SoC)** and **Single Responsibility** principles.

```mermaid
classDiagram
    class ISpeechRecognitionEngine {
        <<interface>>
        +load_hf_model(hf_repo_id: string, device: string, compute_type: string) void
        +transcribe_file(audio_path: string, options: TranscriptionOptions) ResultIterator
        +create_stream_recognizer(sample_rate: int) IStreamRecognizer
    }

    class HuggingFaceArmenianWhisperEngine {
        -hf_model_id: string
        -processor: AutoProcessor
        -model: WhisperForConditionalGeneration / WhisperModel
        +load_hf_model(...) void
        +transcribe_file(...) ResultIterator
        +create_stream_recognizer(...) IStreamRecognizer
    }

    class HuggingFaceTransformersEngine {
        -pipeline: AutomaticSpeechRecognitionPipeline
        +load_hf_model(...) void
        +transcribe_file(...) ResultIterator
        +create_stream_recognizer(...) IStreamRecognizer
    }

    class IArmenianizationProcessor {
        <<interface>>
        +process_text(raw_text: string, context_history: string[]) ArmenianizationResult
        +revert_token(span_id: string) string
    }

    class ContextualArmenianizer {
        -morph_analyzer: ArmenianMorphology
        -glossary_repo: IGlossaryRepository
        -protected_terms: Set~string~
        -embedder: Optional~LocalEmbeddingModel~
        +process_text(...) ArmenianizationResult
        +revert_token(...) string
    }

    class IPunctuationProcessor {
        <<interface>>
        +apply_punctuation(text: string, pause_duration: float) string
    }

    class ArmenianPunctuationEngine {
        +apply_punctuation(...) string
    }

    ISpeechRecognitionEngine <|.. HuggingFaceArmenianWhisperEngine
    ISpeechRecognitionEngine <|.. HuggingFaceTransformersEngine
    IArmenianizationProcessor <|.. ContextualArmenianizer
    IPunctuationProcessor <|.. ArmenianPunctuationEngine
```

### 3.1 Presentation & Web Client Subsystems
- **Audio Capture Node (`AudioRecorder`):** Uses an `AudioWorkletNode` executing on the browser audio rendering thread. It captures raw audio at the hardware sample rate (typically 44.1 kHz or 48 kHz), performs linear downsampling to 16,000 Hz, converts float32 audio buffers into signed 16-bit PCM binary frames, and emits binary chunks every 100 ms via WebSocket.
- **Microphone Management & Permission Monitor (`DeviceManager`):** Queries `navigator.mediaDevices.enumerateDevices()` to populate input audio peripherals, handles dynamic device disconnect/reconnect events (`FR-020`), and detects system permission denials, rendering clear UI instructions (`FR-013`).
- **Interactive Transcript Workspace (`TranscriptEditor`):** Implemented using Tiptap with custom ProseMirror nodes:
  - `FinalizedBlock`: Read-only during active live sessions (`A-012`), editable once finalized or post-session.
  - `InterimBlock`: Distinct visual rendering (italicized, subdued gray font) that updates in-place dynamically without triggering text insertion events into history (`UI-002`).
  - `ArmenianizedMark`: Custom inline mark encapsulating replacement metadata (`originalWord`, `replacement`, `confidence`, `glossaryId`). Provides a contextual floating action popover on click/hover allowing the user to view the original word and revert it with one click (`FR-031`).
  - `SegmentTimeSync`: Binds audio playback position to DOM elements, enabling auto-scrolling and segment highlighting (`FR-042`).

### 3.2 Next.js Full-Stack Application Subsystem
- **Session & Transcript Controller:** Manages transcript lifecycles, project folders, metadata updates, and deletion actions with confirmation modals (`FR-040`).
- **Data Access Layer (Sequelize ORM):** Implements a singleton database connection pool for PostgreSQL in Next.js, managing transactions, schema migrations, and relational models (`User`, `TranscriptionSession`, `TranscriptionSegment`, `ArmenianizationSpan`, `GlossaryTerm`, `ProtectedTerm`, `LatencyMetric`).
- **Export Engine:** Formats finalized transcripts server-side:
  - **TXT:** Emits UTF-8 with optional Byte Order Mark (`EF BB BF`) per `A-013`.
  - **DOCX:** Generates native Microsoft Word documents via `docx` library with embedded styles and Armenian font fallbacks (*Noto Sans Armenian*, *Sylfaen*).
  - **SRT:** Formats timed segment arrays into strict SubRip subtitle format (`HH:MM:SS,mmm --> HH:MM:SS,mmm`) with sequence indices (`FR-039`).
- **Storage Gateway:** Manages multi-part pre-signed uploads to S3/R2 storage in Cloud mode, or streams directly to disk in local Docker mode.

### 3.3 Python ASR & NLP Microservice
- **Acoustic Speech Recognition Pipeline (Hugging Face Pre-Trained & Fine-Tuned Armenian Models):**
  - `ISpeechRecognitionEngine`: Abstract Strategy class decoupling the concrete inference runtime from higher-level business logic (`FR-027`).
  - **Hugging Face Hub Integration:** Dynamically loads models fine-tuned specifically for Armenian speech directly from Hugging Face Hub repositories (e.g., `taruma/whisper-small-armenian`, community checkpoints trained on Mozilla Common Voice Armenian / FLEURS, or multi-lingual checkpoints like `openai/whisper-large-v3-turbo` with Armenian language prompt).
  - `HuggingFaceArmenianWhisperEngine`: Concrete engine supporting direct Hugging Face Hub IDs with `CTranslate2` / `faster-whisper` backend for low-latency `INT8` CPU inference (`AC-009`) and `float16` GPU acceleration.
  - `HuggingFaceTransformersEngine`: Alternative Hugging Face `transformers` ASR pipeline (`AutoModelForSpeechSeq2Seq`, `AutoProcessor`) for direct evaluation and benchmarking against fine-tuned checkpoints (`FR-027, AC-005`).
- **Real-Time Streaming Session Coordinator:**
  - Manages concurrent WebSocket sessions.
  - Employs **Silero VAD** over 30 ms chunks to classify acoustic energy as speech or silence.
  - Implements the **LocalAgreement-2** algorithm (*Macháček et al., 2023*): keeps a sliding acoustic buffer (1.5 s – 3.0 s), runs the decoder every 500 ms to produce an interim transcript hypothesis, and commits text as finalized when two consecutive decoding steps agree on a common prefix string or when Silero VAD flags a speech pause ($\Delta t \ge 600\text{ ms}$).
- **Contextual Armenianization Subsystem (`ContextualArmenianizer`):**
  - Executed sequentially on finalized text segments (`FR-028`).
  - Implements regex tokenization separating foreign characters (Latin/Cyrillic scripts) and hyphenated loanwords (e.g., `meeting-ի`, `report-ը`).
  - Applies a morphological stem-suffix splitter isolating Armenian inflectional markers (dative/genitive `-ի`, ablative `-ից`, instrumental `-ով`, locative `-ում`, definite articles `-ը`, `-ն`, plural `-ներ`, `-եր`).
  - Evaluates candidate lemmas against a **Curated Glossary** and **Protected Terms Registry** (`FR-029, FR-030`).
  - Disambiguates polysemous words using surrounding n-gram context vectors.
  - Retains complete historical trace (`original_token`, `lemma`, `suffix`, `inflected_replacement`, `confidence_score`) and attaches it to the database segment record (`FR-026`).
- **Punctuation and Text Formatter (`ArmenianPunctuationEngine`):**
  - Replaces ASCII periods with the Armenian full stop (`։`, `U+0589`).
  - Standardizes question marks (`?`) and exclamation marks (`!`) per baseline requirement `A-007`.
  - Enforces proper Armenian Unicode capitalization on sentence boundaries (`Ա`–`Ֆ`).
  - Synthesizes paragraph breaks when inter-segment acoustic pauses exceed the configurable threshold ($\tau_{\text{pause}} \ge 1.8\text{ s}$) (`FR-035`).

---

## 4. Real-Time Streaming and Processing Protocols

### 4.1 WebSocket Communication Protocol
Bidirectional communication between the browser client and the Python ASR streaming coordinator occurs via `/api/v1/stream/ws/{sessionId}`.


### 4.2 WebSocket Message Wire Formats

#### Client to Server: Control & Audio Frames
- **Handshake / Start Command (JSON):**
  ```json
  {
    "type": "start",
    "sessionId": "b476e3d2-2824-4f24-8b6f-d748f2c3d11a",
    "sampleRate": 16000,
    "options": {
      "armenianization": true,
      "punctuation": true,
      "modelId": "taruma/whisper-small-armenian"
    }
  }
  ```
- **Acoustic Payload:** Continuous binary WebSocket messages consisting of raw Little-Endian 16-bit Signed Integer PCM chunks sampled at 16,000 Hz (`Int16Array`).
- **Stop Command (JSON):**
  ```json
  { "type": "stop" }
  ```

#### Server to Client: Event Messages
- **Interim Hypothesis (`FR-017`):**
  ```json
  {
    "type": "interim_hypothesis",
    "text": "վաղը պետք է գնամ meeting-ի",
    "timestamp": 1729701024560
  }
  ```
- **Finalized Segment (`FR-018`, `FR-029`):**
  ```json
  {
    "type": "finalized_segment",
    "segmentId": "seg-9921",
    "start": 1.24,
    "end": 3.82,
    "rawText": "վաղը պետք է գնամ meeting-ի",
    "displayText": "Վաղը պետք է գնամ հանդիպման։",
    "replacements": [
      {
        "spanId": "span-01",
        "originalToken": "meeting-ի",
        "replacedWith": "հանդիպման",
        "lemma": "meeting",
        "startIndex": 18,
        "endIndex": 27,
        "confidence": 0.94,
        "status": "applied"
      }
    ]
  }
  ```
- **Diagnostic Latency Metric (`FR-021`):**
  ```json
  {
    "type": "diagnostic_latency",
    "segmentId": "seg-9921",
    "timeToFirstInterimMs": 320,
    "finalizationDelayMs": 480,
    "vadConfidence": 0.91
  }
  ```
- **Acoustic Backlog Notice (`FR-022`):**
  ```json
  {
    "type": "backlog_warning",
    "queueDurationSeconds": 2.4,
    "message": "Processing queue is delayed due to high computational load."
  }
  ```

---

## 5. PostgreSQL Database Architecture and Schema Specification

The database utilizes PostgreSQL 16+. It stores metadata, segmented transcript units, replacement tokens, offline dictionaries, user configurations, and diagnostic metrics.

```mermaid
erDiagram
    users ||--o{ transcription_sessions : owns
    transcription_sessions ||--o{ transcription_segments : contains
    transcription_sessions ||--o{ latency_metrics : records
    transcription_segments ||--o{ armenianization_spans : generates
    glossary_terms }o--|| users : customizes
    protected_terms }o--|| users : defines

    transcription_sessions {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar mode
        varchar status
        varchar source_file_name
        varchar source_file_url
        float duration_seconds
        timestamptz created_at
        timestamptz updated_at
    }

    transcription_segments {
        uuid id PK
        uuid session_id FK
        integer sequence_order
        float start_time
        float end_time
        text raw_text
        text finalized_text
        boolean is_edited
        timestamptz created_at
    }

    armenianization_spans {
        uuid id PK
        uuid segment_id FK
        varchar original_token
        varchar replacement_token
        varchar lemma
        integer start_char_index
        integer end_char_index
        float confidence
        varchar state
    }

    glossary_terms {
        uuid id PK
        uuid user_id FK
        varchar foreign_stem
        varchar armenian_lemma
        varchar category
        jsonb inflection_rules
        boolean is_system
    }

    protected_terms {
        uuid id PK
        uuid user_id FK
        varchar term
        varchar category
        boolean is_system
    }

    latency_metrics {
        uuid id PK
        uuid session_id FK
        uuid segment_id FK
        float time_to_first_interim_ms
        float finalization_delay_ms
        float processing_duration_ms
        timestamptz measured_at
    }
```

### 5.1 Relational Schema DDL (PostgreSQL)

```sql
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Transcription Sessions
CREATE TABLE transcription_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('audio_file', 'video_file', 'live_microphone')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('idle', 'preprocessing', 'transcribing', 'completed', 'failed', 'interrupted')),
    source_file_name VARCHAR(512),
    source_file_url TEXT,
    source_media_available BOOLEAN NOT NULL DEFAULT TRUE,
    duration_seconds REAL DEFAULT 0.0,
    model_identifier VARCHAR(128) NOT NULL,
    armenianization_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    punctuation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    has_unsaved_changes BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_date ON transcription_sessions(user_id, created_at DESC);
CREATE INDEX idx_sessions_status ON transcription_sessions(status);

-- 3. Transcription Segments (Ordered, Timed Transcription Units)
CREATE TABLE transcription_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES transcription_sessions(id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    raw_text TEXT NOT NULL,
    finalized_text TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_segments_session_order ON transcription_segments(session_id, sequence_order ASC);
CREATE INDEX idx_segments_time ON transcription_segments(session_id, start_time, end_time);

-- 4. Contextual Armenianization Replacement Spans (Traceability & Revert)
CREATE TABLE armenianization_spans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id UUID NOT NULL REFERENCES transcription_segments(id) ON DELETE CASCADE,
    original_token VARCHAR(128) NOT NULL,
    replacement_token VARCHAR(128) NOT NULL,
    lemma VARCHAR(128) NOT NULL,
    start_char_index INT NOT NULL,
    end_char_index INT NOT NULL,
    confidence REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    state VARCHAR(32) NOT NULL DEFAULT 'applied' CHECK (state IN ('applied', 'reverted', 'customized')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spans_segment ON armenianization_spans(segment_id);

-- 5. Curated Glossary Terms
CREATE TABLE glossary_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if global system default
    foreign_stem VARCHAR(128) NOT NULL,
    armenian_lemma VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'general',
    inflection_rules JSONB DEFAULT '{}'::jsonb,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_glossary_stem ON glossary_terms(foreign_stem);

-- 6. Protected Terms (Strict Non-Translation)
CREATE TABLE protected_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    term VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'brand', -- 'brand', 'person', 'identifier', 'acronym'
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_protected_term_user ON protected_terms(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'), LOWER(term));

-- 7. Diagnostic Latency Metrics (FR-021, AC-004)
CREATE TABLE latency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES transcription_sessions(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES transcription_segments(id) ON DELETE SET NULL,
    speech_start_offset REAL NOT NULL,
    time_to_first_interim_ms REAL NOT NULL,
    finalization_delay_ms REAL NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_latency_session ON latency_metrics(session_id);
```

### 5.2 Sequelize ORM Models and Connection Architecture

To guarantee type safety, transactional consistency, and connection lifecycle management in Next.js (across both Vercel Serverless and local Docker containers), database operations utilize **Sequelize** (`sequelize`, `pg`, `pg-hstore`).

#### Database Connection Singleton (`lib/db/sequelize.ts`)
```typescript
import { Sequelize } from 'sequelize';
import pg from 'pg';

declare global {
  var _sequelizeInstance: Sequelize | undefined;
}

const getSequelize = (): Sequelize => {
  if (process.env.NODE_ENV === 'production') {
    return new Sequelize(process.env.DATABASE_URL!, {
      dialect: 'postgres',
      dialectModule: pg,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: process.env.DB_SSL === 'true' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : {},
    });
  }

  // Prevent multiple connections during Next.js Hot Module Replacement in development
  if (!global._sequelizeInstance) {
    global._sequelizeInstance = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/barbar', {
      dialect: 'postgres',
      dialectModule: pg,
      logging: console.log,
      pool: { max: 5, min: 1, idle: 10000 },
    });
  }
  return global._sequelizeInstance;
};

export const sequelize = getSequelize();
```

#### Sequelize Model Definitions & Associations (`lib/db/models/index.ts`)
```typescript
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../sequelize';

// 1. TranscriptionSession Model
export interface SessionAttributes {
  id: string;
  userId?: string;
  title: string;
  mode: 'audio_file' | 'video_file' | 'live_microphone';
  status: 'idle' | 'preprocessing' | 'transcribing' | 'completed' | 'failed' | 'interrupted';
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

export class TranscriptionSession extends Model<SessionAttributes, Optional<SessionAttributes, 'id' | 'hasUnsavedChanges' | 'sourceMediaAvailable' | 'durationSeconds'>> implements SessionAttributes {
  public id!: string;
  public userId?: string;
  public title!: string;
  public mode!: 'audio_file' | 'video_file' | 'live_microphone';
  public status!: 'idle' | 'preprocessing' | 'transcribing' | 'completed' | 'failed' | 'interrupted';
  public sourceFileName?: string;
  public sourceFileUrl?: string;
  public sourceMediaAvailable!: boolean;
  public durationSeconds!: number;
  public modelIdentifier!: string;
  public armenianizationEnabled!: boolean;
  public punctuationEnabled!: boolean;
  public hasUnsavedChanges!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TranscriptionSession.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    mode: { type: DataTypes.ENUM('audio_file', 'video_file', 'live_microphone'), allowNull: false },
    status: { type: DataTypes.ENUM('idle', 'preprocessing', 'transcribing', 'completed', 'failed', 'interrupted'), allowNull: false },
    sourceFileName: { type: DataTypes.STRING(512), allowNull: true },
    sourceFileUrl: { type: DataTypes.TEXT, allowNull: true },
    sourceMediaAvailable: { type: DataTypes.BOOLEAN, defaultValue: true },
    durationSeconds: { type: DataTypes.FLOAT, defaultValue: 0.0 },
    modelIdentifier: { type: DataTypes.STRING(128), allowNull: false },
    armenianizationEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    punctuationEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    hasUnsavedChanges: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { sequelize, tableName: 'transcription_sessions', timestamps: true }
);

// 2. TranscriptionSegment Model
export class TranscriptionSegment extends Model {
  public id!: string;
  public sessionId!: string;
  public sequenceOrder!: number;
  public startTime!: number;
  public endTime!: number;
  public rawText!: string;
  public finalizedText!: string;
  public isEdited!: boolean;
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
  },
  { sequelize, tableName: 'transcription_segments', timestamps: true, updatedAt: false }
);

// 3. ArmenianizationSpan Model
export class ArmenianizationSpan extends Model {
  public id!: string;
  public segmentId!: string;
  public originalToken!: string;
  public replacementToken!: string;
  public lemma!: string;
  public startCharIndex!: number;
  public endCharIndex!: number;
  public confidence!: number;
  public state!: 'applied' | 'reverted' | 'customized';
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
    state: { type: DataTypes.ENUM('applied', 'reverted', 'customized'), defaultValue: 'applied' },
  },
  { sequelize, tableName: 'armenianization_spans', timestamps: true, updatedAt: false }
);

// Model Associations
TranscriptionSession.hasMany(TranscriptionSegment, { foreignKey: 'sessionId', as: 'segments', onDelete: 'CASCADE' });
TranscriptionSegment.belongsTo(TranscriptionSession, { foreignKey: 'sessionId' });

TranscriptionSegment.hasMany(ArmenianizationSpan, { foreignKey: 'segmentId', as: 'replacements', onDelete: 'CASCADE' });
ArmenianizationSpan.belongsTo(TranscriptionSegment, { foreignKey: 'segmentId' });
```

---

## 6. Contextual Armenianization and Punctuation Engine Specifications

### 6.1 Contextual Armenianization Engine Architecture
In accordance with `FR-028` through `FR-032`, Contextual Armenianization executes as an independent, modular text transformation stage following speech recognition.

```mermaid
flowchart TD
    RawInput["Raw Segment Recognizer Output"] --> Tokenizer["Token & Script Boundary Splitter"]
    Tokenizer --> TokenLoop{"Evaluate Token"}
    
    TokenLoop -->|Armenian Script Only| PassThrough["Keep Token (Pass-through)"]
    TokenLoop -->|Foreign / Mixed Script| ProtectedCheck{"Is in Protected Terms Registry?"}
    
    ProtectedCheck -->|Yes| ProtectedPreserve["Preserve Unchanged (FR-030)"]
    ProtectedCheck -->|No| MorphSplit["Morphological Stem & Ending Splitter"]
    
    MorphSplit --> DictLookup{"Match Curated Glossary Lemma?"}
    DictLookup -->|Direct Match| Inflect["Apply Armenian Suffix Inflection Rules"]
    DictLookup -->|No Match| ContextModel{"Optional Context Model (FR-032)"}
    
    ContextModel -->|Confidence >= Threshold| Inflect
    ContextModel -->|Confidence < Threshold| FlagLowConf["Keep Original & Flag Low Confidence"]
    
    Inflect --> SpanRecord["Create ArmenianizationSpan Metadata Record"]
    SpanRecord --> ReconstructedText["Reconstructed Display Text"]
    ProtectedPreserve --> ReconstructedText
    PassThrough --> ReconstructedText
    FlagLowConf --> ReconstructedText
```

#### Morphological Inflection Rules
Armenian attaches agglutinative grammatical suffixes to loanwords:
- **Rule 1 (Hyphenated Form):** `Stem-Suffix` $\rightarrow$ Example: `meeting-ի` $\rightarrow$ Stem: `meeting`, Suffix: `-ի` (Dative/Genitive). Look up `meeting` $\rightarrow$ Lemma: `հանդիպում`. Decline `հանդիպում` in Dative $\rightarrow$ `հանդիպման`.
- **Rule 2 (Transliterated Phonetic Form):** Detected loanwords matching phonetic transliterations (e.g., `միթինգ`, `ռեպորտ`). Strip endings: `ռեպորտը` $\rightarrow$ `ռեպորտ` + `-ը` (Definite Article). Substitute `ռեպորտ` $\rightarrow$ `հաշվետվություն` + `-ը` $\rightarrow$ `հաշվետվությունը`.
- **Rule 3 (Plural Agglutination):** `meeting-ները` $\rightarrow$ Stem: `meeting`, Suffix: `-ները` (Nominative Plural). Substitute $\rightarrow$ `հանդիպումները`.

#### Revert & Traceability Protocol (`FR-031`)
When a word is substituted, an `ArmenianizationSpan` record is generated containing the character range offsets within the text block. If the user clicks the rendered word in the UI editor and chooses "Revert to Original":
1. The span's state is updated from `applied` to `reverted` in the database.
2. The UI editor updates the slice from `replacement_token` back to `original_token`.
3. The original raw recognizer transcript remains permanently intact in the `raw_text` column.

### 6.2 Punctuation and Formatting Pipeline
To satisfy `FR-033`, `FR-034`, and `FR-035`:
1. **Sentence Boundary Marks:** Converts Western period (`.`) to Armenian full stop (`։`, `U+0589`). Question mark (`?`) and exclamation mark (`!`) are applied to the sentence boundary in MVP mode (`A-007`).
2. **Capitalization:** Automatically capitalizes the first character following an Armenian full stop, question mark, or exclamation mark:
   $$\text{char}_{i} = \text{toUpperArmenian}(\text{char}_i) \quad \text{if } \text{char}_{i-2 \dots i-1} \in \{ "։ ", "? ", "! " \}$$
3. **Paragraph Breaks:** Inserted dynamically when the acoustic silence between segment $n$ and segment $n+1$ satisfies:
   $$t_{\text{start}}^{(n+1)} - t_{\text{end}}^{(n)} \ge 1.8 \text{ seconds}$$

---

## 7. Media Ingestion and File Processing Subsystems

### 7.1 Audio and Video Ingestion Workflow
For prerecorded media (`UC-001`, `UC-002`, `FR-001`–`FR-012`):

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Next.js Frontend
    participant API as Next.js Route Handler
    participant S3 as Storage Bucket (R2 / S3 / MinIO)
    participant Worker as Python FFmpeg / ASR Worker
    participant DB as PostgreSQL

    User->>Web: Select / Drag-and-Drop Media File
    Web->>API: POST /api/v1/sessions/upload-intent (filename, size, mimeType)
    API->>DB: Create Session Record (Status: "preprocessing")
    API-->>Web: Pre-signed Upload URL + Session UUID
    Web->>S3: Direct Multi-part Binary Upload
    Web->>API: POST /api/v1/sessions/{id}/start-transcription
    API->>Worker: Dispatch Job (sessionId, mediaUrl)

    Worker->>S3: Stream File Header & Probe via FFprobe
    alt No Audio Track / Unsupported Codec
        Worker->>DB: Update Session Status: "failed" (Error: "NO_AUDIO_STREAM")
        Worker-->>Web: Push Error Notification
    else Valid Audio Stream Present
        Worker->>Worker: FFmpeg: Extract & Normalize to 16kHz Mono 16-bit PCM WAV
        Worker->>DB: Update Status: "transcribing", Set duration_seconds
        Worker->>Worker: Slice Audio into Overlapping VAD Segments (30s chunks)
        loop For Each Audio Segment
            Worker->>Worker: Faster-Whisper Decoding + Beam Search
            Worker->>Worker: Contextual Armenianization + Punctuation
            Worker->>DB: Insert TranscriptionSegment
            Worker-->>Web: WebSocket / SSE Push: Segment Completed (Progress %)
        end
        Worker->>Worker: Purge Temporary WAV File
        Worker->>DB: Update Session Status: "completed"
        Worker-->>Web: Push Completion Notice
    end
```

### 7.2 FFmpeg Transcoding Pipeline Specification
Audio extraction runs in isolated temporary scratch directories with strict safety flags:
```bash
ffmpeg -v error -i "{input_path}" -vn -acodec pcm_s16le -ac 1 -ar 16000 -f wav "{output_temp_wav}"
```
- `-vn`: Completely disables video stream decoding (eliminates GPU/CPU video processing overhead).
- `-acodec pcm_s16le`: Standardizes audio to uncompressed 16-bit Little-Endian signed linear PCM.
- `-ac 1`: Downmixes stereo/surround audio channels into a unified single channel (mono).
- `-ar 16000`: Resamples acoustic bandwidth to 16,000 Hz (native input frequency for Whisper and Silero VAD).
- **Integrity Guarantee:** The original user media file is opened with read-only descriptors (`rb`) and is never altered or deleted (`FR-003, FR-010`).

---

## 8. Export and Recovery Subsystems

### 8.1 Export Formats
To satisfy `FR-038` and `FR-039`, the platform provides three lossless export engines:

```mermaid
flowchart LR
    Segments[(Database Segments)] --> Dispatcher{"Export Mode"}
    
    Dispatcher -->|TXT| TXTGen["UTF-8 + Optional BOM Generator"]
    Dispatcher -->|DOCX| DOCXGen["DOCX Styles & Font Generator (Sylfaen/Noto)"]
    Dispatcher -->|SRT| SRTGen["SubRip Cue Formatter (HH:MM:SS,mmm)"]
    
    TXTGen --> TXTFile[".txt File Download"]
    DOCXGen --> DOCXFile[".docx File Download"]
    SRTGen --> SRTFile[".srt File Download"]
```

1. **UTF-8 Plain Text (`.txt`):**
   - Encodes text strictly in UTF-8.
   - Prepends the 3-byte Byte Order Mark `0xEF, 0xBB, 0xBF` by default (configurable in settings) to guarantee that legacy Windows Notepad and Microsoft Office correctly identify Armenian Unicode characters without garbling (`A-013`).
2. **Microsoft Word (`.docx`):**
   - Generates XML-based Word documents utilizing the `docx` library.
   - Sets document default fonts with explicit Armenian script fallbacks: `font: "Noto Sans Armenian", "Sylfaen", "Calibri"`.
   - Formats session title as Heading 1, date and duration as metadata header, and segmented paragraphs with standard 1.15 line spacing.
3. **SubRip Subtitle Format (`.srt`):**
   - Validates that segment timestamps exist (`start_time` and `end_time`).
   - Formats timestamp markers using standard comma-millisecond notation:
     ```text
     1
     00:00:01,240 --> 00:00:03,820
     Վաղը մենք ունենք հանդիպման։

     2
     00:00:04,100 --> 00:00:07,350
     Հետո կուղարկեմ հաշվետվությունը։
     ```
   - If timestamps are absent (e.g., legacy or interrupted sessions), the SRT export button is disabled in the UI with a descriptive tooltip explanation (`FR-039`).

### 8.2 Crash Resilience & Draft Recovery
To prevent data loss during browser crashes, power failures, or unexpected network disconnects (`UC-004`, `FR-039`, `6.2`):
- **Live Local Storage Draft Mirror:** The active transcript state is mirrored to client browser `IndexedDB` every 3 seconds.
- **Server-Side Segment Append:** During live sessions, finalized segments are written to PostgreSQL immediately upon boundary commitment.
- **Session Recovery Guard:** Upon application reload, the Next.js frontend checks for orphaned sessions (`status = 'transcribing'` or `'interrupted'`). If detected, an alert banner offers one-click session restore from the database and IndexedDB cache.

---

## 9. Security, Privacy and Operational Reliability

### 9.1 Data Privacy & Isolation
- **100% Offline Capability:** In local deployment mode, all components run without outbound internet access.
- **No Speech Leakage in Diagnostics:** System latency logs (`latency_metrics`) and operational logs strictly record timing offsets, frame counts, and error codes; no raw audio bytes or transcribed Armenian text strings are ever written to application diagnostic logs (`FR-021`, `AC-009`).
- **Temporary File Cleansing:** Extracted intermediate WAV tracks in scratch folders are automatically unlinked within a `finally` execution block upon job completion or failure.

### 9.2 Error Handling and Fault Tolerance
Every anticipated failure scenario specified in Section 6.2 of `FRS-STT-001` is mapped to an actionable UI response and graceful system recovery:

| Error Condition | Internal Code | System Behavior | User Interface Presentation |
|---|---|---|---|
| **Corrupted Media File** | `ERR_MEDIA_CORRUPTED` | FFprobe returns non-zero code; aborts job before extraction. | Modal notification: "The selected file is corrupted or unreadable. Please select another file." |
| **Video Without Audio** | `ERR_NO_AUDIO_STREAM` | FFprobe reports 0 audio streams; temporary job purged. | Warning banner: "The selected video file contains no audio track." |
| **Microphone Permission Denied**| `ERR_MIC_PERMISSION_DENIED`| Web Audio catches `NotAllowedError`. | Guided modal with visual steps explaining how to grant microphone access in browser/OS settings (`FR-013`). |
| **Microphone Disconnected** | `ERR_MIC_DEVICE_LOST` | `devicechange` listener catches active ID loss; pauses capture. | Non-blocking persistent banner: "Microphone disconnected. Please reconnect or select another input device." Transcript preserved (`FR-020`). |
| **Inference Backlog** | `WARN_INFERENCE_BACKLOG` | Queue length exceeds 3 chunks ($\Delta t > 2\text{ s}$). | Subdued status indicator: "High server load. Transcription may experience slight delay" (`FR-022`). |
| **Armenianization Fault** | `ERR_NLP_PIPELINE_FAULT` | Exception inside morphology/glossary parser caught safely. | Falls back seamlessly to raw recognizer text; flags segment for manual review (`6.2`). |

---

## 10. Experimental Evaluation and Verification Methodology

To fulfill `AC-004` and `AC-005`, the system embeds measurement harnesses for quantitative evaluation:

### 10.1 Word Error Rate (WER) and Character Error Rate (CER) Framework
The testing harness integrates `jiwer` to benchmark candidate models (`faster-whisper-small`, `whisper-arm-finetuned`, `sherpa-onnx`) against the project reference test corpus (`7.3`):
$$\text{WER} = \frac{S + D + I}{N} = \frac{\text{Substitutions} + \text{Deletions} + \text{Insertions}}{\text{Total Reference Words}}$$
$$\text{CER} = \frac{S_c + D_c + I_c}{N_c} = \frac{\text{Character Substitutions} + \text{Deletions} + \text{Insertions}}{\text{Total Reference Characters}}$$
- Standardized text normalization is executed before evaluation: lowercase conversion of Armenian alphabet (`U+0531`–`U+0556` $\rightarrow$ `U+0561`–`U+0586`), punctuation stripping, and whitespace collapse.

### 10.2 Real-Time Latency Measurement Harness (`FR-021, AC-004`)
For real-time microphone sessions, the server records exact timestamps using high-resolution monotonic clocks (`time.perf_counter()`):
1. $T_{\text{speech\_start}}$: Timestamp when Silero VAD flags the onset of speech in the audio stream.
2. $T_{\text{first\_interim}}$: Timestamp when the first partial interim hypothesis is delivered over the WebSocket.
3. $T_{\text{finalized}}$: Timestamp when the finalized segment (with Armenianization and punctuation) is committed and broadcast.
$$\text{Time to First Interim} = T_{\text{first\_interim}} - T_{\text{speech\_start}}$$
$$\text{Finalization Delay} = T_{\text{finalized}} - T_{\text{speech\_end}}$$
Metrics are stored in `latency_metrics` and rendered in the diagnostic dashboard.

---

## 11. Traceability Matrix

This matrix maps every functional requirement (`FR`), user interface requirement (`UI`), and acceptance criterion (`AC`) from `FRS-STT-001` to its architectural component in `SDD-STT-001`.

| FRS Requirement ID | Description Summary | Implementing Component / Architecture Location |
|---|---|---|
| **FR-001 – FR-007** | Audio Import, Validation, Preprocessing, Progress | Next.js Upload Handler, FFmpeg Extraction Worker, Faster-Whisper Pipeline (Section 7) |
| **FR-008 – FR-012** | Video Import, Audio Extraction, Timestamps | FFmpeg Video Demuxer, Timed Segments Pipeline (Section 7.1, 7.2) |
| **FR-013 – FR-023** | Real-Time Microphone Capture, Interim/Final, Latency | Web Audio Worklet, WebSocket Controller, Silero VAD, LocalAgreement-2 (Section 3.1, 4.1) |
| **FR-024 – FR-027** | Armenian ASR, Replaceable Engine Strategy | `ISpeechRecognitionEngine`, `HuggingFaceArmenianWhisperEngine`, `HuggingFaceTransformersEngine` (Section 3.3) |
| **FR-028 – FR-032** | Contextual Armenianization, Glossary, Revert | `ContextualArmenianizer`, Morphology Splitter, `armenianization_spans` (Section 3.3, 5.1, 5.2, 6.1) |
| **FR-033 – FR-035** | Armenian Punctuation (`։`, `?`, `!`), Paragraphs | `ArmenianPunctuationEngine`, Acoustic Pause Segmenter (Section 6.2) |
| **FR-036 – FR-039** | Rich Editor, Undo/Redo, TXT/DOCX/SRT Export | Tiptap Transcript Editor, Next.js Server Export Engine (Section 3.1, 8.1) |
| **FR-040 – FR-041** | Session History, Persistence, Missing Media | PostgreSQL `transcription_sessions` & `transcription_segments` via Sequelize ORM (Section 5.1, 5.2) |
| **FR-042** | Synchronized Audio Playback & Review | Web Audio / HTML5 Audio Sync Controller, ProseMirror Timestamp Marks (Section 3.1) |
| **UI-001 – UI-006** | UI Navigation, Workspace, Live Indicator, Settings | Next.js App Router, Tailwind CSS, Shadcn UI, Zustand State Store (Section 3.1) |
| **AC-001 – AC-009** | Acceptance Criteria & Verification Scenarios | Test Harness, WER/CER Benchmarking, Latency Logging Subsystem (Section 10) |

---

## 12. Conclusion

The architecture specified in **SDD-STT-001** fulfills all requirements of the BarBar speech-to-text project. By leveraging **Next.js 15 (React 19)** for the presentation and application tier, **PostgreSQL** with **Sequelize ORM** for relational data integrity, **FastAPI + Hugging Face fine-tuned Armenian ASR models + Silero VAD** for acoustic transcription, and a dedicated **Morphological Contextual Armenianization** engine, the platform achieves high transcription accuracy, responsive real-time streaming, and flexible deployment across both cloud (Vercel) and local offline environments.

