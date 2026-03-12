'use client';

import { useState, useRef, useEffect } from 'react';

interface InlineEditCellProps {
  value: string | number;
  field: 'title' | 'priority' | 'status' | 'assignee' | 'dueDate';
  onSave: (value: string | number) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
}

export function InlineEditCell({
  value,
  field,
  onSave,
  placeholder = '',
  type = 'text',
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [showCheckmark, setShowCheckmark] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const discardTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && localValue !== value) {
      // Set discard timeout after 5 seconds of inactivity
      discardTimeoutRef.current = setTimeout(() => {
        // Show tooltip, then discard after another 5s
        // For now, just reset after inactivity
      }, 5000);

      return () => {
        if (discardTimeoutRef.current) clearTimeout(discardTimeoutRef.current);
      };
    }
  }, [localValue, isEditing, value]);

  const handleSave = async () => {
    if (localValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(localValue);
      setShowCheckmark(true);
      setIsEditing(false);

      // Fade out checkmark after 500ms
      setTimeout(() => setShowCheckmark(false), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      handleSave();
    }
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="cursor-pointer py-1 px-2 rounded hover:bg-surface-secondary transition-colors group relative"
      >
        <span className="text-content-primary">{value || placeholder}</span>
        {showCheckmark && (
          <span className="absolute right-0 top-1/2 transform -translate-y-1/2 text-success animate-fade-out">
            ✓
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        placeholder={placeholder}
        disabled={isSaving}
        className={`flex-1 px-2 py-1 text-13 border rounded transition-all ${
          error
            ? 'border-error bg-error/5'
            : localValue !== value
              ? 'border-dotted border-accent'
              : 'border-border-subtle'
        } focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent`}
      />
      {isSaving && <span className="text-accent text-12">Saving...</span>}
      {error && (
        <button
          onClick={handleSave}
          className="text-11 text-error hover:text-error-hover"
        >
          Retry
        </button>
      )}
    </div>
  );
}
