# Project Management Tool - Product Specification

## Overview

Build a modern, Linear-inspired project management tool designed for software teams. The tool should feel fast, keyboard-driven, and visually clean with a focus on minimalism and productivity. Think of it as a blend of Linear's sleek UI with Jira's depth of features.

---

## 1. Look & Feel

### Design Philosophy
- Clean, minimal interface with generous whitespace
- Muted color palette with semantic color tokens (not loud primary colors)
- Smooth transitions and micro-animations throughout
- Information density should be high but not overwhelming — every element earns its place

### Theme Support
- Dark mode (default) and light mode
- User-toggleable from the sidebar
- Persist theme preference across sessions
- Smooth transition when switching themes

### Typography & Colors
- Monospace-leaning or modern sans-serif font
- Semantic color system:
  - Surface colors: primary, secondary, tertiary backgrounds
  - Content colors: primary, secondary, muted text
  - Border colors: subtle and default variants
  - Accent color for primary actions and focus states
  - Hover and active state colors

### Loading States
- Skeleton loaders (shimmer effect) for all data-heavy sections
- No spinners — use placeholder shapes that match the content layout

---

## 2. Layout Architecture

### Desktop (Three-Panel Layout)
The app uses a three-panel layout similar to Linear:

```
+-- Sidebar (fixed, ~220px) --+---- Main Content (flexible) ----+-- Detail Panel (~440px) --+
|                              |                                  |                           |
| Search trigger (Cmd+K)       | Project views:                  | Selected ticket details:  |
| Inbox with unread badge      |   List / Board / Calendar /     |   Editable title          |
| My Issues link               |   Spreadsheet / Roadmap /       |   Property badges         |
| Project tree (expandable)    |   Analytics / Epics /           |   Description editor      |
|   - Each project             |   Teams / Sprints /             |   Comments thread         |
|   - Cycles under project     |   Milestones                    |   Activity timeline       |
|   - Milestones               |                                 |   Relations               |
| Saved Views                  | Filter bar at top               |   Attachments             |
| Settings                     | Bulk action bar (when selected) |   Custom fields           |
|                              |                                 |                           |
| Theme toggle (bottom)        |                                 | Close with Esc            |
| User profile / Sign out      |                                 |                           |
+------------------------------+---------------------------------+---------------------------+
```

- The detail panel opens inline (not as an overlay) when a ticket is selected
- Clicking a different ticket swaps the detail panel content
- Pressing Escape closes the detail panel, then closes any open dialogs in layered order

### Mobile Layout
- Sidebar hidden behind a hamburger menu (slide-out drawer)
- Main content takes full width
- Detail panel becomes a full-screen overlay/modal
- Touch-friendly tap targets and buttons
- Breakpoint at ~1024px for mobile/desktop switch

### Sidebar Details
- Collapsible on desktop (icon-only mode) to save space
- Project list is a tree structure — projects expand to show cycles, milestones
- Active page/project highlighted
- Notification bell with unread count badge
- Quick-access to search, inbox, and personal issues

---

## 3. Core Features

### 3.1 Authentication & Onboarding

**Authentication:**
- OAuth-based sign-in (Google, GitHub, etc.)
- Separate authentication for internal team users and external customer portal users
- Session persistence across browser tabs

**Onboarding:**
- Multi-step onboarding wizard for first-time users (5 steps)
- Progress saved to database so users can resume
- Can be skipped at any time
- Guides users through: creating a project, understanding views, creating first ticket, inviting team members, exploring keyboard shortcuts

---

### 3.2 Projects

- Users can create multiple projects
- Each project has its own:
  - Ticket list and board
  - Custom workflow (statuses)
  - Team members with role-based access
  - Cycles (sprints)
  - Milestones (releases)
  - Labels
  - Custom field definitions
  - Knowledge base articles
  - Analytics dashboard
  - Integrations (e.g., GitHub)
  - Automation rules
- Project settings page for configuration
- Project member management with roles: Owner, Admin, Member, Viewer

---

### 3.3 Tickets (Issues)

Tickets are the core entity. Each ticket has:

**Basic Properties:**
- Title (editable inline)
- Description (rich text / markdown editor)
- Status (from the project's custom workflow)
- Priority: Low, Medium, High, Urgent
- Assignee (single primary + multi-assignee support)
- Labels (multiple, color-coded tags)
- Created by (auto-set)
- Created at / Updated at (timestamps)
- Due date (optional)
- Start date (optional)

**Advanced Properties:**
- Issue type: Bug, Feature, Task, Improvement, Epic, Story, Sub-task
  - Each type has a distinct icon/emoji for quick visual identification
- Story points: Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- Cycle/Sprint assignment
- Milestone assignment
- Parent ticket (for sub-task hierarchy)
- Epic grouping
- Position (for drag-and-drop ordering within columns)

**Ticket Relations:**
- Blocks (this ticket blocks another)
- Blocked by (this ticket is waiting on another)
- Related to (loose association)
- Duplicate of (marks as duplicate)

**Ticket Interactions:**
- Threaded comments with nested replies
- @mentions in comments (triggers notifications)
- Emoji reactions on comments
- File attachments (with file type and size tracking)
- Watch/unwatch (subscribe to updates)
- Full activity log showing every change (who changed what, when, old value vs new value)

**Custom Fields:**
- Project admins can define additional fields per project
- Supported types: Text, Number, Date, Single Select, Multi Select, Checkbox, URL

**Ticket Creation:**
- Modal dialog for creating new tickets
- Pre-fill project from current context
- Quick-create from command palette

---

### 3.4 Views (Multiple Ways to See Tickets)

Each project supports multiple view modes, switchable via tabs:

1. **List View** — Linear-style rows with inline property badges (status dot, priority icon, assignee avatar, labels). Clean, scannable, information-dense.

2. **Board View (Kanban)** — Drag-and-drop columns grouped by status category (Backlog, Unstarted, Started, Completed, Canceled). Tickets are cards showing title, priority, assignee, and labels.

3. **Calendar View** — Tickets plotted on a calendar by due date. Good for deadline tracking.

4. **Spreadsheet View** — Excel-like grid with inline editing of all properties. Best for bulk data entry.

5. **Roadmap View** — Gantt-style timeline visualization showing tickets across time, useful for planning.

6. **Analytics View** — Dashboard with charts:
   - Burndown chart (sprint progress)
   - Velocity chart (team throughput over sprints)
   - Completion trends (historical)
   - Project overview KPIs (open tickets, completion rate, overdue count)

7. **Epic List** — Hierarchical view showing epics and their child tickets.

8. **Team View** — Team-centric view showing members and their workload.

9. **Sprint Planning View** — Dedicated view for planning and managing cycles/sprints.

10. **Milestone View** — List of milestones with progress indicators and target dates.

---

### 3.5 Filtering, Sorting & Saved Views

**Filter Bar:**
- Filter by: Status, Priority, Assignee, Labels, Issue Type, Cycle, Milestone
- Multiple values per filter (e.g., show High AND Urgent priority)
- Filters reflected in URL query parameters for shareability

**Sorting:**
- Sort by: Created date, Updated date, Priority, Due date, Title
- Ascending/descending toggle

**Group By:**
- Group tickets by: Status, Assignee, Priority, Milestone

**Saved Views:**
- Save any combination of filters + sort + group-by as a named view
- Views appear in the sidebar for quick access
- Views can be shared with team via a share link/token
- Per-user and per-project

---

### 3.6 Bulk Actions

- Multi-select tickets using checkboxes
- A floating bulk actions bar appears at the bottom when tickets are selected
- Bulk operations: Change status, Change priority, Assign, Add label, Move to cycle, Delete

---

### 3.7 Cycles (Sprints)

- Create named cycles with start and end dates
- Assign tickets to cycles
- Auto-rollover option: unfinished tickets automatically move to the next cycle
- Cycle status tracking (active, completed)
- Retrospective notes field per cycle
- Active cycle displayed prominently (cycle bar in the project view)

---

### 3.8 Milestones (Releases)

- Named milestones with target dates
- Status: Active, Completed, Canceled
- Optional description
- Assign tickets to milestones
- Progress tracking (how many tickets done vs total)

---

### 3.9 Custom Workflows

- Each project has its own set of statuses
- Statuses map to broader status categories: Backlog, Unstarted, Started, Completed, Canceled
- Workflow editor UI for adding/removing/reordering custom statuses
- Status category mapping enables consistent board columns across different projects
- Default workflow templates available when creating new projects

---

### 3.10 Labels

- Per-project colored labels/tags
- Assign multiple labels to a ticket
- Labels used in filtering and visual identification
- Admin can create/edit/delete labels

---

### 3.11 Teams

- Organize project members into teams within a project
- Each team has: Name, Description, Color
- Team roles: Lead, Member
- Teams can be used for filtering and workload distribution

---

### 3.12 Search

**Global Search (Command Palette):**
- Activated with Cmd/Ctrl+K or / key
- Search across all tickets, projects, and recent items
- Multi-page palette with contextual actions:
  - Create ticket (select project first)
  - Open project
  - Change ticket status
  - Assign ticket to user
  - Move ticket to cycle
  - Assign milestone
  - Search all tickets
- Recent items shown for quick re-access
- Fuzzy matching for forgiving searches

**Full-Text Search:**
- Server-side full-text search on ticket title and description
- Weighted search (title matches rank higher than description)
- Project-scoped search option

**Comment Search:**
- Search within comment content

---

### 3.13 Keyboard Shortcuts

The app should be fully keyboard-navigable:

**Global:**
- `Cmd/Ctrl + K` — Open command palette
- `/` — Focus search
- `?` — Show keyboard shortcuts help modal
- `Esc` — Close current panel/dialog (layered: dropdown > edit mode > panel)

**Navigation:**
- `J` / `K` — Next/previous issue in list
- `G then D` — Go to dashboard
- `G then I` — Go to my issues

**Issue Actions:**
- `C` — Create new issue
- `L` — Add label
- `Ctrl/Cmd + Enter` — Submit comment
- `Ctrl/Cmd + Backspace` — Delete (with confirmation)

**Help Modal:**
- Pressing `?` opens a modal showing all available shortcuts organized by category

---

### 3.14 Notifications & Inbox

**In-App Inbox (`/inbox`):**
- Chronological list of all notifications
- Grouped by time: Today, Yesterday, This Week, Earlier
- Each notification shows: actor, action, ticket reference
- Click to navigate to the relevant ticket
- Mark individual or all notifications as read
- Unread count shown on notification bell in sidebar
- Virtual scrolling for performance with large notification lists

**Notification Triggers:**
- Assigned to a ticket
- @mentioned in a comment
- Ticket status changed (for watched tickets)
- New comment on watched ticket
- Due date approaching

**Email Notifications:**
- Three modes: Instant (real-time), Digest (daily summary), Off
- Per-event toggles: assignment, mention, status change, comment, due date
- Quiet hours setting (start time / end time — no emails during this window)
- Daily digest email summarizing activity from the last 24 hours
- Due date reminder emails for tickets due today or tomorrow

**User Preferences:**
- Configurable in Settings > Notifications
- Full control over which events trigger notifications
- Email delivery mode selection

---

### 3.15 Dashboard

Personal dashboard showing:
- Quick metrics (tickets assigned to you, overdue items, recent activity)
- Quick-access links to your projects
- Recent activity feed
- Upcoming due dates

---

### 3.16 My Issues

A personal view aggregating:
- All tickets assigned to you across all projects
- Tickets you created
- Recent activity on your tickets
- Filterable and sortable like project views

---

### 3.17 Knowledge Base

**Internal KB:**
- Create articles within a project
- Fields: Title, Body (rich text), Category, Position (ordering)
- Articles can be marked as published or draft
- Author tracking

**Public KB (Customer-facing):**
- Published articles accessible without authentication
- Organized by category
- Individual article pages with clean reading layout
- Accessible from customer portal

---

### 3.18 Customer Portal

A separate, simplified interface for external customers/stakeholders:

- Separate login system (not the same as internal team auth)
- Customers belong to organizations
- Features available to customers:
  - View their own submitted tickets
  - Create new support/feature request tickets
  - View ticket status and updates
  - Add comments to their tickets
  - Browse published knowledge base articles
- Internal comments (marked as internal) are hidden from customers
- Clean, simple UI — no access to boards, sprints, analytics, etc.

---

### 3.19 GitHub Integration

- Connect a GitHub repository to a project
- Link tickets to GitHub artifacts:
  - Pull Requests
  - Issues
  - Branches
  - Commits
- Track linked PR/issue status alongside tickets
- Setup page within project settings > integrations

---

### 3.20 Automation Rules

- Per-project automation rules with trigger-action pairs
- Can be enabled/disabled individually

**Available Triggers:**
- Status changed
- Label added
- Assignee changed
- Pull request merged
- Comment added
- Due date reached

**Available Actions:**
- Change status
- Add label
- Assign user
- Send notification
- Move to cycle
- Add comment

Example: "When a PR is merged, automatically change ticket status to Done"

---

### 3.21 Webhooks

- Outbound webhooks for integrating with external services
- Configurable per project
- Triggered on ticket events

---

### 3.22 Activity Audit Log

- Every change to a ticket is logged:
  - Ticket created
  - Status changed (old value -> new value)
  - Assignee changed
  - Priority changed
  - Comment added
  - Any field update
- Displayed as a timeline within the ticket detail panel
- User attribution and timestamps on every entry

---

### 3.23 Real-Time Collaboration

- All changes sync in real-time across all connected users
- When someone updates a ticket, everyone viewing it sees the change immediately
- Real-time updates on: tickets, comments, notifications, activity log, reactions, assignees, milestones
- No manual refresh needed

---

### 3.24 Attachments

- Upload files to tickets
- Track: file name, file type, file size, uploader
- Display attachments in the ticket detail panel
- Support common file types (images, documents, etc.)

---

## 4. Role-Based Access Control

### Project Roles
| Role | Permissions |
|------|------------|
| **Owner** | Full control including deleting project, managing all members |
| **Admin** | Full control over project settings, workflows, members |
| **Member** | Create and edit tickets, comment, full collaboration |
| **Viewer** | Read-only access to all project data |

### Key Access Rules
- All data is protected — authentication required for all operations
- Users can only see projects they are members of
- Customer portal users have completely separate access from internal users
- Published knowledge base articles are publicly readable (no auth required)

---

## 5. Pages & Navigation Structure

### Internal App Pages
| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/dashboard` | Personal overview and metrics |
| Project | `/project/[id]` | Main project workspace with all views |
| Project Settings | `/project/[id]/settings/members` | Member management |
| Project KB | `/project/[id]/kb` | Knowledge base articles |
| Project Integrations | `/project/[id]/integrations` | GitHub and webhook setup |
| Ticket Detail | `/ticket/[id]` | Full-page ticket view |
| My Issues | `/my-issues` | Personal issue aggregation |
| Inbox | `/inbox` | Notification center |
| Notification Settings | `/settings/notifications` | Email and notification preferences |

### Customer Portal Pages
| Page | Path | Purpose |
|------|------|---------|
| Customer Login | `/customer-login` | Portal authentication |
| Ticket List | `/portal` | Customer's submitted tickets |
| New Ticket | `/portal/new` | Submit a new request |
| Ticket Detail | `/portal/[id]` | View ticket and add comments |
| Knowledge Base | `/kb` | Browse published articles |
| Article | `/kb/[id]` | Read individual article |

### Auth Pages
| Page | Path | Purpose |
|------|------|---------|
| Login | `/login` | OAuth sign-in |
| Auth Callback | `/auth/callback` | OAuth redirect handler |

---

## 6. Visual Design Details

### Issue Type Icons
- Bug: Bug icon (red-tinted)
- Feature: Sparkle/star icon
- Task: Checkbox icon
- Improvement: Up arrow icon
- Epic: Lightning bolt icon
- Story: Book icon
- Sub-task: Clipboard/nested icon

### Status Indicators
- Small colored dots next to status text
- Colors mapped to status categories:
  - Backlog: Gray
  - Unstarted: Gray/Blue
  - Started: Yellow/Orange
  - Completed: Green
  - Canceled: Red/Muted

### Priority Indicators
- Small icons with color coding:
  - Urgent: Red
  - High: Orange
  - Medium: Yellow
  - Low: Gray/Blue

### Ticket Cards (Board View)
- Clean white/dark cards with subtle border
- Show: Title, priority icon, assignee avatar, label chips
- Drag handle for reordering
- Hover state with subtle elevation/shadow

### Ticket Rows (List View)
- Compact rows with inline property badges
- Status dot, title, priority icon, assignee avatar, label chips, due date
- Hover highlight
- Click to open detail panel

### Empty States
- Friendly illustrations or icons when a list/view has no data
- Clear call-to-action (e.g., "No tickets yet. Create your first one.")

### Toasts
- Non-blocking notification toasts for actions (saved, deleted, error)
- Appear at top or bottom of screen
- Auto-dismiss after a few seconds

---

## 7. Data & State Behavior

### Optimistic Updates
- When a user makes a change (e.g., changes status), the UI updates immediately before the server confirms
- If the server rejects the change, the UI rolls back and shows an error toast

### Offline Resilience
- Queue mutations when offline and replay when reconnected
- Show visual indicator when offline

### URL-Driven State
- Filters, sort, and view selections reflected in URL query parameters
- Enables sharing links that preserve the exact view state
- Browser back/forward navigates through view states

### Recent Items
- Track recently viewed tickets, projects, and milestones
- Surface in command palette for quick re-access

---

## Summary

This tool is a comprehensive, modern project management platform built for speed and keyboard-driven productivity. It combines the clean aesthetics of Linear with the feature depth needed for serious software teams — including sprint planning, milestone tracking, custom workflows, customer portals, GitHub integration, and real-time collaboration. The three-panel layout keeps everything accessible without context-switching, and the command palette plus keyboard shortcuts make power users extremely productive.
