import { compressAudio, formatFileSize, isWebCodecsSupported } from './audioCompression';

// Re-export formatFileSize for convenience
export { formatFileSize };
import { chunkAudio, estimateChunkCount } from './audioChunking';

export interface ProcessingResult {
  transcript: string;
  processingMethod: 'direct' | 'compressed' | 'chunked';
  processingStats: {
    originalSize: number;
    compressedSize?: number;
    compressionRatio?: number;
    compressionTime?: number;
    chunkCount?: number;
    totalTranscriptionTime: number;
  };
}

export async function processLargeAudio(
  audioFile: File,
  onProgress?: (stage: string, progress: number) => void,
  onChunkComplete?: (chunkIndex: number, totalChunks: number, transcript: string) => void
): Promise<ProcessingResult> {
  const startTime = Date.now();
  const originalSize = audioFile.size;
  let processingMethod: 'direct' | 'compressed' | 'chunked' = 'direct';
  let transcript = '';
  
  const processingStats: any = {
    originalSize,
    totalTranscriptionTime: 0,
  };

  try {
    // Check if file needs processing (larger than 4MB to be safe for Vercel 4.5MB limits)
    if (audioFile.size <= 4 * 1024 * 1024) {
      // Small file - process directly
      onProgress?.('Transcribing small file directly...', 10);
      transcript = await transcribeSingleFile(audioFile);
      processingMethod = 'direct';
      onProgress?.('Complete', 100);
    } else {
      // Large file - try compression first
      if (isWebCodecsSupported()) {
        onProgress?.('Compressing audio...', 5);
        
        try {
          const compressionResult = await compressAudio(audioFile, (progress) => {
            onProgress?.('Compressing audio...', 5 + progress * 0.3);
          });
          
          processingStats.compressedSize = compressionResult.compressedSize;
          processingStats.compressionRatio = compressionResult.compressionRatio;
          processingStats.compressionTime = compressionResult.processingTime;
          
          onProgress?.(`Compressed from ${formatFileSize(originalSize)} to ${formatFileSize(compressionResult.compressedSize)}`, 35);
          
          // Check if compressed file is small enough for direct processing (use 4MB to be safe for Vercel)
          if (compressionResult.compressedFile.size <= 4 * 1024 * 1024) {
            onProgress?.('Transcribing compressed file...', 40);
            transcript = await transcribeSingleFile(compressionResult.compressedFile);
            processingMethod = 'compressed';
            onProgress?.('Complete', 100);
          } else {
            // Still too large - need to chunk the compressed file
            onProgress?.('File still large after compression, chunking...', 40);
            const chunkResult = await processChunks(compressionResult.compressedFile, onProgress, onChunkComplete);
            transcript = chunkResult.transcript;
            processingMethod = 'chunked';
            processingStats.chunkCount = chunkResult.chunkCount;
          }
        } catch (compressionError) {
          console.warn('Compression failed, falling back to chunking:', compressionError);
          onProgress?.('Compression failed, chunking original file...', 40);
          const chunkResult = await processChunks(audioFile, onProgress, onChunkComplete);
          transcript = chunkResult.transcript;
          processingMethod = 'chunked';
          processingStats.chunkCount = chunkResult.chunkCount;
        }
      } else {
        // No WebCodecs support - go directly to chunking
        onProgress?.('Browser does not support compression, chunking...', 40);
        const chunkResult = await processChunks(audioFile, onProgress, onChunkComplete);
        transcript = chunkResult.transcript;
        processingMethod = 'chunked';
        processingStats.chunkCount = chunkResult.chunkCount;
      }
    }
    
    processingStats.totalTranscriptionTime = Date.now() - startTime;
    
    return {
      transcript,
      processingMethod,
      processingStats,
    };
    
  } catch (error) {
    console.error('Audio processing failed:', error);
    throw new Error(`Audio processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function transcribeSingleFile(audioFile: File): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Transcription failed');
  }
  
  const result = await response.json();
  return result.transcript;
}

async function processChunks(
  audioFile: File,
  onProgress?: (stage: string, progress: number) => void,
  onChunkComplete?: (chunkIndex: number, totalChunks: number, transcript: string) => void
): Promise<{ transcript: string; chunkCount: number }> {
  // Chunk the audio
  const chunkingResult = await chunkAudio(audioFile, 25, (progress) => {
    onProgress?.('Chunking audio...', 40 + progress * 0.2);
  });
  
  const { chunks, totalChunks } = chunkingResult;
  const transcripts: string[] = [];
  
  onProgress?.(`Processing ${totalChunks} chunks...`, 60);
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkProgress = 60 + (i / chunks.length) * 35;
    
    onProgress?.(`Transcribing chunk ${i + 1}/${totalChunks}...`, chunkProgress);
    
    try {
      const chunkTranscript = await transcribeSingleFile(chunk.file);
      transcripts.push(chunkTranscript);
      
      onChunkComplete?.(i + 1, totalChunks, chunkTranscript);
      
      // Small delay between chunks to avoid overwhelming the API
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to transcribe chunk ${i + 1}:`, error);
      // Add placeholder for failed chunk
      transcripts.push(`[Chunk ${i + 1} transcription failed]`);
    }
  }
  
  // Combine transcripts
  const combinedTranscript = transcripts.join('\n\n--- Chunk Boundary ---\n\n');
  
  return {
    transcript: combinedTranscript,
    chunkCount: totalChunks,
  };
}

export function getProcessingEstimate(fileSize: number): {
  method: 'direct' | 'compression' | 'chunking';
  estimatedTime: number;
  description: string;
} {
  if (fileSize <= 4 * 1024 * 1024) {
    return {
      method: 'direct',
      estimatedTime: 1, // 1 minute
      description: 'File will be processed directly'
    };
  }
  
  const estimatedCompressedSize = fileSize / 10; // Rough 10:1 compression ratio
  
  if (estimatedCompressedSize <= 4 * 1024 * 1024) {
    return {
      method: 'compression',
      estimatedTime: 3, // 3 minutes (1 min compression + 2 min transcription)
      description: 'File will be compressed then transcribed'
    };
  }
  
  const chunkCount = estimateChunkCount(fileSize);
  return {
    method: 'chunking',
    estimatedTime: Math.max(5, chunkCount * 0.5), // 30 seconds per chunk minimum
    description: `File will be split into ${chunkCount} chunks for processing`
  };
}
