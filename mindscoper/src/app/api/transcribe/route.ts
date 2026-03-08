import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB — Whisper limit

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(audioFile.size / 1024 / 1024).toFixed(1)}MB). Maximum is 25MB.` },
        { status: 400 }
      );
    }

    // Determine proper file extension — Whisper validates by extension, not MIME type
    const mimeBase = audioFile.type.split(";")[0].trim().toLowerCase();
    const ext = MIME_TO_EXT[mimeBase] || "webm";
    const fileName = audioFile.name && audioFile.name !== "blob"
      ? audioFile.name
      : `recording.${ext}`;

    // Re-create the File with a proper filename so Whisper accepts it
    const buffer = await audioFile.arrayBuffer();
    const file = new File([buffer], fileName, { type: audioFile.type });

    const openai = getOpenAIClient();

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      // Note: OpenAI doesn't offer a "medium" variant via API — whisper-1 is the
      // largest (large-v2) model available through the API and already the best quality.
      file: file,
      language: "en",
      response_format: "text",
    });

    const transcript =
      typeof transcription === "string"
        ? transcription
        : (transcription as unknown as { text: string }).text;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: "Transcription returned empty. The audio may be silent or too short." },
        { status: 400 }
      );
    }

    return NextResponse.json({ transcript: transcript.trim() });
  } catch (error: unknown) {
    console.error("Transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown transcription error";
    return NextResponse.json(
      { error: `Failed to transcribe audio: ${message}` },
      { status: 500 }
    );
  }
}
