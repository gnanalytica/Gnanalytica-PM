/**
 * Reusable skeleton loader components.
 * Each skeleton matches the final layout shape of its corresponding component
 * to prevent layout shift. Uses a subtle shimmer animation (Tailwind only).
 */

// ── Base bone ──

function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded bg-surface-tertiary animate-shimmer ${className ?? ''}`}
    />
  );
}

/** Dark variant for sidebar */
function DarkBone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded bg-surface-tertiary animate-shimmer ${className ?? ''}`}
      style={style}
    />
  );
}

// ── IssueRowSkeleton ──
// Matches TicketListView row: [status dot] [ID] Title ... [priority] [avatar] [updated]
// ROW_HEIGHT = 36px in the real component

export function IssueRowSkeleton() {
  return (
    <div className="flex items-center h-9 border-b border-border-subtle px-3">
      {/* Status dot */}
      <Bone className="w-2 h-2 rounded-full flex-shrink-0" />
      {/* ID */}
      <Bone className="h-3 w-10 flex-shrink-0 ml-2 mr-2" />
      {/* Title */}
      <Bone className="h-3.5 flex-1" />
      {/* Priority */}
      <Bone className="h-3 w-4 flex-shrink-0 ml-3" />
      {/* Assignee avatar */}
      <Bone className="w-5 h-5 rounded-full flex-shrink-0 ml-2.5" />
      {/* Updated */}
      <Bone className="h-3 w-8 flex-shrink-0 ml-2" />
    </div>
  );
}

export function IssueListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-sm overflow-hidden">
      {Array.from({ length: rows }, (_, i) => (
        <IssueRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ── BoardCardSkeleton ──
// Matches TicketCard: priority dot + ID row, title row, optional labels

export function BoardCardSkeleton({ showLabels = false }: { showLabels?: boolean }) {
  return (
    <div className="bg-surface-tertiary rounded-sm px-2 py-1">
      {/* Row 1: priority dot + ID … avatar */}
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <div className="flex items-center gap-1.5">
          <Bone className="w-2 h-2 rounded-full" />
          <Bone className="h-2.5 w-12" />
        </div>
        <Bone className="w-[18px] h-[18px] rounded-full flex-shrink-0" />
      </div>
      {/* Row 2: title */}
      <Bone className="h-3.5 w-full" />
      {/* Row 3: labels */}
      {showLabels && (
        <div className="flex gap-1 mt-1">
          <Bone className="h-3 w-10 rounded" />
          <Bone className="h-3 w-14 rounded" />
        </div>
      )}
    </div>
  );
}

export function BoardSkeleton() {
  const columnCards = [2, 3, 2, 1];
  return (
    <div className="flex gap-2.5">
      {columnCards.map((count, col) => (
        <div key={col} className="w-64 bg-surface-secondary rounded-sm p-2 flex-shrink-0">
          {/* Column header */}
          <div className="flex items-center justify-between mb-1.5">
            <Bone className="h-3 w-20" />
            <Bone className="h-4 w-5 rounded-full" />
          </div>
          {/* Cards */}
          <div className="space-y-0.5">
            {Array.from({ length: count }, (_, i) => (
              <BoardCardSkeleton key={i} showLabels={i === 0 && col < 2} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SidebarSkeleton ──
// Matches Sidebar: workspace header, nav links, projects section, user section

export function SidebarSkeleton() {
  return (
    <aside className="w-[220px] h-screen bg-sidebar flex flex-col flex-shrink-0 border-r border-border-subtle">
      {/* Workspace header */}
      <div className="flex items-center gap-2.5 px-3 h-11">
        <DarkBone className="w-5 h-5 rounded" />
        <DarkBone className="h-3.5 w-24" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1.5">
        <div className="px-2 mb-1">
          <DarkBone className="h-2.5 w-16 ml-2" />
        </div>
        <div className="px-2 mb-2 space-y-0.5">
          {/* Dashboard link */}
          <div className="flex items-center gap-2 px-2 py-[5px]">
            <DarkBone className="w-4 h-4 rounded" />
            <DarkBone className="h-3.5 w-20" />
          </div>
          {/* My Issues link */}
          <div className="flex items-center gap-2 px-2 py-[5px]">
            <DarkBone className="w-4 h-4 rounded" />
            <DarkBone className="h-3.5 w-16" />
          </div>
          {/* Inbox link */}
          <div className="flex items-center gap-2 px-2 py-[5px]">
            <DarkBone className="w-4 h-4 rounded" />
            <DarkBone className="h-3.5 w-10" />
          </div>
        </div>

        {/* Projects section */}
        <div className="px-2">
          <div className="flex items-center justify-between px-2 py-[5px]">
            <DarkBone className="h-2.5 w-14" />
            <DarkBone className="w-3.5 h-3.5 rounded" />
          </div>
          <div className="space-y-0.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-[5px]">
                <DarkBone className="w-2 h-2 rounded-full" />
                <DarkBone className="h-3.5" style={{ width: `${70 - i * 10}%` }} />
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-border-subtle px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DarkBone className="w-5 h-5 rounded-full" />
            <DarkBone className="h-3.5 w-20" />
          </div>
          <DarkBone className="w-3.5 h-3.5 rounded" />
        </div>
      </div>
    </aside>
  );
}

// ── MyIssues row skeleton ──
// Matches my-issues ticket row: [status dot] [ID] Title ... [priority badge] [avatar] [updated]

export function MyIssueRowSkeleton() {
  return (
    <div className="flex items-center px-6 py-1.5 border-b border-border-subtle">
      <Bone className="w-2 h-2 rounded-full flex-shrink-0" />
      <Bone className="h-3 w-10 flex-shrink-0 ml-2 mr-2" />
      <Bone className="h-3.5 flex-1" />
      <Bone className="h-4 w-12 rounded flex-shrink-0 ml-3" />
      <Bone className="w-5 h-5 rounded-full flex-shrink-0 ml-2.5" />
      <Bone className="h-3 w-12 flex-shrink-0 ml-2" />
    </div>
  );
}

export function MyIssueListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 mt-2">
      {Array.from({ length: rows }, (_, i) => (
        <MyIssueRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Dashboard project row skeleton ──

export function ProjectCardSkeleton() {
  return (
    <div className="bg-surface-secondary rounded border border-border-subtle p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Bone className="w-2 h-2 rounded-full" />
        <Bone className="h-3.5 w-28" />
      </div>
      <Bone className="h-3 w-full mb-1" />
      <Bone className="h-3 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
