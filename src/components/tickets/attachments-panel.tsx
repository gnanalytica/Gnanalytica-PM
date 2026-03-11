"use client";

import { useRef, useCallback, useState } from "react";
import {
  useTicketAttachments,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/lib/hooks/use-attachments";

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function isImage(mimeType: string | null): boolean {
  return mimeType?.startsWith("image/") ?? false;
}

export function AttachmentsPanel({ ticketId }: { ticketId: string }) {
  const { data: attachments } = useTicketAttachments(ticketId);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList) => {
      Array.from(files).forEach((file) => {
        uploadAttachment.mutate({ ticketId, file });
      });
    },
    [ticketId, uploadAttachment],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-content-muted">
          Attachments {attachments?.length ? `(${attachments.length})` : ""}
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-[11px] text-content-muted hover:text-content-secondary active:scale-[0.96] transition-all duration-150"
        >
          + Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border border-dashed rounded p-3 text-center transition-colors ${
          dragOver ? "border-accent bg-accent-soft" : "border-border-subtle"
        }`}
      >
        <p className="text-[11px] text-content-muted">
          {uploadAttachment.isPending
            ? "Uploading..."
            : "Drop files here or click upload"}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* File list */}
      <div className="space-y-1">
        {attachments?.map((att) => (
          <div
            key={att.id}
            className="flex items-center gap-2 py-1 px-1 rounded hover:bg-hover transition-colors group"
          >
            <div className="flex-shrink-0 w-6 h-6 bg-surface-secondary rounded flex items-center justify-center">
              {isImage(att.mime_type) ? (
                <svg
                  className="w-3.5 h-3.5 text-content-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3.5 h-3.5 text-content-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-content-primary truncate">
                {att.file_name}
              </p>
              <p className="text-[10px] text-content-muted">
                {formatFileSize(att.file_size)}
              </p>
            </div>
            <button
              onClick={() =>
                deleteAttachment.mutate({
                  id: att.id,
                  ticketId,
                  storagePath: att.storage_path,
                })
              }
              className="text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 active:scale-[0.96] transition-all duration-150"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
