"use client";

import { useState, useLayoutEffect } from "react";
import { useCreateProject } from "@/lib/hooks/use-projects";

export function CreateProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createProject = useCreateProject();

  useLayoutEffect(() => {
    if (open) setError(null);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createProject.mutateAsync({
        name,
        description: description || undefined,
      });
      setName("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-overlay-in">
      <div className="bg-surface-secondary rounded-md border border-border-subtle w-full max-w-md p-5 animate-modal-in shadow-overlay">
        <h2 className="text-sm font-medium text-gray-900 mb-3">
          Create Project
        </h2>
        {error && (
          <p
            className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded mb-3"
            role="alert"
          >
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              placeholder="Project name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md px-2.5 py-1.5 text-sm"
              rows={3}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-700 hover:bg-hover active:bg-hover active:scale-[0.96] rounded-md transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending || !name.trim()}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
            >
              {createProject.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
