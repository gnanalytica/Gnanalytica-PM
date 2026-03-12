import { Ticket, Profile } from "@/types";

export type WidgetType =
  | "status"
  | "deadlines"
  | "workload"
  | "velocity"
  | "projects"
  | "my-tasks";

export type WidgetSize = "small" | "medium" | "large";
export type UserRole = "product" | "developer" | "admin";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  icon?: string;
  size: WidgetSize;
  order: number;
  customHeight?: number;
  isVisible: boolean;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  userRole?: UserRole;
  widgets: DashboardWidget[];
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean;
}

export interface TasksByStatus {
  todo: number;
  in_progress: number;
  done: number;
  in_review: number;
  backlog: number;
  canceled: number;
}

export interface UpcomingDeadline {
  task: Ticket;
  daysUntilDue: number;
  isOverdue: boolean;
  urgency: "overdue" | "this-week" | "next-week";
}

export interface TeamMemberWorkload {
  userId: string;
  userName: string;
  userAvatar: string | null;
  taskCount: number;
  status: "balanced" | "overload" | "crisis";
  tasksAssigned: Ticket[];
}

export interface SprintVelocityData {
  sprintName: string;
  completed: number;
  total: number;
  velocity: number;
  isCurrentSprint: boolean;
}

export interface ProjectOverviewCard {
  projectId: string;
  projectName: string;
  projectEmoji: string;
  taskCounts: TasksByStatus;
  totalTasks: number;
  completionPercentage: number;
}

export interface DashboardStats {
  totalTasks: number;
  tasksByStatus: TasksByStatus;
  upcomingDeadlines: UpcomingDeadline[];
  teamWorkload: TeamMemberWorkload[];
  sprintVelocity: SprintVelocityData[];
  projects: ProjectOverviewCard[];
  myTasks: Ticket[];
}

export interface DashboardCustomizationState {
  isOpen: boolean;
  selectedWidgets: Set<WidgetType>;
  showResetButton: boolean;
}

// Default layouts by role
export const DEFAULT_LAYOUTS_BY_ROLE: Record<UserRole, WidgetType[]> = {
  product: ["projects", "deadlines", "status", "workload"],
  developer: ["velocity", "my-tasks", "deadlines", "workload"],
  admin: ["status", "deadlines", "workload", "velocity", "projects", "my-tasks"],
};

// Widget metadata
export const WIDGET_METADATA: Record<
  WidgetType,
  {
    title: string;
    icon: string;
    defaultSize: WidgetSize;
    description: string;
  }
> = {
  status: {
    title: "Tasks by Status",
    icon: "📊",
    defaultSize: "medium",
    description: "Breakdown of tasks across different statuses",
  },
  deadlines: {
    title: "Upcoming Deadlines",
    icon: "📅",
    defaultSize: "small",
    description: "Tasks due in the next 2 weeks",
  },
  workload: {
    title: "Team Workload",
    icon: "👥",
    defaultSize: "medium",
    description: "Team member workload distribution",
  },
  velocity: {
    title: "Sprint Velocity",
    icon: "🚀",
    defaultSize: "medium",
    description: "Historical velocity trend",
  },
  projects: {
    title: "Projects Overview",
    icon: "📁",
    defaultSize: "medium",
    description: "Quick view of all projects",
  },
  "my-tasks": {
    title: "My Tasks",
    icon: "✅",
    defaultSize: "medium",
    description: "Tasks assigned to you",
  },
};
