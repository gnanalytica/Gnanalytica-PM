"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/hooks/use-onboarding";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { useCreateTicket } from "@/lib/hooks/use-tickets";
import type { Project } from "@/types";

// ── Progress bar ──

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={`w-full h-1 rounded-full transition-colors duration-300 ${
                done ? "bg-blue-500" : active ? "bg-blue-300" : "bg-gray-200"
              }`}
            />
          </div>
        );
      })}
      <span className="text-[11px] text-gray-400 tabular-nums flex-shrink-0 ml-1">
        {step}/{total}
      </span>
    </div>
  );
}

// ── Step 1: Welcome ──

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
          />
        </svg>
      </div>
      <h2 className="text-sm font-medium text-gray-900 mb-1.5">
        Welcome to Internal PM
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        Let&apos;s get you set up. We&apos;ll walk you through creating your
        first project and issue.
      </p>
      <button
        onClick={onNext}
        className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] transition-all duration-150"
      >
        Get started
      </button>
    </div>
  );
}

// ── Step 2: Create Project ──

function CreateProjectStep({
  onCreated,
}: {
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const project = await createProject.mutateAsync({
        name,
        description: description || undefined,
      });
      onCreated(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-900 mb-1.5">
        Create your first project
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Projects hold all your issues, workflows, and cycles.
      </p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded mb-3">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Project name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Marketing Site"
            autoFocus
            className="w-full border rounded-md px-2.5 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional"
            className="w-full border rounded-md px-2.5 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={createProject.isPending || !name.trim()}
          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
        >
          {createProject.isPending ? "Creating..." : "Create project"}
        </button>
      </form>
    </div>
  );
}

// ── Step 3: Create Issue ──

function CreateIssueStep({
  projectId,
  onCreated,
}: {
  projectId: string;
  onCreated: (ticketId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createTicket = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const ticket = await createTicket.mutateAsync({
        project_id: projectId,
        title,
        status: "todo",
        priority: "medium",
      });
      onCreated(ticket.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue");
    }
  };

  return (
    <div>
      <h2 className="text-sm font-medium text-gray-900 mb-1.5">
        Create your first issue
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Issues track individual tasks, bugs, or feature requests.
      </p>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded mb-3">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-0.5">
            Issue title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Set up CI/CD pipeline"
            autoFocus
            className="w-full border rounded-md px-2.5 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={createTicket.isPending || !title.trim()}
          className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] disabled:opacity-50 transition-all duration-150"
        >
          {createTicket.isPending ? "Creating..." : "Create issue"}
        </button>
      </form>
    </div>
  );
}

// ── Step 4: Open Side Panel ──

function OpenSidePanelStep({
  projectId,
  ticketId,
  onNext,
}: {
  projectId: string;
  ticketId: string;
  onNext: () => void;
}) {
  const router = useRouter();

  const handleOpen = () => {
    // Navigate to the project page with the ticket side panel open
    router.push(`/project/${projectId}?ticket=${ticketId}`);
    onNext();
  };

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
      </div>
      <h2 className="text-sm font-medium text-gray-900 mb-1.5">
        View your issue
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        Click below to open the issue detail panel where you can add
        descriptions, assignees, labels, and comments.
      </p>
      <button
        onClick={handleOpen}
        className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] transition-all duration-150"
      >
        Open issue
      </button>
    </div>
  );
}

// ── Step 5: Completion ──

function CompletionStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-sm font-medium text-gray-900 mb-1.5">
        You&apos;re all set!
      </h2>
      <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
        You&apos;ve created your first project and issue. Explore the board
        view, add team members, and set up cycles.
      </p>
      <button
        onClick={onFinish}
        className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 active:scale-[0.97] transition-all duration-150"
      >
        Start using PM
      </button>
    </div>
  );
}

// ── Main overlay ──

export function OnboardingOverlay() {
  const {
    isLoading,
    isActive,
    step,
    totalSteps,
    goToStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  // Track created entities across steps
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  const handleProjectCreated = useCallback(
    (project: Project) => {
      setCreatedProject(project);
      goToStep(3);
    },
    [goToStep],
  );

  const handleIssueCreated = useCallback(
    (ticketId: string) => {
      setCreatedTicketId(ticketId);
      goToStep(4);
    },
    [goToStep],
  );

  const handleSidePanelOpened = useCallback(() => {
    goToStep(5);
  }, [goToStep]);

  if (isLoading || !isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-overlay-in">
      <div className="bg-surface-secondary rounded-lg border border-border-subtle w-full max-w-md p-6 animate-modal-in shadow-overlay">
        <ProgressBar step={step} total={totalSteps} />

        {step === 1 && <WelcomeStep onNext={() => goToStep(2)} />}
        {step === 2 && <CreateProjectStep onCreated={handleProjectCreated} />}
        {step === 3 && createdProject && (
          <CreateIssueStep
            projectId={createdProject.id}
            onCreated={handleIssueCreated}
          />
        )}
        {step === 4 && createdProject && createdTicketId && (
          <OpenSidePanelStep
            projectId={createdProject.id}
            ticketId={createdTicketId}
            onNext={handleSidePanelOpened}
          />
        )}
        {step === 5 && <CompletionStep onFinish={completeOnboarding} />}

        {/* Skip button — available on all steps except completion */}
        {step < 5 && (
          <button
            onClick={skipOnboarding}
            className="mt-4 w-full text-center text-xs text-gray-400 hover:text-gray-600 active:scale-[0.96] transition-all duration-150 cursor-pointer"
          >
            Skip onboarding
          </button>
        )}
      </div>
    </div>
  );
}
