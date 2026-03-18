import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<FFmpeg> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }
  
  if (isLoading && loadPromise) {
    return loadPromise;
  }
  
  isLoading = true;
  ffmpegInstance = new FFmpeg();
  
  loadPromise = (async () => {
    try {
      await ffmpegInstance!.load({
        coreURL: '/ffmpeg/ffmpeg-core.js',
        wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      });
      isLoading = false;
      return ffmpegInstance!;
    } catch (e) {
      isLoading = false;
      ffmpegInstance = null;
      throw e;
    }
  })();
  
  return loadPromise;
}
