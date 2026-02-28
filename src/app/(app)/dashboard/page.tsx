'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/lib/hooks/use-projects';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { EmptyState, FolderIcon } from '@/components/empty-state';
import { DashboardSkeleton } from '@/components/skeletons';

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-1.5">
        <h1 className="text-xs font-medium uppercase tracking-wide text-content-muted">Projects</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-[120ms]"
        >
          New Project
        </button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="text-center py-4 text-red-500 text-sm">
          <p>Failed to load projects. Check your connection and try again.</p>
        </div>
      ) : projects?.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-10 h-10" />}
          title="No projects yet"
          description="Create your first project to start tracking issues."
          action={{ label: 'New Project', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="block bg-surface-secondary rounded-lg border border-border-subtle p-4 hover:bg-hover transition-colors duration-[120ms]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-content-primary truncate">{project.name}</span>
                <span className="text-[10px] text-content-muted flex-shrink-0 tabular-nums">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              {project.description ? (
                <p className="text-xs text-content-secondary line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              ) : (
                <p className="text-xs text-content-muted italic">No description</p>
              )}
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
