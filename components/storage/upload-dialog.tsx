// @/components/storage/upload-dialog.tsx
"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  uploadFile,
  formatBytes,
  type UploadProgress,
} from "@/lib/storage";

const STAGE_LABEL: Record<UploadProgress["stage"], string> = {
  requesting: "Requesting upload URL…",
  uploading: "Uploading to storage…",
  finalizing: "Finalizing…",
};

const STAGE_VALUE: Record<UploadProgress["stage"], number> = {
  requesting: 20,
  uploading: 65,
  finalizing: 92,
};

export function UploadDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Track individual file stages by their index
  const [fileStages, setFileStages] = useState<Record<number, UploadProgress["stage"]>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter(); 

  const reset = useCallback(() => {
    setFiles([]);
    setFileStages({});
    setUploading(false);
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);

    // Fire off all uploads concurrently using Promise.all
    try {
      await Promise.all(
        files.map(async (file, index) => {
          try {
            const { fileId } = await uploadFile(file, (stage) => {
              setFileStages((prev) => ({ ...prev, [index]: stage }));
            });
            
            toast.success(`Upload complete: ${file.name}`, {
              description: `ID: ${fileId.slice(0, 8)}…`,
            });
          } catch (error) {
            toast.error(`Upload failed: ${file.name}`, {
              description: error instanceof Error ? error.message : "Unexpected error",
            });
          }
        })
      );

      // Refresh layout components silently
      router.refresh(); 
      setOpen(false);
      reset();
    } catch (error) {
      console.error("Batch upload error execution", error);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (uploading) return;
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col justify-between">
        <div>
          <DialogHeader className="mb-4">
            <DialogTitle>Upload files</DialogTitle>
            <DialogDescription>
              Files are uploaded concurrently straight to your backend.
            </DialogDescription>
          </DialogHeader>

          {/* Drag & Drop Area */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            disabled={uploading}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center transition-colors",
              dragging
                ? "border-foreground bg-accent"
                : "border-border hover:border-foreground/40 hover:bg-accent/50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-medium">Drop files here, or click to browse</p>
            </div>
          </button>

          {/* Files List View */}
          {files.length > 0 && (
            <div className="mt-4 space-y-3 overflow-y-auto max-h-[40vh] pr-1">
              {files.map((file, index) => {
                const currentStage = fileStages[index];
                return (
                  <div key={index} className="space-y-1.5 rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                        <FileIcon className="h-4 w-4" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Individual progress lines tracking concurrently */}
                    {currentStage && (
                      <div className="space-y-1 pt-1">
                        <Progress value={STAGE_VALUE[currentStage]} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground font-medium">
                          {STAGE_LABEL[currentStage]}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple // Allows multi-file selections via standard file window
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files ? Array.from(e.target.files) : [];
            if (selected.length > 0) {
              setFiles((prev) => [...prev, ...selected]);
            }
          }}
          disabled={uploading}
        />

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading}>
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? `Uploading (${files.length})` : "Upload All"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}