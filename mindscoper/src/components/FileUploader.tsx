"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileAudio, X, Loader2 } from "lucide-react";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

const ACCEPTED_EXTENSIONS = ".mp3,.wav,.m4a,.mp4,.webm";

export function FileUploader({
  onFileSelected,
  isProcessing,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-card-foreground">
          Upload Recording
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an existing therapy session recording
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-all ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/50 hover:bg-muted/50"
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-accent" />
            <span className="text-sm font-medium text-accent">
              Processing...
            </span>
          </>
        ) : selectedFile ? (
          <div className="flex items-center gap-3">
            <FileAudio className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm font-medium text-card-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-card-foreground">
                Drag & drop or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports MP3, WAV, M4A, MP4, WebM
              </p>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
