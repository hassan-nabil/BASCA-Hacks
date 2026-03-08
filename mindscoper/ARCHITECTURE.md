# MindScoper — System Architecture

Full technical specification for the MindScoper therapy session analyzer.

---

## 1. System Overview

MindScoper is a single-page Next.js application that processes therapy session audio through a two-stage AI pipeline (transcription → analysis) and presents results in a 4-panel dashboard. All processing happens server-side via API routes; the client handles audio capture, UI state, and session persistence.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │ AudioRecorder│  │ FileUploader │  │ Landing Page (page.tsx)   │ │
│  │ (MediaRecorder│  │ (drag-drop)  │  │ - mode select             │ │
│  │  WebM/Opus)  │  │ - validates  │  │ - processAudio callback   │ │
│  └──────┬───────┘  └──────┬───────┘  │ - stage tracking          │ │
│         │ Blob             │ File     └──────────┬────────────────┘ │
│         └────────┬─────────┘                     │                  │
│                  ▼                                │                  │
│         FormData (audio)                         │                  │
│                  │                                │                  │
├──────────────────┼────────────────────────────────┼──────────────────┤
│                  │          SERVER (API Routes)   │                  │
│                  ▼                                │                  │
│  ┌──────────────────────────┐                    │                  │
│  │ POST /api/transcribe     │                    │                  │
│  │ - MIME → extension map   │                    │                  │
│  │ - File reconstruction    │                    │                  │
│  │ - OpenAI Whisper API     │                    │                  │
│  │ - Empty transcript guard │                    │                  │
│  └────────────┬─────────────┘                    │                  │
│               │ { transcript }                   │                  │
│               ▼                                  │                  │
│  ┌──────────────────────────┐                    │                  │
│  │ POST /api/analyze        │                    │                  │
│  │ - Gemini 2.5 Flash       │                    │                  │
│  │ - Structured JSON prompt │                    │                  │
│  │ - JSON extraction/repair │                    │                  │
│  │ - Field defaults/clamp   │                    │                  │
│  └────────────┬─────────────┘                    │                  │
│               │ { analysis }                     │                  │
│               ▼                                  │                  │
│         localStorage.setItem(session)            │                  │
│               │                                  │                  │
│               ▼                                  │                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Dashboard (/dashboard/[id])                  │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────────┐ │  │
│  │  │  WellnessScore   │  │  AISummaryPanel                    │ │  │
│  │  │  - SVG gauge     │  │  - Status badge (4 levels)         │ │  │
│  │  │  - Color-coded   │  │  - Summary, patterns, hints        │ │  │
│  │  │  - 1-10 scale    │  │  - Story flow timeline             │ │  │
│  │  │  - Progress bar  │  │  - Follow-up recommendation        │ │  │
│  │  ├─────────────────┤  ├────────────────────────────────────┤ │  │
│  │  │  TranscriptPanel │  │  KnowledgeGraph                    │ │  │
│  │  │  - Scrollable    │  │  - D3.js force simulation          │ │  │
│  │  │  - Full text     │  │  - Color-coded entity nodes        │ │  │
│  │  │                  │  │  - Labeled relationship edges       │ │  │
│  │  │                  │  │  - Drag, zoom, pan                  │ │  │
│  │  └─────────────────┘  └────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static (client) | Landing page with Record/Upload mode selection and processing pipeline |
| `/dashboard/[id]` | Dynamic (client) | 4-panel analysis dashboard for a specific session |
| `/sessions` | Static (client) | List of past sessions with view/delete actions |
| `/api/transcribe` | API (server) | Receives audio FormData, returns `{ transcript }` |
| `/api/analyze` | API (server) | Receives `{ transcript }`, returns `{ analysis }` |

All pages are client-rendered (`"use client"`) since they depend on localStorage and browser APIs.

---

## 3. AI Pipeline

### Stage 1: Transcription

| Property | Value |
|----------|-------|
| Model | OpenAI `whisper-1` (Whisper large-v2) |
| Input | Audio file via FormData (up to 25 MB) |
| Formats | WebM, MP3, WAV, M4A, MP4, OGG, FLAC |
| Output | Plain text transcript |

**Key implementation details:**
- Browser `MediaRecorder` produces blobs named `"blob"` with no extension
- Whisper API validates by file extension, not MIME type
- The server reconstructs the `File` object with a proper filename (e.g., `recording.webm`) using a MIME-to-extension lookup table
- Empty transcripts are rejected with a descriptive error

### Stage 2: Analysis

| Property | Value |
|----------|-------|
| Model | Google Gemini 2.5 Flash |
| Input | Plain text transcript appended to structured prompt |
| Output | JSON conforming to `AnalysisResult` interface |

**Prompt engineering:**
- Role: Expert clinical psychology AI assistant
- Output format: Strict JSON schema with 10 fields
- Rules: Always include `patient` central node, 4-6+ entities, valid relationships
- Guard rails: "Return ONLY valid JSON. No markdown formatting."

**Server-side resilience:**
- `extractJSON()` strips markdown fences and locates `{...}` boundaries
- Missing fields receive sensible defaults (e.g., `wellnessScore: 5`)
- Patient entity is auto-inserted if Gemini omits it
- Wellness score is clamped to 1–10

---

## 4. Data Model

### AnalysisResult

```typescript
interface AnalysisResult {
  summary: string;                    // 2-3 sentence clinical summary
  status: "Low concern" | "Moderate concern" | "High concern" | "Critical";
  wellnessScore: number;              // 1–10
  primaryPattern: string;             // e.g., "Episodic mood cycles"
  suggestedFollowUp: string;          // Clinical recommendation
  entities: Entity[];                 // Graph nodes
  edges: Edge[];                      // Graph relationships
  possibleConditionHints: string[];   // e.g., ["ADHD", "Depression"]
  temporalPattern: string;            // e.g., "Reactive to stressors"
  storyFlow: StoryFlowStep[];         // Narrative arc
}
```

### Entity (graph node)

```typescript
interface Entity {
  id: string;
  label: string;
  type: "symptom" | "behavior" | "emotion" | "event" | "trigger" | "outcome" | "patient";
}
```

### Edge (graph link)

```typescript
interface Edge {
  source: string;   // entity id
  target: string;   // entity id
  label: string;    // e.g., "triggers", "leads to"
}
```

### Session (localStorage)

```typescript
interface Session {
  id: string;           // crypto.randomUUID()
  timestamp: number;    // Date.now()
  transcript: string;
  analysis: AnalysisResult;
  inputMethod: "recording" | "upload";
  fileName?: string;    // original upload filename
}
```

---

## 5. Component Architecture

### Audio Input Components

| Component | Props | Responsibility |
|-----------|-------|----------------|
| `AudioRecorder` | `onRecordingComplete(Blob)`, `isProcessing` | MediaRecorder capture, timer display, start/stop |
| `FileUploader` | `onFileSelected(File)`, `isProcessing` | Drag-and-drop zone, format validation, file info |

### Dashboard Components

| Component | Props | Responsibility |
|-----------|-------|----------------|
| `WellnessScore` | `score: number` | Circular SVG gauge, color gradient, severity label |
| `AISummaryPanel` | `analysis: AnalysisResult` | Status badge, summary, patterns, hints, story flow, follow-up |
| `TranscriptPanel` | `transcript: string` | Scrollable text display with header |
| `KnowledgeGraph` | `entities: Entity[], edges: Edge[]` | D3.js force-directed graph with drag/zoom/pan, color legend |

### Layout Components

| Component | Responsibility |
|-----------|----------------|
| `Navbar` | Top nav bar with MindScoper branding, Home/Sessions links |
| `layout.tsx` | Root layout with Geist fonts, Navbar, Sonner Toaster |

---

## 6. Knowledge Graph Visualization

The `KnowledgeGraph` component uses D3.js `forceSimulation` to render an interactive node-link diagram.

**Forces applied:**
- `forceLink` — Connects entities via edges (distance: 120px)
- `forceManyBody` — Repulsion between nodes (strength: -300)
- `forceCenter` — Centers the graph in the viewport
- `forceCollide` — Prevents node overlap (radius: 50px)

**Node styling by entity type:**

| Type | Color | Radius |
|------|-------|--------|
| patient | Teal `#0d9488` | 24px (larger, central) |
| symptom | Red `#ef4444` | 16px |
| behavior | Amber `#f59e0b` | 16px |
| emotion | Purple `#8b5cf6` | 16px |
| event | Blue `#3b82f6` | 16px |
| trigger | Orange `#f97316` | 16px |
| outcome | Indigo `#6366f1` | 16px |

**Interactions:**
- Drag nodes to reposition
- Scroll to zoom in/out
- Pan by clicking and dragging background

---

## 7. Persistence

Sessions are stored in `localStorage` under the key `"mindscoper_sessions"`.

| Operation | Function | Behavior |
|-----------|----------|----------|
| Read all | `getSessions()` | Returns parsed array, sorted by timestamp (newest first) |
| Read one | `getSession(id)` | Finds session by UUID |
| Create | `saveSession(session)` | Prepends to array and writes back |
| Delete | `deleteSession(id)` | Filters out by id and writes back |

**Limitations:**
- localStorage has a ~5-10 MB limit per origin
- No server-side backup or sync
- Data is lost if browser storage is cleared

---

## 8. Error Handling

| Layer | Error | Handling |
|-------|-------|----------|
| Client | File > 25 MB | Toast error before upload, no API call |
| Transcribe API | Missing audio | 400 with descriptive message |
| Transcribe API | Whisper failure | 500 with actual error message surfaced |
| Transcribe API | Empty transcript | 400 with "audio may be silent" message |
| Analyze API | Missing transcript | 400 |
| Analyze API | Gemini returns non-JSON | `extractJSON()` attempts repair; 502 if unparseable |
| Analyze API | Missing fields in JSON | Defaults applied (score: 5, status: "Moderate concern", etc.) |
| Analyze API | Missing patient entity | Auto-inserted as first node |
| Client | Any pipeline failure | Toast error with message, stage reset to idle |

---

## 9. Environment Variables

| Variable | Required | Provider | Purpose |
|----------|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | Google AI Studio | Gemini 2.5 Flash for transcript analysis |
| `OPENAI_API_KEY` | Yes | OpenAI Platform | Whisper for audio transcription |

Both clients use lazy initialization — they are only instantiated on first API request, not at build time, allowing `next build` to succeed without keys present.

---

## 10. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Whisper for transcription | Reliable, battle-tested STT; Gemini multimodal audio was unreliable for this use case |
| Gemini for analysis | Excellent at structured JSON extraction from text; free tier available |
| localStorage (not DB) | Hackathon scope — no auth, no server, instant persistence |
| Lazy AI client init | Prevents build-time errors when env vars aren't set |
| File reconstruction | Whisper validates by extension, not MIME — must rename blob to `recording.webm` |
| D3.js (not React library) | Full control over force simulation, drag, zoom behavior |
| Client-side pages | All pages need `localStorage` — server rendering would hydration-mismatch |
| Sonner for toasts | Lightweight, great defaults, works well with Next.js App Router |
