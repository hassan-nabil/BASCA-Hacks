import { getFFmpeg } from './ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface AudioChunk {
  file: File;
  index: number;
  totalChunks: number;
  startTime: number;
  endTime: number;
}

export interface ChunkingResult {
  chunks: AudioChunk[];
  totalChunks: number;
  chunkDuration: number;
}

export async function chunkAudio(
  audioFile: File,
  maxChunkSizeMB: number = 10, // Not strictly used for exact size anymore; we use static time segments
  onProgress?: (progress: number) => void
): Promise<ChunkingResult> {
  try {
    const ffmpeg = await getFFmpeg();
    
    // Attach progress handler safely
    const progressHandler = ({ progress }: { progress: number; time: number }) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress * 100)));
      }
    };
    ffmpeg.on('progress', progressHandler);

    const inputName = `input_${Date.now()}.tmp`;
    const outputPrefix = `chunk_${Date.now()}`;

    // Update progress
    if (onProgress) onProgress(5);

    // Write file to FFmpeg's virtual file system
    ffmpeg.writeFile(inputName, await fetchFile(audioFile));

    // Update progress
    if (onProgress) onProgress(10);

    // We will segment the file into 10-minute (600s) chunks, and simultaneously 
    // compress to 32kbps mono mp3 to ensure they are small enough (<3MB) for Whisper and Vercel
    const segmentTime = 600;
    
    const args = [
      '-i', inputName,
      '-f', 'segment',
      '-segment_time', segmentTime.toString(),
    ];

    // If it's already compressed by our own compressor, no need to transcode again!
    if (audioFile.name.startsWith('compressed_') && audioFile.type === 'audio/mpeg') {
      args.push('-c', 'copy');
    } else {
      args.push(
        '-c:a', 'libmp3lame',
        '-b:a', '32k',
        '-ar', '16000',
        '-ac', '1'
      );
    }

    args.push(`${outputPrefix}_%03d.mp3`);
    
    await ffmpeg.exec(args);

    // Update progress
    if (onProgress) onProgress(90);

    // Read the generated chunks back from FFmpeg's virtual FS
    const chunks: AudioChunk[] = [];
    let i = 0;
    while (true) {
      const chunkName = `${outputPrefix}_${i.toString().padStart(3, '0')}.mp3`;
      let chunkData: Uint8Array;
      try {
        chunkData = await ffmpeg.readFile(chunkName) as Uint8Array;
      } catch (e) {
        // readFile throws if file does not exist, meaning we reached the end
        break;
      }

      const chunkFile = new File(
        [new Uint8Array(chunkData)],
        `chunk_${i + 1}_${audioFile.name.replace(/\.[^/.]+$/, '')}.mp3`,
        { type: 'audio/mpeg' }
      );
      
      chunks.push({
        file: chunkFile,
        index: i,
        // we'll update totalChunks after gathering them all
        totalChunks: 0, 
        startTime: i * segmentTime,
        endTime: (i + 1) * segmentTime // this is an estimate for the last chunk
      });

      // Cleanup chunk from memory
      ffmpeg.deleteFile(chunkName);
      i++;
    }

    // Cleanup input
    ffmpeg.off('progress', progressHandler);
    ffmpeg.deleteFile(inputName);

    // Update total chunks count
    chunks.forEach(c => c.totalChunks = chunks.length);

    // Final progress update
    if (onProgress) onProgress(100);
    
    return {
      chunks,
      totalChunks: chunks.length,
      chunkDuration: segmentTime
    };
    
  } catch (error) {
    console.error('Audio chunking failed:', error);
    throw new Error(`Audio chunking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function estimateChunkCount(fileSize: number, maxChunkSizeMB: number = 10): number {
  // If we assume a very conservative 1 MB per minute for original uploaded audio,
  // then 10 minute chunks cover 10 MB. 
  // It's just a rough UI estimate, so we'll guess fileSize / 10MB
  const estimatedOriginalMB = fileSize / (1024 * 1024);
  return Math.max(1, Math.ceil(estimatedOriginalMB / 10));
}
