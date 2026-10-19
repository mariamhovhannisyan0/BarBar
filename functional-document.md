# Functional Requirements Specification

## Development of a Speech-to-Text Transcription Application (Armenian, Windows Desktop)

*Bachelor's diploma project in Software Engineering*

| Field | Value |
|---|---|
| Document ID | FRS-STT-001 |
| Version / status | 1.0 / Draft for review |
| Date | October 2026 |
| Author | [Student full name] |
| Supervisor | [Academic title and name] |
| University | [Name of University] |

> Items in square brackets are placeholders to be completed before submission. Details not given by the project owner are marked as assumptions (A-nnn, Section 6). Technology choices and system architecture are intentionally out of scope of this document and belong to the design phase.

---

## 1. Introduction, Purpose and Scope

This document specifies **what** the application shall do. It is the basis for the design, implementation, and testing stages of the diploma project.

The application converts spoken **Armenian** into written Armenian text (Armenian alphabet) from three sources:

1. prerecorded audio files,
2. video files (the audio track is extracted),
3. live microphone input,

and displays the recognized text on screen. It is a stand-alone **Windows desktop** application with an editable transcript, local transcription history, and export to TXT, DOCX, and SRT. It prioritizes Armenian recognition quality, usability, responsiveness, data privacy (local processing by default), and reliability.

**Conventions**

- Unique IDs: `FR` functional requirement, `UI` interface requirement, `UC` use case, `AC` acceptance criterion; `A` / `C` / `L` assumption / constraint / limitation.
- Priority mapping: **High = Must Have** (minimum viable product, MVP), **Medium = Should Have**, **Low = Could Have** (optional) or **Future Scope** (after the diploma project).
- "Shall" means mandatory within its priority class. Should Have, Could Have, and Future Scope items are never mandatory for the MVP.
- Features whose success depends on the speech recognition model are never described as guaranteed. Numbers that need experiments (for example latency) are determined and validated during prototyping and testing.

**In scope (MVP):** audio, video, and live transcription; Armenian recognition; contextual Armenianization of foreign words; basic punctuation; editing; saving; TXT and DOCX export; local history; error handling; local processing.

**Out of scope:** speaker diarization, summarization, other languages, cloud services, batch processing.

---

## 2. Project Overview and Stakeholders

### 2.1 Transcription modes

| Mode | Input and processing | Output |
|---|---|---|
| Audio file | Prerecorded file (WAV, MP3, M4A, and other feasible formats); preprocessing, segmented recognition, progress display | Editable Armenian transcript |
| Video file | MP4, AVI, MKV, MOV, and other feasible formats; audio track extracted, original file never modified, then processed like audio | Editable transcript, optional timestamps |
| Real-time microphone | Continuous capture, recognition in small chunks, text shown while the user speaks with the lowest technically achievable delay | Live text; editable after the session |

### 2.2 Interim versus finalized transcription

| | Interim transcription | Finalized transcription |
|---|---|---|
| Meaning | Preliminary text shown with minimal delay; may be corrected | Refined text of a processed segment: normalization, Armenianization, punctuation |
| Behavior | Shown on the first available hypothesis; replaced in place by better results; distinct visual style | Committed when stable or when a pause ends the segment; not changed by the recognizer afterwards, only by the user |

The system must not wait for the user to finish a sentence before showing recognized text.

### 2.3 Stakeholders and users

Student developer, academic supervisor and examination committee, and Armenian-speaking end users (students, researchers, journalists, office staff, people who prefer dictation or need captions) with limited technical experience.

---

## 3. Functional Requirements

Priority mapping: High = Must Have, Medium = Should Have, Low = Could Have or Future Scope. Recognition quality depends on the selected speech recognition model, available Armenian training data, recording quality, speaker characteristics, and environmental conditions. It is measured, not assumed.

### 3.1 Audio File Import and Transcription

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-001 | **Import and formats.** Select a file by dialog or drag-and-drop; accept WAV, MP3, M4A. Further technically feasible formats (for example FLAC, OGG) are Should Have. | High (Must) | File registered as source; last folder remembered | File path → registered source |
| FR-002 | **Validation and information.** Check that the file exists, is non-empty and decodable; report unsupported or corrupted files; show name, format, and duration where feasible. | High (Must) | Specific error message; application stays usable | File → accepted or rejected, plus info |
| FR-003 | **Preprocessing.** Convert the audio into a format suitable for the recognition engine, using a temporary location. | High (Must) | Original file never modified | Audio → engine-ready audio |
| FR-004 | **Start, cancel, pause.** Start transcription; cancel at any time. Pause, resume, and restart are Should Have where technically supported and take effect at segment boundaries. | High (Must) | Resources and temporary files released; partial text kept or discarded by the user | Command → job state |
| FR-005 | **Armenian recognition, long files.** Recognize Armenian and generate Armenian text; process long recordings in segments without losing the correct sequence of text. | High (Must) | Correct order; no segment lost or repeated | Audio → ordered text |
| FR-006 | **Progress, notification, result.** Show status (for example Preprocessing, Transcribing, Completed, Failed) and progress; notify on success or error; show the text in an editable area, appended progressively. | High (Must) | Progress updated at least per segment; editing never corrupts incoming segments | Segments → editor text |
| FR-007 | **Uncertainty handling.** The system does not claim perfect accuracy; a persistent notice asks users to review results. Highlighting of low-confidence words is Should Have. | High (Must) | Notice shown with every automatic transcript | Transcript → notice |

### 3.2 Video File Import and Transcription

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-008 | **Import and formats.** Import video by dialog or drag-and-drop; accept MP4, AVI, MKV, MOV. Other feasible formats (WebM, WMV, ...) are Should Have. | High (Must) | File registered as source | Video path → source |
| FR-009 | **Validation and errors.** Check the video's streams; handle videos without audio track, unsupported codecs, corrupted files, and extraction failures with clear messages. | High (Must) | No crash; user may choose another file | Video → result or error |
| FR-010 | **Audio extraction.** Extract the audio track with a suitable media-processing tool and preprocess it; the video is opened read-only and never modified. | High (Must) | Temporary audio removed after the job | Video → engine-ready audio |
| FR-011 | **Transcription and display.** Transcribe Armenian speech, show progress including an "Extracting audio" stage, and present editable text in spoken order. | High (Must) | Same behavior as for audio files | Audio → transcript |
| FR-012 | **Timestamps.** Associate transcript segments with start and end times where technically feasible, to support navigation and subtitles. | Medium (Should) | Stored with segments; dependent features disabled if absent | Segments → timed segments |

### 3.3 Real-Time Microphone Transcription

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-013 | **Microphone selection and access.** List available input devices, preselect the default, allow another choice; detect denied microphone access and explain how to enable it in Windows privacy settings. | High (Must) | Guidance dialog; session does not start without access | Selection → active device |
| FR-014 | **Start/stop and indicator.** Clear Start and Stop controls; visual indication that capture and transcription are active. An input level meter is Should Have. | High (Must) | Indicator changes immediately | Command → session state |
| FR-015 | **Continuous capture and chunking.** Capture continuously until the user stops; recognize speech in small audio chunks; detect speech and silence so that silence produces no text. | High (Must) | No gaps caused by processing; stable long sessions | Microphone audio → audio chunks |
| FR-016 | **Incremental display.** Show recognized text on screen while the user is speaking; never wait for the end of a sentence or recording. | High (Must) | Text appears progressively, with the lowest practical delay | Recognition results → screen text |
| FR-017 | **Interim results and updates.** Show preliminary text immediately in a distinct style; replace it in place when a more reliable result is produced. | High (Must) | No duplicated words caused by updates | Preliminary result → interim text |
| FR-018 | **Finalization.** Convert interim text into finalized segments as speech progresses, by a documented stability rule (for example consecutive results agree, or a pause ends the segment); apply Armenianization and punctuation to finalized text. | High (Must) | Segment appended, removed from interim area, stored with times | Stable text → finalized segment |
| FR-019 | **Order, no loss or duplication.** Maintain the correct order of words and sentences; finalized segments are neither duplicated nor lost. | High (Must) | Each phrase appears once, in spoken order | Overlapping results → clean transcript |
| FR-020 | **Device and recognition errors.** Handle microphone disconnection, unavailable or busy devices, silence, background noise, and recognition failures without ending the session unnecessarily. | High (Must) | Text preserved; non-blocking notices; user can reselect a device and continue | Errors → recovery |
| FR-021 | **Latency measurement.** Record, per segment, the time of speech start, of the first interim text, and of finalization, so that latency can be measured: time to first interim text, update interval, finalization delay. Targets are set after prototyping; no response time is guaranteed. | High (Must) | Diagnostic log without audio or text content | Events → latency log |
| FR-022 | **Backlog, session audio, timestamps.** Detect when recognition cannot keep up (notify the user and suggest settings); optionally save session audio locally (default off); store live segment timestamps. | Medium (Should) | Audio never dropped silently; enables playback and SRT | Queue, audio → adapted behavior, files |
| FR-023 | **Review and edit after the session.** Finalized text is read-only during the session (A-012) and becomes editable after Stop. | High (Must) | Transcript editable and stored | Stopped session → editable text |

### 3.4 Armenian Speech Recognition

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-024 | **Armenian script output.** Recognize standard Armenian speech (assumed Eastern Armenian, A-005), continuous speech, and speech with natural pauses; output text in the Armenian alphabet; support long speech and recordings. | High (Must) | Baseline evaluation condition | Speech → Armenian text |
| FR-025 | **Conversational, dialectal, noisy speech.** Aim to recognize conversational Armenian, common dialectal expressions, differences in pronunciation and speed, and speech with moderate background noise, to the extent the model allows. These are quality objectives to be evaluated experimentally, not guarantees. | Medium (Should) | Evaluated and reported separately per condition | Speech → text |
| FR-026 | **Meaning and correction.** Post-processing must not change the speaker's meaning; the unprocessed recognizer output is retained; users can correct words manually. | High (Must) | Every automatic change is traceable and reversible | Raw text → final text |
| FR-027 | **Replaceable engine.** The recognition engine can be exchanged and compared with alternatives without changing the rest of the application; the active model is shown. | High (Must) | Two engine configurations comparable on the same data | Configuration → engine |

### 3.5 Foreign Words and Mixed-Language Speech

Contextual Armenianization is a **separate text-processing responsibility** and is not assumed to be provided by the speech recognition model alone.

Illustration (not a fixed rule): the spoken sentence "Վաղը պետք է գնամ meeting-ի, հետո ուղարկեմ report-ը։" should be displayed as "Վաղը պետք է գնամ հանդիպման, հետո ուղարկեմ հաշվետվությունը։". Equivalents are chosen by context, not by literal translation.

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-028 | **Separate module and detection.** Implement as a distinct step after recognition; detect foreign words (Latin or Cyrillic script, foreign stems with Armenian endings, known transliterated loanwords) where technically feasible. | High (Must) | Module can be enabled, disabled, tested, and replaced independently | Text → candidate foreign words |
| FR-029 | **Basic contextual Armenianization.** Choose Armenian equivalents from a curated glossary (everyday, software, and professional terms) using sentence context; carry Armenian endings (case, article, plural) onto the equivalent (for example meeting-ի → հանդիպման). In live mode it is applied to finalized segments without delaying interim text; light substitution on interim text is Should Have. | High (Must) | Low confidence: original word kept and flagged; no meaning-changing literal translation | Segment → Armenianized segment |
| FR-030 | **Protected terms.** Never translate personal names, brand and product names, programming identifiers, abbreviations, and other terms where translation would be inaccurate. User-defined protected terms are Should Have. | High (Must) | Protected terms stay unchanged | Word → translate or protect |
| FR-031 | **Review, toggle, original text.** Mark substituted words; show the original word, revert it, or choose another equivalent; retain the original recognizer text; setting to enable or disable Armenianization (default: enabled). | High (Must) | One-action revert | User action → updated text |
| FR-032 | **Advanced (model-based) translation.** For terms outside the glossary, use a suitable language-processing or translation component if prototyping shows it is adequate. | Medium (Should) | Confidence-scored and always reviewable | Term + context → equivalent |

### 3.6 Punctuation and Text Formatting

Automatic punctuation is distinct from the underlying speech recognition. It is a separate step with limitations (Section 6).

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-033 | **Automatic punctuation.** A separate, replaceable step that adds sentence boundaries, full stops, and commas to finalized text where feasible; interim text is never delayed for punctuation; users can edit punctuation manually. | High (Must) | Quality evaluated, not guaranteed | Finalized text → punctuated text |
| FR-034 | **Armenian conventions.** Use the Armenian full stop "։"; questions and exclamations use "?" and "!" in the MVP (A-007). Distinguishing statements, questions, and exclamations is Should Have; Armenian marks "՞", "՜", "՛" placed on words are Could Have. | High (Must) | Uncertain cases receive minimal punctuation; meaning is never changed by punctuation | Sentence → terminal mark |
| FR-035 | **Paragraphs and formatting.** Paragraphs at long pauses, capital letters at sentence starts, consistent spacing; option to disable. | Medium (Should) | Words are never changed | Pauses → paragraphs |

### 3.7 Text Editing, Saving, and Exporting

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-036 | **Editor.** Editable text area with correct Armenian rendering; select, copy, cut, paste, delete, modify, undo and redo; select and copy all; correct words and punctuation. | High (Must) | Standard shortcuts work | Edits → text |
| FR-037 | **Save and data-loss prevention.** Save locally with a user-chosen file name and location; confirm before overwriting; warn about unsaved changes; notify on success or error. | High (Must) | Save, discard, or cancel choice | Transcript → file |
| FR-038 | **TXT and DOCX export.** Export TXT (UTF-8) and DOCX; preserve Armenian characters and encoding correctly. | High (Must) | Saved text identical to the displayed text | Transcript → .txt, .docx |
| FR-039 | **SRT export and autosave.** Export SRT when timestamps are available (otherwise disabled with an explanation); periodically save drafts and offer recovery after a crash. | Medium (Should) | Valid UTF-8 subtitle cues; restore offered at next start | Timed segments → .srt; draft |

### 3.8 Transcription History and File Management

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-040 | **History records.** Keep a local history of completed and interrupted sessions (title, source file, date, duration, mode, status), newest first, preserved across restarts; reopen, rename, and delete (with confirmation) transcripts; original media files are never deleted. | High (Must) | Stored locally, for example in a local database; changes persist | Session → history entry |
| FR-041 | **Search and missing media.** Search and filter by title, text, date, and mode (Should Have); transcripts remain usable when the source media was moved or deleted, and playback is disabled with an explanation. | High (Must) | Entry marked "source unavailable" | Query → filtered list |

### 3.9 Audio Playback and Transcript Review

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-042 | **Playback and review.** Play the original or extracted audio (play, pause, stop, seek), show timestamps, jump to a segment's audio position by selecting it, highlight the current segment where feasible. Auto-scroll and speed control are Could Have. | Medium (Should) | Disabled gracefully if audio or timestamps are missing | Segment selection → audio position |

### 3.10 Additional Intelligent Features (optional and future)

| ID | Title and description | Priority | Expected behavior / outcome | Input → Output |
|---|---|---|---|---|
| FR-043 | **Optional features.** Search within transcript, keyword identification, subtitle editing and synchronization. | Low (Could) | Only if time permits | Transcript → results |
| FR-044 | **Future features.** Summarization, key ideas, meeting minutes, speaker identification (diarization), grammar and spelling suggestions, batch transcription, Western Armenian. | Low (Future) | Outside the diploma scope | Transcript → analysis |

---

## 4. User Interface Requirements

The interface shall be intuitive, modern, clear, and suitable for users with limited technical experience. State is always shown in words, not by color alone; destructive actions need confirmation; Windows conventions and shortcuts are followed.

| ID | Screen | Requirement | Priority |
|---|---|---|---|
| UI-001 | Main window | Application title and navigation; options for Audio File, Video File, and Live Microphone; clear file selection area (drop zone, Browse button, file information); buttons to start, stop, and manage transcription; progress indicator or live status; access to Settings and History. | High (Must) |
| UI-002 | Transcription workspace | Dominant editable text area; interim text clearly distinct from finalized text (for example gray italic); processing status and progress; Copy all, Save, Export (TXT, DOCX, SRT), undo and redo; Armenianized words marked, showing the original with a revert option; unsaved-changes indicator; notice to review results. Showing original text, confidence highlighting, and a playback bar are Should Have. | High (Must) |
| UI-003 | Live transcription interface | Microphone selector with refresh; Start and Stop; recording indicator with elapsed time; live text that scrolls to the newest text; non-blocking banners for device and error notifications; input level meter (Should Have). | High (Must) |
| UI-004 | Transcription history | List with title, source, date, duration, mode, and status; Open, Rename, Delete (with confirmation); sources that are unavailable are marked; search and filters (Should Have). | High (Must) |
| UI-005 | Settings (mandatory) | Microphone input device; default save location; Armenianization on or off. | High (Must) |
| UI-006 | Settings (optional) | Automatic punctuation on or off; recognition model choice (if several are installed); save live-session audio; low-confidence highlighting; paragraph pause length; text size; custom glossary and protected terms; offline-only mode. Interface language is Future Scope. Only technically justified settings are offered. | Medium (Should) |

---

## 5. Use Cases

### UC-001: Transcribe an Audio File
- **Primary actor:** User
- **Preconditions:** Application running; recognition model available; file exists.
- **Trigger:** File chosen in Audio mode.
- **Main flow:**
  1. User chooses a file; the system validates it and shows its information.
  2. User presses Start.
  3. The system preprocesses and segments the audio and recognizes it, showing progress.
  4. Armenianization and punctuation are applied; text is appended to the editable area.
  5. The system notifies completion and creates a history entry.
- **Alternative flows:** Cancel; pause and resume; restart.
- **Exceptions:** Unsupported or corrupted file; model cannot be loaded; segment recognition failure (gap marked); insufficient disk space.
- **Postconditions:** Transcript in the editor and history; original file unchanged.

### UC-002: Transcribe a Video File
- **Primary actor:** User
- **Preconditions:** As UC-001; the video contains an audio track.
- **Trigger:** File chosen in Video mode.
- **Main flow:**
  1. User chooses a video; the system validates it.
  2. User presses Start.
  3. The system extracts and preprocesses the audio.
  4. Recognition proceeds as in UC-001.
  5. Timestamps are stored and temporary files removed.
- **Alternative flows:** Choosing another audio track (Should Have).
- **Exceptions:** No audio track; unsupported codec; extraction failure; cancel during extraction.
- **Postconditions:** Transcript with timestamps where available; video unchanged.

### UC-003: Start Real-Time Armenian Transcription
- **Primary actor:** User
- **Preconditions:** Microphone connected and permitted by Windows; recognition model available.
- **Trigger:** User presses Start in Live mode.
- **Main flow:**
  1. User selects a microphone and presses Start; the recording indicator turns on.
  2. User speaks Armenian.
  3. Interim text appears and is replaced in place as better results arrive.
  4. Stable text is finalized (Armenianization, punctuation) and appended.
  5. On Stop, remaining speech is finalized, the microphone is released, the transcript becomes editable and is stored.
- **Alternative flows:** Saving session audio (Should Have).
- **Exceptions:** Microphone access denied (guidance shown); device busy; device disconnected (text preserved, user reselects and continues); silence (no text added); recognition failure on a chunk (logged, session continues); recognition falling behind (user notified).
- **Postconditions:** Editable transcript in history; no audio kept unless the user opted in.

### UC-004: Review and Edit a Transcript
- **Primary actor:** User
- **Preconditions:** A transcript is open.
- **Trigger:** User edits text or opens a marked word.
- **Main flow:**
  1. User reads the transcript; Armenianized words are marked.
  2. User corrects words and punctuation (copy, cut, paste, delete, undo, redo).
  3. User reverts or changes Armenianized words.
  4. The unsaved-changes indicator is shown; the user saves.
- **Alternative flows:** Show original recognizer text; add a term to the glossary (Should Have).
- **Exceptions:** Closing with unsaved changes (prompt); read-only during a live session; crash (draft offered for restore).
- **Postconditions:** Corrections saved or discarded as chosen.

### UC-005: Save and Export a Transcript
- **Primary actor:** User
- **Preconditions:** A transcript is open.
- **Trigger:** User presses Save or Export.
- **Main flow:**
  1. User saves to the history.
  2. User chooses Export, the format (TXT, DOCX, SRT), file name, and folder.
  3. The system writes the file with correct Armenian encoding and shows a success notice.
- **Alternative flows:** Overwrite confirmation; SRT disabled when no timestamps exist.
- **Exceptions:** Read-only folder, locked file, full disk (no partial file left).
- **Postconditions:** File correct at the chosen location; history up to date.

### UC-006: View and Manage Transcription History
- **Primary actor:** User
- **Preconditions:** Saved transcripts exist.
- **Trigger:** User opens History.
- **Main flow:**
  1. The system lists saved transcripts with metadata.
  2. User opens an entry.
  3. User renames an entry.
  4. User deletes an entry after confirmation.
- **Alternative flows:** Search and filter (Should Have).
- **Exceptions:** Source media missing (entry marked, still opens); history unreadable (damaged file preserved, new history started).
- **Postconditions:** History persists after restart.

### UC-007: Review Transcript Alongside Audio Playback
- **Primary actor:** User
- **Preconditions:** Audio source exists; timestamps exist for navigation (Should Have use case).
- **Trigger:** User presses Play.
- **Main flow:**
  1. The system loads the audio.
  2. User plays it; the current segment is highlighted.
  3. User pauses, stops, or seeks.
  4. User selects a segment to jump to its audio position.
  5. User corrects text while listening.
- **Alternative flows:** Speed control, auto-scroll (Could Have).
- **Exceptions:** Audio missing or undecodable; no timestamps (navigation disabled, playback still works).
- **Postconditions:** Transcript reviewed; audio unchanged.

---

## 6. Data Management, Error Handling, Assumptions, and Limitations

### 6.1 Data management

All data is stored locally: transcript text (raw and processed segments with times), history metadata, glossary, and settings in a local database in the user's profile; temporary audio removed after jobs; optional saved session audio; logs without transcript text. Database writes are transactional. Deleting a transcript removes its segments (and stored audio on request). Original media files are never deleted. Armenian text is stored and exported in UTF-8 without loss.

### 6.2 Error handling

Every error gives a plain, actionable message, a log entry, and leaves the application usable. Covered cases: unsupported or corrupted file; video without audio; extraction failure; inaccessible file; insufficient disk space; missing recognition model; segment failure (retry once, mark a gap); microphone denied, busy, or disconnected; silence; live recognition falling behind; Armenianization or punctuation failure (fall back to unprocessed text); save or export failure (no partial file); database error; unsaved changes; application crash (restore draft).

### 6.3 Assumptions

| ID | Assumption |
|---|---|
| A-003 | Target systems are 64-bit Windows 10 and Windows 11. |
| A-005 | The primary language variant is standard Eastern Armenian; Western Armenian is Future Scope. |
| A-007 | In the MVP, questions and exclamations end with "?" and "!", statements with the Armenian full stop "։". |
| A-008 | A locally runnable recognition model of acceptable quality exists for Armenian; this is validated by prototyping. |
| A-011 | Test recordings are collected from volunteer speakers with informed consent, supplemented by public data whose licences allow it. |
| A-012 | During a live session, finalized text is read-only; editing is enabled after Stop. |
| A-013 | TXT exports use UTF-8 with a byte-order mark by default, switchable in settings. |

**Constraints (C).** C-001: individual project with a fixed schedule. C-002: free, licence-compatible components. C-003: no paid external service for core functions.

### 6.4 Limitations

- L-001: Recognition quality depends on the selected model and the available Armenian-language data, and must be measured.
- L-002: Dialects, accents, fast speech, overlapping speakers, and background noise reduce accuracy.
- L-003: Live text may initially be incomplete or wrong and is revised later.
- L-004: Contextual Armenianization has limited coverage and may require a separate language-processing component.
- L-005: Punctuation and paragraph formatting are not guaranteed to be perfect.
- L-006: Processing speed depends on hardware, recording length, and model size.
- L-007: Offline operation depends on locally available models and components.
- L-008: Some file formats may require additional codecs or conversion tools.
- L-009: Speaker diarization and intelligent text features are outside the first implementation scope.

---

## 7. Prioritization, Acceptance Criteria, and Future Enhancements

### 7.1 Prioritization

Of the 44 requirements in Section 3: **35 Must Have** (audio, video, and live transcription with interim and finalized text; Armenian recognition; basic Armenianization; basic punctuation; editing; TXT and DOCX export; history; error handling), **7 Should Have** (pause and resume, SRT and timestamps, playback, model-based Armenianization, autosave, backlog handling, conversational and dialectal evaluation, paragraph formatting), **1 Could Have**, **1 Future Scope**. Priorities are identical wherever a feature is mentioned.

### 7.2 Acceptance criteria

| ID | Covers | Acceptance criterion | Verification |
|---|---|---|---|
| AC-001 | Audio and video import | WAV, MP3, M4A, MP4, AVI, MKV, MOV samples are accepted and transcribed with progress and a completion notice; original files remain unchanged; invalid, no-audio, corrupted, and unsupported-codec files produce specific errors. | Functional and fault tests |
| AC-002 | Live capture and incremental display | Devices are listed; the indicator is active while capturing; denied access shows guidance; Stop releases the microphone; text appears before the sentence or passage is finished. | Hardware test, screen recording or timestamp log |
| AC-003 | Interim to final | Interim text is visually distinct and replaced in place; every phrase appears exactly once, in order, in the final transcript; the interim area is empty after Stop. | Scripted test |
| AC-004 | Latency | Time to first interim text, update interval, and finalization delay are measured on defined hardware with repetitions; median and spread are reported; targets are set from the measurements. | Measurement report |
| AC-005 | Armenian recognition | Word error rate and character error rate are computed per condition (standard, conversational, dialectal, noisy) for every candidate model; no threshold is assumed in advance. | Evaluation and test report |
| AC-006 | Armenianization | The illustrative sentence in Section 3.5 yields the expected output; protected terms stay unchanged; low-confidence cases stay unchanged and flagged; revert works; detection and replacement quality on a mixed-language set is reported. | Text-level tests, human judgment |
| AC-007 | Punctuation, editing, export | Sentences end with "։" (or "?" and "!" per A-007); punctuation is editable; copy, paste, and undo work; unsaved-changes dialog appears; TXT round trip is identical; DOCX opens in Word; SRT is valid; failures leave no partial file. | Functional tests, file checks |
| AC-008 | History | Sessions of all modes persist after restart with their metadata; open, rename, delete work; missing source media is handled. | Functional tests |
| AC-009 | Errors, compatibility, privacy | Section 6.2 scenarios behave as specified; the application works on clean Windows 10 and Windows 11 and on a computer without a dedicated graphics card; no network traffic and no transcript text in logs during tests; Must Have functions work offline. | Fault injection, network monitoring |

### 7.3 Recognition test methodology

Build a documented test corpus (development part and held-out test part) covering:

- several speakers (gender, age, region);
- read, conversational, and dialectal speech;
- quiet and moderately noisy conditions and different microphones;
- short and long recordings, everyday and technical topics;
- a mixed-language set for Armenianization.

Reference transcripts are produced manually by native speakers under written guidelines, with double annotation of a sample. Metrics: word error rate and character error rate (normalization rules fixed in advance), Armenianization detection and replacement quality judged by humans, sentence-boundary quality, and latency. Tune only on the development part; report all results per condition, including unfavorable ones; obtain speakers' informed consent.

**No accuracy results are stated in this document. They must be measured during implementation and testing.**

### 7.4 Future enhancements

Summarization, key ideas, meeting minutes, speaker identification, grammar and spelling suggestions, Western Armenian, batch transcription, additional languages, custom vocabulary, optional external language service with explicit user consent, installer with updates, Armenian interface language.

---

## 8. Conclusion, Glossary, and References

This specification gives a realistic, verifiable basis for the diploma project: three transcription modes, live transcription with a clear interim and finalized distinction, Armenianization as a separate text-processing responsibility, and recognition quality that is measured rather than assumed.

**Glossary.** *Armenianization:* context-sensitive rendering of foreign words as Armenian equivalents. *Interim transcription:* provisional text that may be corrected. *Finalized transcription:* accepted, processed text. *WER / CER:* word / character error rate. *Diarization:* determining who spoke when. *SRT:* subtitle file format. *MVP:* minimum viable product.

**References.**

1. ISO/IEC/IEEE 29148:2018, *Systems and software engineering: Requirements engineering*.
2. Radford et al., *Robust Speech Recognition via Large-Scale Weak Supervision*, arXiv:2212.04356, 2022.
3. Macháček, Dabre, Bojar, *Turning Whisper into Real-Time Transcription System*, IJCNLP-AACL System Demonstrations, 2023.
4. Ardila et al., *Common Voice: A Massively-Multilingual Speech Corpus*, LREC 2020.
