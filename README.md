# MindScoper

AI-powered therapy session analyzer that turns conversations into visual mental health maps.

MindScoper records or accepts uploaded therapy-session audio, transcribes it with OpenAI Whisper, then uses Gemini 2.5 Flash to extract psychological entities, detect behavioral patterns, compute a wellness score, and render an interactive knowledge graph.

See [mindscoper/ARCHITECTURE.md](./mindscoper/ARCHITECTURE.md) for the full technical specification.

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

### 1. Move into the app

```bash
cd mindscoper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local` in `mindscoper/` and add:

```ini
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

You can copy values from `.env.example`.

### 4. Start development server

```bash
npm run dev
```

Open http://localhost:3000.

## NPM Scripts

Run these inside `mindscoper/`:

- `npm run dev` - Start local dev server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## API Flow

1. `POST /api/transcribe` receives audio and returns `{ transcript }`
2. `POST /api/analyze` receives transcript and returns `{ analysis }`
3. Session data is saved to localStorage and shown at `/dashboard/[id]`

## Project Structure

```text
mindscoper/
        src/
                app/
                        api/
                                transcribe/
                                analyze/
                        dashboard/[id]/
                        sessions/
                components/
                lib/
        ARCHITECTURE.md
```

## Notes and Limitations

- This tool is an analysis aid, not a medical diagnosis system.
- Session data is saved in localStorage; clearing browser data removes stored sessions.
- Audio upload size is capped at 25 MB.
- API keys are required for both Gemini and OpenAI.

## Troubleshooting

- If transcription fails, verify `OPENAI_API_KEY` and audio format support.
- If analysis fails, verify `GEMINI_API_KEY` and check API quota.
- If no sessions appear, confirm browser storage is enabled and not cleared.
