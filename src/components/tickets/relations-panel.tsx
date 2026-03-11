"use client";

import { useState } from "react";
import {
  useTicketRelations,
  useCreateRelation,
  useDeleteRelation,
} from "@/lib/hooks/use-relations";
import { useProjectTickets } from "@/lib/hooks/use-tickets";
import type { RelationType } from "@/types";

const RELATION_LABELS: Record<RelationType, string> = {
  blocks: "Blocks",
  blocked_by: "Blocked by",
  related_to: "Related to",
  duplicate_of: "Duplicate of",
};

export function RelationsPanel({
  ticketId,
  projectId,
  onTicketClick,
}: {
  ticketId: string;
  projectId: string;
  onTicketClick?: (ticketId: string) => void;
}) {
  const { data: relations } = useTicketRelations(ticketId);
  const createRelation = useCreateRelation();
  const deleteRelation = useDeleteRelation();
  const allTickets = useProjectTickets(projectId);

  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<RelationType>("related_to");

  const filteredTickets = allTickets
    .filter((t) => t.id !== ticketId)
    .filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.slice(0, 6).includes(searchTerm.toLowerCase()),
    )
    .slice(0, 5);

  const handleAddRelation = async (targetId: string) => {
    await createRelation.mutateAsync({
      source_ticket_id: ticketId,
      target_ticket_id: targetId,
      relation_type: selectedType,
    });
    setShowAdd(false);
    setSearchTerm("");
  };

  // Group relations by type
  const grouped = (relations ?? []).reduce(
    (acc, r) => {
      const type = r.relation_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(r);
      return acc;
    },
    {} as Record<string, typeof relations>,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-content-muted">
          Relations
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-[11px] text-content-muted hover:text-content-secondary active:scale-[0.96] transition-all duration-150"
        >
          + Add
        </button>
      </div>

      {/* Grouped relations */}
      {Object.entries(grouped).map(([type, rels]) => (
        <div key={type} className="space-y-0.5">
          <span className="text-[10px] font-medium uppercase text-content-muted">
            {RELATION_LABELS[type as RelationType] ?? type}
          </span>
          {rels?.map((r) => {
            const isSource = r.source_ticket_id === ticketId;
            const linkedTicket = isSource ? r.target_ticket : r.source_ticket;
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 py-0.5 px-1 rounded hover:bg-hover transition-colors group"
              >
                <button
                  onClick={() =>
                    linkedTicket && onTicketClick?.(linkedTicket.id)
                  }
                  className="text-[12px] text-content-primary hover:text-accent truncate flex-1 text-left active:scale-[0.96] transition-all duration-150"
                >
                  {linkedTicket?.title ?? "Unknown ticket"}
                </button>
                <button
                  onClick={() => deleteRelation.mutate({ id: r.id, ticketId })}
                  className="text-content-muted hover:text-red-400 opacity-0 group-hover:opacity-100 active:scale-[0.96] transition-all duration-150 text-[10px]"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {(relations ?? []).length === 0 && !showAdd && (
        <p className="text-[11px] text-content-muted">No relations</p>
      )}

      {/* Add relation form */}
      {showAdd && (
        <div className="space-y-1.5 border border-border-subtle rounded p-2 animate-dropdown-in">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as RelationType)}
            className="w-full border border-border-subtle rounded px-2 py-1 text-xs bg-surface-secondary text-content-primary"
          >
            {Object.entries(RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="w-full border border-border-subtle rounded px-2 py-1 text-xs bg-surface-secondary text-content-primary"
            autoFocus
          />
          {searchTerm && (
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {filteredTickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleAddRelation(t.id)}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-hover rounded active:scale-[0.96] transition-all duration-150 truncate text-content-secondary"
                >
                  <span className="text-content-muted font-mono mr-1">
                    {t.id.slice(0, 6)}
                  </span>
                  {t.title}
                </button>
              ))}
              {filteredTickets.length === 0 && (
                <p className="text-[11px] text-content-muted px-2 py-1">
                  No matching tickets
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
