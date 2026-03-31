# MindScoper

AI-powered therapy session analyzer that turns conversations into visual mental health maps.

MindScoper records or accepts uploaded therapy-session audio, transcribes it with OpenAI Whisper, then uses Gemini 2.5 Flash to extract psychological entities, detect behavioral patterns, compute a wellness score, and render an interactive knowledge graph.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full technical specification.

## Highlights

- Live recording from browser microphone (WebM/Opus)
- File upload for MP3, WAV, M4A, MP4, WebM, OGG, FLAC
- Whisper transcription via OpenAI (`whisper-1`)
- Structured analysis with Gemini 2.5 Flash
- Interactive D3 knowledge graph with drag, zoom, and pan
- 1-10 wellness score gauge and concern-level badge
- Session history persisted locally in browser storage

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Transcription | OpenAI Whisper API (`whisper-1`) |
| Analysis | Google Gemini 2.5 Flash |
| Visualization | D3.js |
| Notifications | Sonner |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` and add:

```ini
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

You can copy values from `.env.example`.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## NPM Scripts

- `npm run dev` - Start local dev server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## API Flow

1. `POST /api/transcribe` receives audio and returns `{ transcript }`
2. `POST /api/analyze` receives transcript and returns `{ analysis }`
3. Session data is saved to localStorage and shown at `/dashboard/[id]`

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

```text
src/
        app/
                api/
                        transcribe/
                        analyze/
                dashboard/[id]/
                sessions/
        components/
        lib/
```

## AI Pipeline

| Stage | Model | Purpose |
|-------|-------|---------|
| Transcription | OpenAI Whisper (`whisper-1`) | Accurate speech-to-text for therapy audio |
| Analysis | Google Gemini 2.5 Flash | Extract entities, relationships, patterns, wellness score |

### What Gemini Extracts

- **Entities** - Symptoms, behaviors, emotions, events, triggers, outcomes
- **Relationships** - Causal links between entities (for example, "triggers", "leads to")
- **Wellness Score** - 1-10 overall mental health assessment
- **Primary Pattern** - Episodic, trait-based, reactive, etc.
- **Temporal Pattern** - Whether symptoms are constant, cyclical, or situational
- **Condition Hints** - Possible clinical indicators (ADHD, Bipolar, BPD, Depression, Anxiety)
- **Story Flow** - Narrative arc: Life Event -> Trigger -> Emotion -> Behavior -> Outcome
- **Follow-up Recommendation** - Suggested next steps for the therapist

## Notes and Limitations

- This tool is an analysis aid, not a medical diagnosis system.
- Session data is saved in localStorage; clearing browser data removes stored sessions.
- Audio upload size is capped at 25 MB.
- API keys are required for both Gemini and OpenAI.

## Troubleshooting

- If transcription fails, verify `OPENAI_API_KEY` and audio format support.
- If analysis fails, verify `GEMINI_API_KEY` and check API quota.
- If no sessions appear, confirm browser storage is enabled and not cleared.
