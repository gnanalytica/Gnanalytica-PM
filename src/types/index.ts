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

// ── Issue types ──

export type IssueType =
  | "bug"
  | "feature"
  | "task"
  | "improvement"
  | "epic"
  | "story"
  | "sub_task";

export const ISSUE_TYPES: { value: IssueType; label: string; icon: string }[] =
  [
    { value: "bug", label: "Bug", icon: "🐛" },
    { value: "feature", label: "Feature", icon: "✨" },
    { value: "task", label: "Task", icon: "☑️" },
    { value: "improvement", label: "Improvement", icon: "⬆️" },
    { value: "epic", label: "Epic", icon: "⚡" },
    { value: "story", label: "Story", icon: "📖" },
    { value: "sub_task", label: "Sub-task", icon: "📋" },
  ];

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoint = (typeof STORY_POINTS)[number];

// ── Statuses ──

/** The 6 built-in default statuses. */
export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "canceled";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/** Workflow category that groups statuses into pipeline phases. */
export type StatusCategory =
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

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
  backlog: "backlog",
  todo: "unstarted",
  in_progress: "started",
  in_review: "started",
  done: "completed",
  canceled: "canceled",
};

export function getStatusCategory(status: string): StatusCategory {
  return STATUS_TO_CATEGORY[status as TicketStatus] ?? "unstarted";
}

export function isStatusCompleted(status: string): boolean {
  return getStatusCategory(status) === "completed";
}

export function isStatusClosed(status: string): boolean {
  const cat = getStatusCategory(status);
  return cat === "completed" || cat === "canceled";
}

/** Cycle progress: completed = issues with status_category = completed, percentage = completed / total */
export function getCycleProgress(issues: { status: string }[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = issues.length;
  const completed = issues.filter((t) => isStatusCompleted(t.status)).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export const STATUS_CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "unstarted", label: "Unstarted" },
  { value: "started", label: "Started" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

/** All default statuses that belong to a given category. */
export function getStatusesForCategory(
  category: StatusCategory,
): TicketStatus[] {
  return TICKET_STATUSES.filter((s) => s.category === category).map(
    (s) => s.value,
  );
}

/** The default status to assign when a ticket enters a category (e.g. via board drag). */
const CATEGORY_DEFAULT_STATUS: Record<StatusCategory, TicketStatus> = {
  backlog: "backlog",
  unstarted: "todo",
  started: "in_progress",
  completed: "done",
  canceled: "canceled",
};

export function getDefaultStatusForCategory(category: StatusCategory): string {
  return CATEGORY_DEFAULT_STATUS[category];
}

// ── Ticket ──

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
  // New core fields
  issue_type: IssueType;
  story_points: number | null;
  start_date: string | null;
  parent_id: string | null;
  epic_id: string | null;
  milestone_id: string | null;
  // SLA fields
  first_response_at: string | null;
  resolved_at: string | null;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
  // Joined data
  assignee?: Profile | null;
  creator?: Profile | null;
  labels?: Label[];
  assignees?: TicketAssignee[];
  parent?: { id: string; title: string; status: string } | null;
  milestone?: {
    id: string;
    name: string;
    target_date: string | null;
    status: string;
  } | null;
  relations?: TicketRelation[];
  attachments?: TicketAttachment[];
  sub_tasks?: {
    id: string;
    title: string;
    status: string;
    status_category: StatusCategory;
  }[];
};

export type TicketAssignee = {
  user: Profile;
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

// ── Relations ──

export type RelationType =
  | "blocks"
  | "blocked_by"
  | "related_to"
  | "duplicate_of";

export type TicketRelation = {
  id: string;
  source_ticket_id: string;
  target_ticket_id: string;
  relation_type: RelationType;
  created_at: string;
  source_ticket?: { id: string; title: string; status: string };
  target_ticket?: { id: string; title: string; status: string };
};

// ── Attachments ──

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  uploaded_by: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  uploader?: Profile;
};

// ── Milestones ──

export type Milestone = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  target_date: string | null;
  status: "active" | "completed" | "canceled";
  created_at: string;
  updated_at: string;
};

// ── Teams ──

export type Team = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];
};

export type TeamMember = {
  team_id: string;
  user_id: string;
  role: "lead" | "member";
  created_at: string;
  user?: Profile;
};

// ── Custom fields ──

export type CustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "multi_select"
  | "checkbox"
  | "url";

export type CustomFieldDefinition = {
  id: string;
  project_id: string;
  name: string;
  field_type: CustomFieldType;
  options: string[] | null;
  required: boolean;
  position: number;
  created_at: string;
};

export type CustomFieldValue = {
  id: string;
  ticket_id: string;
  field_id: string;
  value: string | null;
  created_at: string;
  updated_at: string;
};

// ── Notification preferences ──

export type NotificationPreferences = {
  user_id: string;
  email_enabled: boolean;
  email_mode: "instant" | "digest" | "off";
  push_enabled: boolean;
  digest_enabled: boolean;
  digest_frequency: "daily" | "weekly";
  notify_on_assign: boolean;
  notify_on_mention: boolean;
  notify_on_status_change: boolean;
  notify_on_comment: boolean;
  notify_on_due_date: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at: string;
};

// ── Project members / roles ──

export type ProjectRole = "owner" | "admin" | "member" | "viewer";

export type ProjectMember = {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  user?: Profile;
};

// ── Knowledge base ──

export type KBArticle = {
  id: string;
  project_id: string;
  title: string;
  body: string | null;
  slug: string | null;
  published: boolean;
  author_id: string;
  category: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
};

// ── Comments ──

export type Comment = {
  id: string;
  ticket_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  created_at: string;
  updated_at?: string;
  user?: Profile;
  replies?: Comment[];
  reactions?: CommentReaction[];
};

export type CommentReaction = {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
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

// ── View filters ──

export type ViewFilters = {
  status?: string[];
  priority?: TicketPriority[];
  assignee_ids?: string[];
  label_ids?: string[];
  issue_type?: IssueType[];
  cycle_id?: string;
  milestone_id?: string;
  due_date_before?: string;
  due_date_after?: string;
  has_assignee?: boolean;
  is_overdue?: boolean;
  my_tickets?: boolean;
};

export type GroupByKey =
  | "status"
  | "priority"
  | "assignee"
  | "issue_type"
  | "milestone"
  | "epic"
  | "none";

export type SavedView = {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  filters: ViewFilters;
  sort_key: string;
  sort_dir: string;
  is_shared: boolean;
  share_token: string | null;
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
  retrospective_notes: string | null;
  auto_rollover: boolean;
  status: "planned" | "active" | "completed";
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

// ── Integrations ──

export type GithubIntegration = {
  id: string;
  project_id: string;
  repo_owner: string;
  repo_name: string;
  installation_id: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type TicketGithubLink = {
  id: string;
  ticket_id: string;
  github_integration_id: string;
  link_type: "pr" | "issue" | "branch" | "commit";
  url: string;
  title: string | null;
  number: number | null;
  state: string | null;
  created_at: string;
};

export type Webhook = {
  id: string;
  project_id: string;
  url: string;
  secret: string | null;
  events: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkflowAutomation = {
  id: string;
  project_id: string;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// ── Recent items ──

export type RecentItem = {
  id: string;
  user_id: string;
  item_type: "ticket" | "project" | "milestone";
  item_id: string;
  accessed_at: string;
};

// ── Customer portal ──

export type CustomerOrg = {
  id: string;
  project_id: string;
  name: string;
  domain: string | null;
  created_at: string;
};

export type CustomerUser = {
  id: string;
  org_id: string;
  email: string;
  name: string | null;
  auth_user_id: string | null;
  created_at: string;
};

// ── Constants ──

// ── SLA Policies ──

export type SLAPolicy = {
  id: string;
  project_id: string;
  priority: TicketPriority;
  response_time_minutes: number;
  resolution_time_minutes: number;
  created_at: string;
  updated_at: string;
};

// ── Time Entries ──

export type TimeEntry = {
  id: string;
  ticket_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  description: string | null;
  is_running: boolean;
  created_at: string;
  updated_at: string;
  user?: Profile;
};

// ── Favorites ──

export type Favorite = {
  id: string;
  user_id: string;
  item_type: "project" | "ticket";
  item_id: string;
  position: number;
  created_at: string;
};

export const TICKET_STATUSES: {
  value: TicketStatus;
  label: string;
  category: StatusCategory;
}[] = [
  { value: "backlog", label: "Backlog", category: "backlog" },
  { value: "todo", label: "Todo", category: "unstarted" },
  { value: "in_progress", label: "In Progress", category: "started" },
  { value: "in_review", label: "In Review", category: "started" },
  { value: "done", label: "Done", category: "completed" },
  { value: "canceled", label: "Canceled", category: "canceled" },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ── Shared emoji maps ──

export const STATUS_EMOJI: Record<string, string> = {
  backlog: "\u{1F4CB}",
  todo: "\u{1F4DD}",
  in_progress: "\u{1F504}",
  in_review: "\u{1F440}",
  done: "\u2705",
  canceled: "\u{1F6AB}",
};

export const PRIORITY_EMOJI: Record<string, string> = {
  urgent: "\u{1F534}",
  high: "\u{1F7E0}",
  medium: "\u{1F7E1}",
  low: "\u{1F535}",
};

export const ISSUE_TYPE_EMOJI: Record<string, string> = {
  task: "\u{1F4CC}",
  bug: "\u{1F41B}",
  feature: "\u2728",
  improvement: "\u{1F4A1}",
  story: "\u{1F4D6}",
  epic: "\u{1F3AF}",
  sub_task: "\u{1F4CE}",
};

// ── API Types ──

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  widgets: WidgetConfig[];
  userRole?: "product" | "developer" | "admin";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  icon?: string;
  size: "small" | "medium" | "large";
  order: number;
  isVisible: boolean;
  customHeight?: number;
}

export interface GlobalView {
  id: string;
  name: string;
  description: string;
  icon: string;
  filters: Record<string, any>;
}
