"use client";

import { useState, useCallback } from "react";

type ToolbarAction = {
  label: string;
  icon: string;
  prefix: string;
  suffix: string;
};

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { label: "Bold", icon: "B", prefix: "**", suffix: "**" },
  { label: "Italic", icon: "I", prefix: "_", suffix: "_" },
  { label: "Code", icon: "<>", prefix: "`", suffix: "`" },
  { label: "List", icon: "•", prefix: "- ", suffix: "" },
];

export function RichTextEditor({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  isSubmitting,
  minRows,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  minRows?: number;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const wrapSelection = useCallback(
    (prefix: string, suffix: string) => {
      const textarea =
        document.querySelector<HTMLTextAreaElement>("[data-rich-editor]");
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const newText =
        value.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        value.substring(end);

      onChange(newText);
      // Restore selection after state update
      requestAnimationFrame(() => {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = end + prefix.length;
        textarea.focus();
      });
    },
    [value, onChange],
  );

  return (
    <div className="border border-border-subtle rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border-subtle bg-surface-secondary">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => wrapSelection(action.prefix, action.suffix)}
            title={action.label}
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium text-content-muted hover:text-content-secondary hover:bg-hover transition-colors"
          >
            {action.icon}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            showPreview
              ? "bg-accent-soft text-accent"
              : "text-content-muted hover:text-content-secondary"
          }`}
        >
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* Editor / Preview */}
      {showPreview ? (
        <div className="px-3 py-2 min-h-[80px] text-sm text-content-secondary whitespace-pre-wrap prose prose-sm max-w-none">
          {value || (
            <span className="text-content-muted">Nothing to preview</span>
          )}
        </div>
      ) : (
        <textarea
          data-rich-editor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Write a comment... (Markdown supported)"}
          className="w-full px-3 py-2 text-sm bg-transparent text-content-primary outline-none resize-none"
          rows={minRows ?? 3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit?.();
            }
          }}
        />
      )}

      {/* Submit */}
      {onSubmit && (
        <div className="flex justify-end px-2 py-1.5 border-t border-border-subtle">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim() || isSubmitting}
            className="px-3 py-1 text-xs bg-accent text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? "Sending..." : (submitLabel ?? "Comment")}
          </button>
        </div>
      )}
    </div>
  );
}
