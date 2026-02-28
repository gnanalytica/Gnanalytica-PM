'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProjects } from '@/lib/hooks/use-projects';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { EmptyState, FolderIcon } from '@/components/empty-state';
import { DashboardSkeleton } from '@/components/skeletons';

const PROJECT_COLORS = ['#5e6ad2', '#c27070', '#c48a5a', '#5fae7e', '#6e9ade', '#9585c4', '#c47a9a', '#c9a04e'];
function projectColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

export default function DashboardPage() {
  const { data: projects, isLoading, isError } = useProjects();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-6 border-b border-border-subtle flex-shrink-0">
        <h1 className="text-13 font-medium text-content-primary">Projects</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1 text-[12px] bg-accent text-white rounded hover:opacity-90 active:opacity-80 transition-opacity duration-[120ms]"
        >
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
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
                className="block bg-surface-secondary rounded border border-border-subtle p-3 hover:bg-hover transition-colors duration-[120ms]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projectColor(project.id) }}
                  />
                  <span className="text-13 font-medium text-content-primary truncate">{project.name}</span>
                </div>
                {project.description ? (
                  <p className="text-[12px] text-content-secondary line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-[12px] text-content-muted italic">No description</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
