import { getFFmpeg } from './ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  processingTime: number;
}

export async function compressAudio(
  audioFile: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const startTime = Date.now();
  const originalSize = audioFile.size;

  try {
    const ffmpeg = await getFFmpeg();

    // Attach progress handler safely by clearing old ones if needed
    const progressHandler = ({ progress, time }: { progress: number; time: number }) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress * 100)));
      }
    };
    ffmpeg.on('progress', progressHandler);

    const inputName = `input_${Date.now()}.tmp`;
    const outputName = `compressed_${Date.now()}.mp3`;

    // Update progress
    if (onProgress) onProgress(5);

    // Write file to FFmpeg's virtual file system
    ffmpeg.writeFile(inputName, await fetchFile(audioFile));

    // Update progress
    if (onProgress) onProgress(10);

    // Run compression: convert to 16kHz mono mp3 at 32k bitrate
    // This is highly optimal for Whisper and drops file size drastically
    await ffmpeg.exec([
      '-i', inputName,
      '-ar', '16000',
      '-ac', '1',
      '-b:a', '32k',
      outputName
    ]);

    // Update progress
    if (onProgress) onProgress(90);

    // Read result
    const outputData = await ffmpeg.readFile(outputName);
    
    // Clean up
    ffmpeg.off('progress', progressHandler);
    ffmpeg.deleteFile(inputName);
    ffmpeg.deleteFile(outputName);

    // Create File object
    const compressedFile = new File(
      [new Uint8Array(outputData as Uint8Array)],
      `compressed_${audioFile.name.replace(/\.[^/.]+$/, '')}.mp3`,
      { type: 'audio/mpeg' }
    );
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    const compressionRatio = originalSize / compressedFile.size;
    
    // Final progress update
    if (onProgress) onProgress(100);
    
    return {
      compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio,
      processingTime,
    };
    
  } catch (error) {
    console.error('Audio compression failed:', error);
    throw new Error(`Audio compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function isWebCodecsSupported(): boolean {
  // Always returning true now since we use universal FFmpeg WASM
  return true;
}

export function estimateCompressedSize(originalSize: number): number {
  // 32kbps = 4KB per second. This usually yields heavy compression for large HQ files.
  // We'll estimate roughly 15:1 compression for average consumer audio.
  const estimatedRatio = 15;
  return Math.max(originalSize / estimatedRatio, 1024 * 512); // Minimum 512KB
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
