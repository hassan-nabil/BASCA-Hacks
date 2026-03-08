# MindScoper

**AI-powered therapy session analyzer that turns conversations into visual mental health maps.**

MindScoper records or accepts uploaded therapy session audio, transcribes it with OpenAI Whisper, then uses Google Gemini 2.5 to extract psychological entities, detect behavioral patterns, compute a wellness score, and render an interactive knowledge graph — all in real-time.

> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full system specification and design details.

## Features

- **Live Recording** — Capture therapy sessions directly from the browser microphone (WebM/Opus)
- **File Upload** — Drag-and-drop support for MP3, WAV, M4A, MP4, WebM, OGG, FLAC (up to 25 MB)
- **Whisper Transcription** — Accurate speech-to-text via OpenAI Whisper (`whisper-1` / large-v2)
- **Gemini Analysis** — Structured clinical entity extraction, relationship mapping, pattern detection
- **Knowledge Relation Map** — Interactive D3.js force-directed graph with draggable nodes, zoom, and pan
- **Wellness Score** — 1–10 circular gauge with color-coded severity (Critical → Good)
- **Session History** — Past sessions persisted in localStorage with view/delete

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| Transcription | OpenAI Whisper API (`whisper-1`) |
| Analysis | Google Gemini 2.5 Flash |
| Visualization | D3.js (force-directed graph) |
| Notifications | Sonner (toast) |
| Icons | Lucide React |

## Getting Started

### 1. Install dependencies

```bash
cd mindscoper
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add both API keys:

```ini
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
```

- **Gemini key** — [Google AI Studio](https://aistudio.google.com/apikey) (free tier available)
- **OpenAI key** — [OpenAI Platform](https://platform.openai.com/api-keys) (Whisper costs ~$0.006/min)

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

```
Audio Input (Record / Upload)
        ↓
OpenAI Whisper (speech-to-text)
        ↓
Gemini 2.5 Flash (clinical analysis)
        ↓
┌───────────────────────────────────┐
│  Transcript   │   AI Findings    │
│───────────────│──────────────────│
│  Knowledge    │  Wellness Score  │
│  Graph (D3)   │  (1-10 gauge)   │
└───────────────────────────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page — record or upload
│   ├── dashboard/[id]/       # 4-panel analysis dashboard
│   ├── sessions/             # Session history list
│   └── api/
│       ├── transcribe/       # Whisper audio → transcript
│       └── analyze/          # Gemini transcript → analysis JSON
├── components/
│   ├── AudioRecorder.tsx     # MediaRecorder live capture
│   ├── FileUploader.tsx      # Drag-and-drop file upload
│   ├── TranscriptPanel.tsx   # Scrollable transcript display
│   ├── AISummaryPanel.tsx    # AI findings, patterns, story flow
│   ├── KnowledgeGraph.tsx    # D3.js force-directed graph
│   ├── WellnessScore.tsx     # Circular SVG gauge
│   └── Navbar.tsx            # Top navigation bar
└── lib/
    ├── gemini.ts             # Gemini 2.5 client (lazy init)
    ├── openai.ts             # OpenAI client (lazy init)
    ├── prompts.ts            # Structured analysis prompt
    ├── types.ts              # TypeScript interfaces
    └── sessions.ts           # localStorage CRUD
```

## AI Pipeline

| Stage | Model | Purpose |
|-------|-------|---------|
| Transcription | OpenAI Whisper (`whisper-1`) | Accurate speech-to-text for therapy audio |
| Analysis | Google Gemini 2.5 Flash | Extract entities, relationships, patterns, wellness score |

### What Gemini Extracts

- **Entities** — Symptoms, behaviors, emotions, events, triggers, outcomes
- **Relationships** — Causal links between entities (e.g., "triggers", "leads to")
- **Wellness Score** — 1–10 overall mental health assessment
- **Primary Pattern** — Episodic, trait-based, reactive, etc.
- **Temporal Pattern** — Whether symptoms are constant, cyclical, or situational
- **Condition Hints** — Possible clinical indicators (ADHD, Bipolar, BPD, Depression, Anxiety)
- **Story Flow** — Narrative arc: Life Event → Trigger → Emotion → Behavior → Outcome
- **Follow-up Recommendation** — Suggested next steps for the therapist
