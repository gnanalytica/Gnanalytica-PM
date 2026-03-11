"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

type Integration = {
  id: string;
  type: "github" | "slack" | "discord";
  config: Record<string, string>;
  enabled: boolean;
};

function useIntegrations(projectId: string) {
  return useQuery({
    queryKey: ["integrations", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("github_integrations")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return (data ?? []) as Integration[];
    },
  });
}

function useWebhooks(projectId: string) {
  return useQuery({
    queryKey: ["webhooks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhook: {
      project_id: string;
      url: string;
      events: string[];
      secret?: string;
    }) => {
      const { data, error } = await supabase
        .from("webhooks")
        .insert(webhook)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["webhooks", vars.project_id],
      });
    },
  });
}

function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId,
    }: {
      id: string;
      projectId: string;
    }) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSettled: (_d, _e, vars) => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", vars.projectId] });
    },
  });
}

const EVENT_OPTIONS = [
  "ticket.created",
  "ticket.updated",
  "ticket.deleted",
  "comment.created",
  "cycle.completed",
];

export default function IntegrationsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId =
    typeof params.projectId === "string" ? params.projectId : "";

  const { data: integrations } = useIntegrations(projectId);
  const { data: webhooks } = useWebhooks(projectId);
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    "ticket.created",
    "ticket.updated",
  ]);
  const [webhookSecret, setWebhookSecret] = useState("");

  const handleCreateWebhook = () => {
    if (!webhookUrl.trim()) return;
    createWebhook.mutate(
      {
        project_id: projectId,
        url: webhookUrl.trim(),
        events: webhookEvents,
        secret: webhookSecret.trim() || undefined,
      },
      {
        onSuccess: () => {
          setWebhookUrl("");
          setWebhookSecret("");
          setShowWebhookForm(false);
        },
      },
    );
  };

  const toggleEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="max-w-2xl px-6 py-4 space-y-6">
      <h1 className="text-lg font-semibold text-content-primary">
        Integrations
      </h1>

      {/* GitHub section */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-content-primary">GitHub</h2>
        <p className="text-[12px] text-content-muted">
          Connect your GitHub repository to link pull requests and
          auto-transition tickets.
        </p>
        {integrations && integrations.length > 0 ? (
          <div className="space-y-1">
            {integrations.map((int) => (
              <div
                key={int.id}
                className="flex items-center justify-between border border-border-subtle rounded-md p-2"
              >
                <span className="text-[12px] text-content-primary">
                  {int.config?.repo ?? int.id}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${int.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {int.enabled ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-border-subtle rounded-md p-4 text-center">
            <p className="text-[12px] text-content-muted mb-2">
              No GitHub integration configured.
            </p>
            <p className="text-[11px] text-content-muted">
              Set up the GitHub webhook URL in your repo settings:
            </p>
            <code className="text-[11px] bg-surface-secondary px-2 py-1 rounded mt-1 block">
              {typeof window !== "undefined" ? window.location.origin : ""}
              /api/github-webhook
            </code>
          </div>
        )}
      </section>

      {/* Webhooks section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-content-primary">Webhooks</h2>
          <button
            onClick={() => setShowWebhookForm(!showWebhookForm)}
            className="px-2.5 py-1 text-[11px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
          >
            Add Webhook
          </button>
        </div>

        {showWebhookForm && (
          <div className="border border-border-subtle rounded-md p-3 space-y-2">
            <div>
              <label className="text-[11px] text-content-muted block mb-0.5">
                URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                className="w-full border border-border-subtle rounded px-2.5 py-1.5 text-[12px] bg-surface-secondary text-content-primary"
              />
            </div>
            <div>
              <label className="text-[11px] text-content-muted block mb-0.5">
                Events
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_OPTIONS.map((event) => (
                  <label
                    key={event}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded w-3 h-3 text-accent"
                    />
                    <span className="text-[11px] text-content-secondary">
                      {event}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] text-content-muted block mb-0.5">
                Secret (optional)
              </label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Signing secret..."
                className="w-full border border-border-subtle rounded px-2.5 py-1.5 text-[12px] bg-surface-secondary text-content-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateWebhook}
                disabled={!webhookUrl.trim() || createWebhook.isPending}
                className="px-3 py-1.5 text-[11px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                {createWebhook.isPending ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowWebhookForm(false)}
                className="px-3 py-1.5 text-[11px] text-content-muted hover:text-content-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {webhooks && webhooks.length > 0 ? (
          <div className="space-y-1">
            {webhooks.map(
              (wh: {
                id: string;
                url: string;
                events: string[];
                is_active: boolean;
              }) => (
                <div
                  key={wh.id}
                  className="flex items-center justify-between border border-border-subtle rounded-md p-2"
                >
                  <div>
                    <span className="text-[12px] text-content-primary block">
                      {wh.url}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      {wh.events?.join(", ")}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      deleteWebhook.mutate({ id: wh.id, projectId })
                    }
                    className="text-[11px] text-content-muted hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ),
            )}
          </div>
        ) : (
          !showWebhookForm && (
            <p className="text-[12px] text-content-muted">
              No webhooks configured.
            </p>
          )
        )}
      </section>
    </div>
  );
}
