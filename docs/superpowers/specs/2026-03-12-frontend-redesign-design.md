# Frontend Redesign Specification
**Date:** 2026-03-12
**Project:** Gnanalytica PM
**Scope:** Complete visual modernization + UX improvements for cross-functional planning tool

---

## Overview

Redesign Gnanalytica PM from dated Linear-inspired interface to ultra-modern, warm, startup-friendly PM tool with flexible multi-view architecture. Support three-panel list editing, expanded ticket focus, and customizable dashboards. Maintain existing three-panel desktop layout while adding new viewing modes and inline editing capabilities.

**Primary Goals:**
1. Modernize visual appearance (ultra-modern, bold typography, generous spacing)
2. Improve ticket visibility and editing workflows
3. Enable in-place editing in list views
4. Create better dashboards and global views
5. Replace plain color boxes with project emojis/icons

**Target Users:** 8-person cross-functional team (developers, AI, product, business, marketing/sales) using single internal PM tool for sprints, standups, GTM planning, HR, and admin work.

---

## Design Architecture: Three-View System

The core redesign introduces a flexible multi-view system while maintaining the familiar three-panel desktop layout. Users toggle between three primary modes based on their current task.

### Mode 1: List View (Default)
**Purpose:** Quick scanning, bulk editing, rapid task management
**Layout:** Sidebar + full-width list (no right detail panel)

- Taller list rows (44-48px) with generous vertical padding
- Project emoji/icon in leftmost column for instant visual scanning
- Inline editable fields: title, priority, status, assignee, due date
- Quick action buttons on hover (assign, due date, priority, expand)
- Keyboard-optimized: Tab between fields, Escape cancels, Enter saves
- Context-aware: Maintains separate list states for sprints, GTM, HR, dashboards
- Keyboard shortcut: `Cmd+1` (or `Ctrl+1` on Windows/Linux)

**Inline Editing Behavior:**
- Click any field to activate edit mode
- Status field: Opens compact dropdown (To Do, In Progress, Done, etc.)
- Assignee: Opens lightweight person picker
- Dates: Calendar picker or natural language input
- Visual feedback: Hover highlight, input border on active field, brief checkmark on save
- Undo capability: Unsaved changes auto-discard after 10 seconds or on Escape

### Mode 2: Expanded Ticket View
**Purpose:** Deep work on a single ticket, comprehensive property editing
**Layout:** Sidebar + ticket detail (takes ~70% of screen width)

- Large, readable ticket title and description
- Right sidebar showing:
  - Assignees with avatars
  - Due date with calendar
  - Priority indicator
  - Status (detailed dropdown)
  - Related tickets/dependencies
  - Custom fields (if applicable)
- Comments and activity timeline below main content
- Full WYSIWYG editor for ticket description
- Keyboard shortcut: `Cmd+2` (or `Ctrl+2` on Windows/Linux)
- Seamless transition from list: Click any ticket in list view to expand

### Mode 3: Dashboard View
**Purpose:** Overview, metrics, team status, planning
**Layout:** Full-width dashboard with sidebar navigation
**Keyboard shortcut:** `Cmd+3` (or `Ctrl+3` on Windows/Linux)

**Dashboard Components (Widget-Based):**
- **Tasks by Status:** Card showing breakdown (To Do, In Progress, Done, with counts)
- **Upcoming Deadlines:** List of tickets due in next 2 weeks
- **Team Workload:** Assignee workload chart (oversights, balanced, overload)
- **Sprint Velocity:** Historical velocity chart (for sprint teams)
- **Project Overview:** Cards for each project with task counts, status
- **Quick Add Task:** Floating button or card to create new task
- **My Tasks:** Personalized list of tasks assigned to current user
- **Global Filters:** Status, assignee, project, date range

**Customization:**
- Drag-and-drop to reorder widgets
- Resize widgets (small, medium, large)
- Hide/show widgets via settings
- Save custom dashboard layouts per user
- Smart defaults: Dashboard layout adapts to user role (PM sees planning, dev sees sprints)

**Global Views Dropdown:**
- All Tasks: Every task in system
- My Tasks: Assigned to current user
- By Project: Breakdown by each project
- By Assignee: Tasks grouped by person
- Overdue: Overdue tasks across system
- Due This Week: Tasks due in next 7 days
- Sprints: Current sprint view (if applicable)

---

## Visual Design System

### Color Palette

**Light Mode:**
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Off-white | #FAFBFC | Main page background |
| Surface Primary | White | #FFFFFF | Cards, panels |
| Surface Secondary | Warm light gray | #F5F3F0 | List rows (alternate), input backgrounds |
| Surface Tertiary | Soft warm gray | #EEE8E3 | Subtle backgrounds, disabled states |
| Text Primary | Dark charcoal | #1A1A1A | Headings, primary text |
| Text Secondary | Warm gray | #6B5B52 | Secondary text, descriptions |
| Text Muted | Light warm gray | #9B8F85 | Disabled text, hints |
| Border | Warm light border | #E8DED7 | Dividers, input borders |
| Accent | Warm coral | #FF6B35 | Primary CTA, highlights, active states |
| Accent Hover | Lighter coral | #FF8557 | Button hover states |
| Success | Green | #10B981 | Completed tasks, success states |
| Warning | Amber | #F59E0B | Overdue, warnings |
| Error | Red | #EF4444 | Errors, destructive actions |
| Info | Blue | #3B82F6 | Information, tips |

**Dark Mode:**
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Deep navy | #0F1419 | Main page background |
| Surface Primary | Charcoal | #1A1F2E | Cards, panels |
| Surface Secondary | Warm dark gray | #2A2520 | List rows (alternate), input backgrounds |
| Surface Tertiary | Deeper warm gray | #342F2A | Subtle backgrounds, disabled states |
| Text Primary | Off-white | #F5F3F0 | Headings, primary text |
| Text Secondary | Warm light gray | #B8AFA6 | Secondary text, descriptions |
| Text Muted | Muted warm gray | #8B7E77 | Disabled text, hints |
| Border | Warm dark border | #4A413A | Dividers, input borders |
| Accent | Warm coral | #FF8557 | Primary CTA, highlights, active states |
| Accent Hover | Lighter coral | #FFA76B | Button hover states |
| Success | Green | #10B981 | Completed tasks, success states |
| Warning | Amber | #F59E0B | Overdue, warnings |
| Error | Red | #EF4444 | Errors, destructive actions |
| Info | Blue | #60A5FA | Information, tips |

### Typography

**Font Family:** Inter or equivalent modern sans-serif

**Scale:**
- Heading 1: 32px, Bold, 1.2 line-height (page titles)
- Heading 2: 24px, Bold, 1.25 line-height (section titles)
- Heading 3: 18px, Semibold, 1.3 line-height (subsection titles)
- Body Large: 16px, Regular, 1.5 line-height (descriptions)
- Body Regular: 14px, Regular, 1.5 line-height (default text)
- Body Small: 13px, Regular, 1.4 line-height (secondary info)
- Label: 12px, Semibold, 1.3 line-height (form labels, badges)
- Caption: 11px, Regular, 1.3 line-height (hints, timestamps)

**Font Weights:**
- Regular: 400 (body text)
- Medium: 500 (accents, emphasis)
- Semibold: 600 (section titles, labels)
- Bold: 700 (headings, strong emphasis)

### Spacing & Layout

**Base Unit:** 8px (all spacing is multiple of 8)

- Extra Small: 4px (small gaps, tight spacing)
- Small: 8px (between inline elements)
- Medium: 12px (standard spacing)
- Large: 16px (between sections)
- Extra Large: 24px (major spacing, section breaks)
- XXL: 32px (page padding, major breaks)

**Padding:**
- Content areas: 24px horizontal, 20px vertical
- List rows: 12px vertical, 16px horizontal
- Cards: 20px padding (all sides)
- Input fields: 12px vertical, 16px horizontal

**Gap (between elements):**
- Inline elements: 8px
- Form controls: 12px
- List rows: 0px (flush)
- Dashboard widgets: 20px

### Border & Corners

**Border Radius:**
- Small: 8px (buttons, small inputs, badges)
- Medium: 12px (cards, larger containers)
- Large: 16px (panels, major containers)
- Pill: 9999px (circular buttons, full-width rounded)

**Border Width:**
- Thin: 1px (standard dividers, input borders)
- Thick: 2px (focus states, strong emphasis)

### Shadows

**Elevation System:**
- Elevation 0: No shadow (text, flat elements)
- Elevation 1: 0 1px 2px rgba(0,0,0,0.05) (subtle, hover states)
- Elevation 2: 0 4px 6px rgba(0,0,0,0.1) (cards, small panels)
- Elevation 3: 0 10px 15px rgba(0,0,0,0.15) (modals, larger panels)
- Elevation 4: 0 20px 25px rgba(0,0,0,0.2) (dropdowns, tooltips)

### Project Icons/Emojis

**Replace plain color dots with project-specific emojis:**
- Example: 🚀 (sprints, product launches)
- Example: 📊 (analytics, GTM planning)
- Example: 👥 (HR, hiring)
- Example: ⚙️ (admin, infrastructure)
- Example: 🎨 (design, creative)
- Example: 📱 (mobile)
- Example: 🔧 (engineering, dev)
- Example: 📝 (documentation)

**Display locations:**
- Sidebar project list: Emoji + project name
- List view leftmost column: Emoji only (larger, more prominent)
- Dashboard project cards: Emoji header
- Breadcrumbs: Emoji before project name

**Customization:** Allow users to assign custom emoji to projects via settings.

---

## Component Updates

### Updated Components

1. **List Row Component (Enhanced)**
   - Height: 48px (increased from current)
   - Padding: 12px vertical, 16px horizontal
   - Fields: [Emoji] [Title] [Priority] [Status] [Assignee] [Due Date] [Quick Actions]
   - Inline edit states: Click to activate, visual feedback on hover
   - Quick actions: Show on hover (assign, due date, priority, expand)
   - Keyboard support: Tab to navigate fields, Arrow keys for status

2. **Inline Edit Input (New)**
   - Appear within row, don't expand row
   - Borders and focus styling consistent with form inputs
   - Auto-focus when activated
   - Blur/Escape to cancel
   - Enter/click outside to save
   - Loading state: Spinner while saving

3. **Quick Action Buttons (New)**
   - Icon-only, no labels
   - Appear on row hover
   - Right-aligned for consistency
   - 24px × 24px icon size
   - Tooltip on hover (200ms delay)

4. **Dashboard Widget (New)**
   - Draggable header with move handle
   - Resize handle (bottom-right corner)
   - Close button (top-right)
   - Configurable dimensions (small: 1 col, medium: 2 col, large: 3+ col)
   - Loading skeleton during data fetch

5. **Ticket Detail Panel (Enhanced)**
   - Larger font sizes (Body Large for title, 32px Bold)
   - Generous padding (24px+)
   - Right sidebar for metadata (fixed width, ~280px)
   - Comments below main content with separate scroll
   - Full WYSIWYG editor for description

6. **Mode Toggle (New)**
   - Top bar: Three buttons (List, Ticket, Dashboard)
   - Icons + text labels
   - Active state: Accent color background
   - Keyboard shortcuts displayed in tooltip

7. **Global View Dropdown (Enhanced)**
   - Shows in top bar next to project selector
   - Searchable list of views
   - Icons for each view (list, person, calendar, etc.)
   - Currently selected view highlighted

### New Color Application

- **Primary CTA Buttons:** Accent coral background, white text, rounded 8px
- **Secondary Buttons:** Transparent background, accent border, accent text
- **Hover State:** Lift effect (translate-y -2px), shadow elevation increase
- **Active/Focus State:** Thick 2px border, accent color
- **Disabled State:** Muted background, muted text, no hover effects
- **Input Fields:** White/dark surface, thin border, focus: thick accent border
- **Links:** Accent color text, underline on hover
- **Status Indicators:** Use semantic colors (success/green, warning/amber, error/red)

---

## Interaction Design

### Keyboard-First Approach

- **Mode switching:** Cmd+1 (List), Cmd+2 (Ticket), Cmd+3 (Dashboard)
- **In-place edit:** Tab between fields in list, Enter to save, Escape to cancel
- **Assign task:** In list, press 'A' for quick assign picker
- **Set due date:** In list, press 'D' for date picker
- **Change status:** In list, press 'S' for status dropdown
- **Open ticket:** In list, press Enter to expand
- **Close ticket:** Escape key closes expanded view
- **Quick search:** Cmd+K opens global search (if implemented)

### Animation & Transitions

- **Mode transitions:** 300ms fade + slide (enter from right, exit to left)
- **Button hover:** 200ms color shift + subtle lift (translate-y -2px)
- **Inline edit enter:** 150ms expand/collapse animation
- **Widget drag:** Smooth drag feedback, ghost image at 0.5 opacity
- **Loading states:** 1s duration shimmer skeleton

### Error & Success Feedback

- **Save success:** Brief checkmark appears (500ms fade out)
- **Save error:** Inline error message (red text) with "Retry" button
- **Validation error:** Red border on input, error message below
- **Unsaved changes:** Visual indicator (dot) in title bar, warning on navigate away

---

## Implementation Strategy

### Phase 1: Foundations (Week 1)
- Update color tokens in `globals.css`
- Update typography scale
- Update spacing/padding throughout
- Add project emoji support to project model
- Implement mode toggle UI

### Phase 2: List View Enhancements (Week 2)
- Increase list row height to 48px
- Implement inline editing for key fields
- Add quick action buttons
- Add hover states and keyboard support
- Update list component styling

### Phase 3: Expanded Ticket View (Week 3)
- Redesign ticket detail panel (larger, more spacious)
- Add right sidebar for metadata
- Improve comments/activity section
- Update typography scale

### Phase 4: Dashboard & Global Views (Week 4)
- Build widget system
- Implement dashboard grid
- Create global view filters
- Add customization (drag, resize, hide)

### Phase 5: Polish & Testing (Week 5)
- Adjust spacing, alignment, shadows
- Test keyboard interactions
- Verify light/dark mode
- Performance optimization
- Cross-browser testing

---

## Success Criteria

✅ Visual appearance modernized (ultra-modern, bold typography, generous spacing)
✅ List rows support inline editing for title, priority, status, assignee, due date
✅ Users can toggle between List, Ticket, and Dashboard views via keyboard shortcuts
✅ Projects display with emojis/icons instead of plain color boxes
✅ Dashboard with customizable widgets and global view filters
✅ Light/dark mode toggle preserved and improved
✅ All interactions keyboard-optimized (Tab, Enter, Escape, arrow keys)
✅ Warm, startup-friendly color palette applied throughout
✅ Existing three-panel desktop layout maintained
✅ Mobile experience unaffected (overlay behavior preserved)

---

## Notes & Considerations

- **Backward Compatibility:** Existing data, permissions, and workflows remain unchanged; only UI is redesigned
- **Performance:** Dashboard widgets load data on-demand; implement pagination for large lists
- **Mobile:** Current mobile behavior (overlay detail panel) is preserved; new modes not applicable on mobile
- **Accessibility:** Maintain WCAG AA compliance; ensure all inline edits accessible via keyboard
- **Browser Support:** Modern browsers (Chrome, Safari, Firefox, Edge latest versions)
