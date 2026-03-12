'use client';

import { SVGProps } from 'react';

interface QuickActionButtonsProps {
  ticketId: string;
  onAssignClick: () => void;
  onDueDateClick: () => void;
  onPriorityClick: () => void;
  onExpandClick: () => void;
  isVisible?: boolean;
}

// Icon components - simple SVG icons
const PersonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const FlagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M5.5 2v18m0 0l3.5-2 3.5 2 3.5-2 3.5 2V2l-3.5 2-3.5-2-3.5 2-3.5-2z" />
  </svg>
);

const ExpandIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M9 18l6-6m-6 0l-6-6m6 6h12V6" />
  </svg>
);

export function QuickActionButtons({
  ticketId,
  onAssignClick,
  onDueDateClick,
  onPriorityClick,
  onExpandClick,
  isVisible = true,
}: QuickActionButtonsProps) {
  const buttonClass =
    'w-8 h-8 rounded transition-colors duration-200 flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20';

  const iconClass = 'w-4 h-4';

  return (
    <div
      className={`flex items-center gap-1 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <button
        onClick={onAssignClick}
        aria-label="Assign"
        title="Assign"
        className={buttonClass}
      >
        <PersonIcon className={iconClass} />
      </button>
      <button
        onClick={onDueDateClick}
        aria-label="Due Date"
        title="Due Date"
        className={buttonClass}
      >
        <CalendarIcon className={iconClass} />
      </button>
      <button
        onClick={onPriorityClick}
        aria-label="Priority"
        title="Priority"
        className={buttonClass}
      >
        <FlagIcon className={iconClass} />
      </button>
      <button
        onClick={onExpandClick}
        aria-label="Expand"
        title="Expand"
        className={buttonClass}
      >
        <ExpandIcon className={iconClass} />
      </button>
    </div>
  );
}
