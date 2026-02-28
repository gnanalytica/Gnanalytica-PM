export type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

/** The 5 built-in default statuses. */
export type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'done' | 'canceled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/** Workflow category that groups statuses into pipeline phases. */
export type StatusCategory = 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled';

/** A single status definition in a project workflow. */
export type WorkflowStatus = {
  key: string;
  label: string;
  category: StatusCategory;
  color: string;
  position: number;
};

/** Per-project workflow configuration stored in `project_workflows`. */
export type ProjectWorkflow = {
  project_id: string;
  statuses: WorkflowStatus[];
  transitions: Record<string, string[]> | null;
};

const STATUS_TO_CATEGORY: Record<TicketStatus, StatusCategory> = {
  backlog: 'backlog',
  todo: 'unstarted',
  in_progress: 'started',
  done: 'completed',
  canceled: 'canceled',
};

export function getStatusCategory(status: string): StatusCategory {
  return STATUS_TO_CATEGORY[status as TicketStatus] ?? 'unstarted';
}

export function isStatusCompleted(status: string): boolean {
  return getStatusCategory(status) === 'completed';
}

export function isStatusClosed(status: string): boolean {
  const cat = getStatusCategory(status);
  return cat === 'completed' || cat === 'canceled';
}

/** Cycle progress: completed = issues with status_category = completed, percentage = completed / total */
export function getCycleProgress(
  issues: { status: string }[],
): { completed: number; total: number; percentage: number } {
  const total = issues.length;
  const completed = issues.filter((t) => isStatusCompleted(t.status)).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export const STATUS_CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'unstarted', label: 'Unstarted' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

/** All default statuses that belong to a given category. */
export function getStatusesForCategory(category: StatusCategory): TicketStatus[] {
  return TICKET_STATUSES.filter((s) => s.category === category).map((s) => s.value);
}

/** The default status to assign when a ticket enters a category (e.g. via board drag). */
const CATEGORY_DEFAULT_STATUS: Record<StatusCategory, TicketStatus> = {
  backlog: 'backlog',
  unstarted: 'todo',
  started: 'in_progress',
  completed: 'done',
  canceled: 'canceled',
};

export function getDefaultStatusForCategory(category: StatusCategory): string {
  return CATEGORY_DEFAULT_STATUS[category];
}

export type Ticket = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  status_category: StatusCategory;
  priority: TicketPriority;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  position: number;
  // Joined data
  assignee?: Profile | null;
  creator?: Profile | null;
  labels?: Label[];
};

export type Label = {
  id: string;
  project_id: string;
  name: string;
  color: string;
};

export type TicketLabel = {
  ticket_id: string;
  label_id: string;
};

export type Comment = {
  id: string;
  ticket_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  user?: Profile;
  replies?: Comment[];
};

export type Notification = {
  id: string;
  user_id: string;
  ticket_id: string | null;
  type: string;
  read: boolean;
  actor_id: string | null;
  created_at: string;
  ticket?: Ticket;
  actor?: Profile;
};

export type TicketWatcher = {
  ticket_id: string;
  user_id: string;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: Profile;
};

export type ViewFilters = {
  status?: string[];
  priority?: TicketPriority[];
  assignee_ids?: string[];
};

export type SavedView = {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  filters: ViewFilters;
  sort_key: string;
  sort_dir: string;
  created_at: string;
  updated_at: string;
};

export type Cycle = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  project_id: string;
  created_at: string;
};

export type TicketCycle = {
  ticket_id: string;
  cycle_id: string;
};

export type OnboardingState = {
  user_id: string;
  step: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

export const TICKET_STATUSES: { value: TicketStatus; label: string; category: StatusCategory }[] = [
  { value: 'backlog', label: 'Backlog', category: 'backlog' },
  { value: 'todo', label: 'Todo', category: 'unstarted' },
  { value: 'in_progress', label: 'In Progress', category: 'started' },
  { value: 'done', label: 'Done', category: 'completed' },
  { value: 'canceled', label: 'Canceled', category: 'canceled' },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];
