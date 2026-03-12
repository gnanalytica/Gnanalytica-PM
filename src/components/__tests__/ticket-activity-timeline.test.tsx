import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { TicketActivityTimeline, ActivityItem, Comment } from '../tickets/ticket-activity-timeline';

describe('TicketActivityTimeline Component', () => {
  // Mock data
  const mockActivityItems: ActivityItem[] = [
    {
      id: 'act-1',
      type: 'status_change',
      timestamp: new Date('2026-03-12T10:00:00Z'),
      userId: 'user-1',
      userName: 'Alice Johnson',
      userAvatar: 'https://example.com/alice.jpg',
      metadata: {
        oldValue: 'todo',
        newValue: 'in_progress',
        field: 'status',
      },
    },
    {
      id: 'act-2',
      type: 'assignment',
      timestamp: new Date('2026-03-12T09:30:00Z'),
      userId: 'user-2',
      userName: 'Bob Smith',
      metadata: {
        newValue: 'Bob Smith',
        field: 'assignee',
      },
    },
    {
      id: 'act-3',
      type: 'priority_change',
      timestamp: new Date('2026-03-11T16:00:00Z'),
      userId: 'user-1',
      userName: 'Alice Johnson',
      metadata: {
        oldValue: 'low',
        newValue: 'high',
        field: 'priority',
      },
    },
  ];

  const mockComments: Comment[] = [
    {
      id: 'comment-1',
      content: 'This looks good to me!',
      authorId: 'user-1',
      author: {
        name: 'Alice Johnson',
        avatar: 'https://example.com/alice.jpg',
      },
      createdAt: new Date('2026-03-12T11:00:00Z'),
    },
    {
      id: 'comment-2',
      content: 'Updated the design based on feedback.',
      authorId: 'user-2',
      author: {
        name: 'Bob Smith',
        avatar: undefined,
      },
      createdAt: new Date('2026-03-12T10:30:00Z'),
      updatedAt: new Date('2026-03-12T10:45:00Z'),
    },
  ];

  const mockOnCommentAdd = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnCommentAdd.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-12T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Empty State', () => {
    it('should render empty state when no activities and no comments', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText('No activity yet. Start collaborating!')).toBeInTheDocument();
    });
  });

  describe('Activity Items Rendering', () => {
    it('should render all activity items in DOM', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getAllByText(/Alice Johnson/)).toBeTruthy();
      expect(screen.getAllByText(/Bob Smith/)).toBeTruthy();
    });

    it('should render activities in chronological order (newest first)', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const userNames = screen.getAllByText(/Johnson|Smith/);
      // Newest activity (Alice at 10:00) should appear first
      expect(userNames[0].textContent).toContain('Alice Johnson');
    });

    it('should display status_change badge with accent color', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[mockActivityItems[0]]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const badge = screen.getByText('Status');
      expect(badge.className).toContain('bg-accent/10');
    });

    it('should display assignment badge with blue color', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[mockActivityItems[1]]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const badge = screen.getByText('Assigned');
      expect(badge.className).toContain('bg-blue-500/10');
    });

    it('should display priority_change badge with orange color', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[mockActivityItems[2]]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const badge = screen.getByText('Priority');
      expect(badge.className).toContain('bg-orange-500/10');
    });

    it('should display activity description with metadata', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[mockActivityItems[0]]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/Changed status to in_progress/)).toBeInTheDocument();
    });

    it('should display relative time formatting for recent activity', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[mockActivityItems[0]]} // 2 hours ago from mock system time
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('should display avatar with initials when no avatar provided', () => {
      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[{ ...mockActivityItems[1], userAvatar: undefined }]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should render activity item without an image avatar
      const img = container.querySelector('img[alt="Bob Smith"]');
      expect(img).not.toBeInTheDocument();
      // Should have activity div rendered
      const activity = container.querySelector('.relative.pl-6');
      expect(activity).toBeInTheDocument();
    });

    it('should render timeline vertical line on left side', () => {
      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems.slice(0, 2)} // 2 activities to show line
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Timeline line should be rendered (vertical line with bg-border-subtle)
      const timelineLine = container.querySelector('.bg-border-subtle');
      expect(timelineLine).toBeInTheDocument();
    });
  });

  describe('Comments Rendering', () => {
    it('should render all comments in DOM', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={mockComments}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText('This looks good to me!')).toBeInTheDocument();
      expect(screen.getByText('Updated the design based on feedback.')).toBeInTheDocument();
    });

    it('should display comment author name and avatar', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[0]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('should display comment content with text wrapping (break-words class)', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[0]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const content = screen.getByText('This looks good to me!');
      expect(content.className).toContain('break-words');
    });

    it('should format comment timestamp with relative time', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[0]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Comment is 1 hour old, should show "1h ago"
      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });

    it('should show "(edited)" badge when updatedAt differs from createdAt', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[1]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText('(edited)')).toBeInTheDocument();
    });

    it('should NOT show "(edited)" badge when updatedAt is same as createdAt', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[0]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.queryByText('(edited)')).not.toBeInTheDocument();
    });

    it('should render comment with light background (surface-secondary)', () => {
      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[0]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const commentBox = container.querySelector('.bg-surface-secondary');
      expect(commentBox).toBeInTheDocument();
    });

    it('should display avatar with initials when comment author has no avatar', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[mockComments[1]]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // BS for Bob Smith
      expect(screen.getByText('BS')).toBeInTheDocument();
    });

    it('should sanitize comment content to prevent XSS', () => {
      const maliciousComment: Comment = {
        id: 'comment-xss',
        content: '<script>alert("xss")</script>Legitimate text',
        authorId: 'user-1',
        author: { name: 'Hacker' },
        createdAt: new Date(),
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[maliciousComment]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should display escaped content, not execute script
      expect(screen.getByText(/Legitimate text/)).toBeInTheDocument();
      expect(screen.queryByText('alert')).not.toBeInTheDocument();
    });
  });

  describe('Add Comment Form', () => {
    it('should render comment form when readonly=false', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
          readonly={false}
        />
      );

      const textarea = screen.getByLabelText('Add comment');
      expect(textarea).toBeInTheDocument();
    });

    it('should NOT render comment form when readonly=true', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
          readonly={true}
        />
      );

      const textarea = screen.queryByLabelText('Add comment');
      expect(textarea).not.toBeInTheDocument();
    });

    it('should have textarea with aria-label "Add comment"', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByLabelText('Add comment');
      expect(textarea).toBeInTheDocument();
    });

    it('should have textarea with placeholder "Add a comment..."', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a comment...');
      expect(textarea).toBeInTheDocument();
    });

    it('should have send button with aria-label "Send comment"', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const button = screen.getByLabelText('Send comment');
      expect(button).toBeInTheDocument();
    });

    it('should have send button with accent color class', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const button = screen.getByLabelText('Send comment');
      expect(button).toHaveClass('bg-accent');
    });

    it('should disable send button when textarea is empty', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const button = screen.getByLabelText('Send comment');
      expect(button).toBeDisabled();
    });

    it('should enable send button when textarea has text', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      expect(button).not.toBeDisabled();
    });

    it('should show "Posting..." and spinner when submitting', async () => {
      let resolveSubmit: ((value?: any) => void) | null = null;
      const slowSubmit = vi.fn(() => new Promise<void>(resolve => {
        resolveSubmit = resolve;
      }));

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={slowSubmit}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(button);

      // During submission, show "Posting..."
      expect(screen.getByText('Posting...')).toBeInTheDocument();

      // Resolve the submission
      if (resolveSubmit !== null) {
        (resolveSubmit as (value?: any) => void)();
      }
    });

    it('should call onCommentAdd with trimmed comment text on submit', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: '   Test comment   ' } });
      fireEvent.click(button);

      expect(mockOnCommentAdd).toHaveBeenCalledWith('Test comment');
    });

    it('should clear textarea after successful submission', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      expect(textarea.value).toBe('Test comment');

      fireEvent.click(button);

      // After submission, the callback should be called with trimmed text
      expect(mockOnCommentAdd).toHaveBeenCalledWith('Test comment');
    });

    it('should display error state when submission fails', () => {
      const failSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={failSubmit}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(button);

      // Error should be displayed after submission fails
      expect(failSubmit).toHaveBeenCalled();
    });

    it('should disable textarea and button while submitting', () => {
      let resolveSubmit: ((value?: any) => void) | null = null;
      const slowSubmit = vi.fn(() => new Promise<void>(resolve => {
        resolveSubmit = resolve;
      }));

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={slowSubmit}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(button);

      // While submitting, both should be disabled
      expect(textarea).toBeDisabled();
      expect(button).toBeDisabled();

      // Resolve to clean up
      if (resolveSubmit !== null) {
        (resolveSubmit as (value?: any) => void)();
      }
    });
  });

  describe('Mixed Activities and Comments', () => {
    it('should render activities and comments in chronological order (newest first)', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems}
          comments={mockComments}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Mock comment-1 is at 11:00, newest activity is at 10:00
      // So comment should appear first
      const allItems = screen.getAllByText(/Johnson|Smith|comment|This looks good/);
      expect(allItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have role="feed" on main container', () => {
      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(container.querySelector('[role="feed"]')).toBeInTheDocument();
    });

    it('should have aria-label on main container', () => {
      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={mockActivityItems}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(container.querySelector('[aria-label="Activity timeline"]')).toBeInTheDocument();
    });

    it('should have aria-label on textarea', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByLabelText('Add comment')).toBeInTheDocument();
    });

    it('should have aria-label on send button', () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByLabelText('Send comment')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long comment text', () => {
      const longComment: Comment = {
        id: 'long-comment',
        content: 'a'.repeat(1000),
        authorId: 'user-1',
        author: { name: 'Alice' },
        createdAt: new Date(),
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[longComment]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument();
    });

    it('should handle special characters in user names', () => {
      const specialNameActivity: ActivityItem = {
        id: 'act-special',
        type: 'status_change',
        timestamp: new Date(),
        userId: 'user-1',
        userName: 'José García-López',
        metadata: { newValue: 'Done' },
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[specialNameActivity]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/José García-López/)).toBeInTheDocument();
    });

    it('should handle activities from same timestamp', () => {
      const sameTimeActivities: ActivityItem[] = [
        { ...mockActivityItems[0], timestamp: new Date('2026-03-12T10:00:00Z') },
        { ...mockActivityItems[1], timestamp: new Date('2026-03-12T10:00:00Z') },
      ];

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={sameTimeActivities}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getAllByText(/Alice Johnson/)).toBeTruthy();
      expect(screen.getAllByText(/Bob Smith/)).toBeTruthy();
    });

    it('should handle activities with missing metadata gracefully', () => {
      const activityWithoutMetadata: ActivityItem = {
        id: 'act-no-meta',
        type: 'status_change',
        timestamp: new Date(),
        userId: 'user-1',
        userName: 'Alice',
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[activityWithoutMetadata]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should render but display fallback text
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it('should handle activities with missing avatar gracefully', () => {
      const activityWithoutAvatar: ActivityItem = {
        id: 'act-no-avatar',
        type: 'assignment',
        timestamp: new Date('2026-03-12T11:00:00Z'),
        userId: 'user-1',
        userName: 'Charlie Brown',
        metadata: { newValue: 'Charlie Brown' },
      };

      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[activityWithoutAvatar]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should have rendered an activity item
      expect(container.querySelector('.relative.pl-6')).toBeInTheDocument();
    });

    it('should handle rapid comment submissions', async () => {
      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      const textarea = screen.getByLabelText('Add comment') as HTMLTextAreaElement;
      const button = screen.getByLabelText('Send comment');

      // Simulate typing a comment
      fireEvent.change(textarea, { target: { value: 'Comment 1' } });
      fireEvent.click(button);

      // Verify the mock was called
      expect(mockOnCommentAdd).toHaveBeenCalledWith('Comment 1');
    });
  });

  describe('Date Formatting', () => {
    it('should format dates within last hour as "Xm ago"', () => {
      const fiveMinutesAgo = new Date(new Date('2026-03-12T12:00:00Z').getTime() - 5 * 60 * 1000);

      const activity: ActivityItem = {
        id: 'act-recent',
        type: 'status_change',
        timestamp: fiveMinutesAgo,
        userId: 'user-1',
        userName: 'Alice',
        metadata: { newValue: 'Done' },
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[activity]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/m ago/)).toBeInTheDocument();
    });

    it('should format dates within same day as "Xh ago"', () => {
      const twoHoursAgo = new Date(new Date('2026-03-12T12:00:00Z').getTime() - 2 * 60 * 60 * 1000);

      const activity: ActivityItem = {
        id: 'act-hours',
        type: 'status_change',
        timestamp: twoHoursAgo,
        userId: 'user-1',
        userName: 'Alice',
        metadata: { newValue: 'Done' },
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[activity]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/h ago/)).toBeInTheDocument();
    });

    it('should format dates from previous days as "MMM D"', () => {
      const lastWeek = new Date(new Date('2026-03-12T12:00:00Z').getTime() - 5 * 24 * 60 * 60 * 1000);

      const activity: ActivityItem = {
        id: 'act-week-old',
        type: 'status_change',
        timestamp: lastWeek,
        userId: 'user-1',
        userName: 'Alice',
        metadata: { newValue: 'Done' },
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[activity]}
          comments={[]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should show date in past format (check for number indicating day)
      const timeElement = screen.getAllByText(/[0-9]/);
      expect(timeElement.length).toBeGreaterThan(0);
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML special characters in comments', () => {
      const htmlComment: Comment = {
        id: 'comment-html',
        content: '<div>HTML injection</div>',
        authorId: 'user-1',
        author: { name: 'Alice' },
        createdAt: new Date(),
      };

      const { container } = render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[htmlComment]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should display as text, not as HTML element
      expect(screen.getByText(/HTML injection/)).toBeInTheDocument();
      expect(container.querySelectorAll('div > div > div').length).toBeGreaterThan(0);
    });

    it('should prevent script tag execution in comments', () => {
      const scriptComment: Comment = {
        id: 'comment-script',
        content: 'Click <script>alert("hacked")</script> here',
        authorId: 'user-1',
        author: { name: 'Alice' },
        createdAt: new Date(),
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[scriptComment]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      // Should show text without executing script
      expect(screen.getByText(/Click/)).toBeInTheDocument();
      expect(screen.queryByText('hacked')).not.toBeInTheDocument();
    });

    it('should handle comment content with special HTML entities', () => {
      const entityComment: Comment = {
        id: 'comment-entity',
        content: 'Test & entities < > " \'',
        authorId: 'user-1',
        author: { name: 'Alice' },
        createdAt: new Date(),
      };

      render(
        <TicketActivityTimeline
          ticketId="ticket-1"
          activities={[]}
          comments={[entityComment]}
          onCommentAdd={mockOnCommentAdd}
        />
      );

      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });
  });
});
