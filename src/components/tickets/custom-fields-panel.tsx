'use client';

import { useCustomFieldDefinitions, useCustomFieldValues, useUpsertCustomFieldValue } from '@/lib/hooks/use-custom-fields';
import type { CustomFieldDefinition } from '@/types';

function FieldInput({
  definition,
  value,
  onChange,
}: {
  definition: CustomFieldDefinition;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  switch (definition.field_type) {
    case 'checkbox':
      return (
        <input
          type="checkbox"
          checked={value === 'true'}
          onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
          className="rounded border-border-subtle text-accent w-3.5 h-3.5"
        />
      );
    case 'select':
      return (
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="border border-border-subtle rounded px-2 py-0.5 text-xs bg-surface-secondary text-content-primary"
        >
          <option value="">None</option>
          {definition.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="border border-border-subtle rounded px-2 py-0.5 text-xs bg-surface-secondary text-content-primary w-24"
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="border border-border-subtle rounded px-2 py-0.5 text-xs bg-surface-secondary text-content-primary"
        />
      );
    case 'url':
      return (
        <input
          type="url"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="https://..."
          className="border border-border-subtle rounded px-2 py-0.5 text-xs bg-surface-secondary text-content-primary w-full"
        />
      );
    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="border border-border-subtle rounded px-2 py-0.5 text-xs bg-surface-secondary text-content-primary w-full"
        />
      );
  }
}

export function CustomFieldsPanel({
  ticketId,
  projectId,
}: {
  ticketId: string;
  projectId: string;
}) {
  const { data: definitions } = useCustomFieldDefinitions(projectId);
  const { data: values } = useCustomFieldValues(ticketId);
  const upsertValue = useUpsertCustomFieldValue();

  if (!definitions || definitions.length === 0) return null;

  const valueMap = new Map(values?.map((v) => [v.field_id, v.value]) ?? []);

  return (
    <div className="space-y-1">
      <span className="text-[12px] font-medium uppercase tracking-wide text-content-muted">Custom Fields</span>
      {definitions.map((def) => (
        <div key={def.id} className="flex items-center justify-between py-0.5">
          <span className="text-[12px] text-content-muted w-24 flex-shrink-0">{def.name}</span>
          <div className="flex-1 flex justify-end">
            <FieldInput
              definition={def}
              value={valueMap.get(def.id) ?? null}
              onChange={(value) => {
                upsertValue.mutate({
                  ticket_id: ticketId,
                  field_id: def.id,
                  value,
                });
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
