# MindScoper

**AI that turns therapy conversations into visual mental health maps.**

MindScoper uses Google Gemini AI to transcribe therapy sessions, extract psychological entities and patterns, and visualize them as an interactive knowledge graph — all in real-time.

## Features

- **Live Recording** — Record therapy sessions directly from the browser microphone
- **File Upload** — Upload existing recordings (MP3, WAV, M4A, MP4, WebM)
- **Gemini-Powered Transcription** — Audio transcribed using Gemini's multimodal capabilities
- **AI Analysis** — Entity extraction, relationship detection, temporal pattern analysis
- **Knowledge Relation Map** — Interactive D3.js force-directed graph visualization
- **Wellness Score** — 1–10 patient wellness gauge with color-coded status
- **Session History** — Past sessions saved locally for quick review

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS v4 |
| AI | Google Gemini 2.0 Flash |
| Visualization | D3.js |
| Icons | Lucide React |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

Copy the example env file and add your Gemini API key:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
GEMINI_API_KEY=your_actual_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

```
Audio Input (Record / Upload)
        ↓
Gemini Transcription
        ↓
Gemini Analysis
        ↓
┌───────────────────────────────────┐
│  Transcript  │   AI Findings     │
│──────────────│───────────────────│
│  Knowledge   │  Wellness Score   │
│  Graph       │  (1-10)           │
└───────────────────────────────────┘
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page (record / upload)
│   ├── dashboard/[id]/       # 4-panel analysis dashboard
│   ├── sessions/             # Session history
│   └── api/
│       ├── transcribe/       # Gemini audio → transcript
│       └── analyze/          # Gemini transcript → analysis JSON
├── components/
│   ├── AudioRecorder.tsx     # Live recording widget
│   ├── FileUploader.tsx      # Drag-and-drop upload
│   ├── TranscriptPanel.tsx   # Transcript display
│   ├── AISummaryPanel.tsx    # AI findings panel
│   ├── KnowledgeGraph.tsx    # D3.js force-directed graph
│   ├── WellnessScore.tsx     # Circular gauge
│   └── Navbar.tsx            # Top navigation
└── lib/
    ├── gemini.ts             # Gemini client
    ├── prompts.ts            # Structured AI prompts
    ├── types.ts              # TypeScript interfaces
    └── sessions.ts           # localStorage persistence
```

## Best Use of Gemini

This project uses Gemini for the **entire AI pipeline**:

1. **Multimodal Transcription** — Gemini 2.0 Flash processes raw audio files directly
2. **Clinical Analysis** — Structured JSON extraction of symptoms, behaviors, patterns
3. **Pattern Detection** — Temporal analysis (episodic, trait-based, reactive)
4. **Condition Hinting** — Possible clinical indicators based on extracted entities
