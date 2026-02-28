'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

type KBArticle = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

function useKBArticles(projectId: string) {
  return useQuery({
    queryKey: ['kb-articles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as KBArticle[];
    },
    enabled: !!projectId,
  });
}

export default function KBAdminPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const queryClient = useQueryClient();

  const { data: articles } = useKBArticles(projectId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const createArticle = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { error } = await supabase.from('kb_articles').insert({
        project_id: projectId,
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: content.trim().slice(0, 200),
        published: false,
        author_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setContent('');
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['kb-articles', projectId] });
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<KBArticle> }) => {
      const { error } = await supabase
        .from('kb_articles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['kb-articles', projectId] });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('kb_articles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kb-articles', projectId] });
    },
  });

  return (
    <div className="max-w-3xl px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-content-primary">Knowledge Base</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-3 py-1.5 text-[12px] bg-accent text-white rounded hover:opacity-90 transition-opacity"
        >
          New Article
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-border-subtle rounded-md p-4 mb-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Article content (supports HTML)..."
            rows={10}
            className="w-full border border-border-subtle rounded px-3 py-2 text-[13px] bg-surface-secondary text-content-primary resize-none font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={() => createArticle.mutate()}
              disabled={!title.trim() || createArticle.isPending}
              className="px-3 py-1.5 text-[12px] bg-accent text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              {createArticle.isPending ? 'Creating...' : 'Create Draft'}
            </button>
            <button
              onClick={() => { setShowCreate(false); setTitle(''); setContent(''); }}
              className="px-3 py-1.5 text-[12px] text-content-muted hover:text-content-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Article list */}
      <div className="space-y-2">
        {articles?.map((article) => (
          <div key={article.id} className="border border-border-subtle rounded-md p-3">
            {editingId === article.id ? (
              <div className="space-y-2">
                <input
                  type="text"
                  defaultValue={article.title}
                  onBlur={(e) => updateArticle.mutate({ id: article.id, updates: { title: e.target.value } })}
                  className="w-full border border-border-subtle rounded px-2 py-1 text-[13px] bg-surface-secondary text-content-primary"
                />
                <textarea
                  defaultValue={article.content}
                  onBlur={(e) => updateArticle.mutate({ id: article.id, updates: { content: e.target.value } })}
                  rows={6}
                  className="w-full border border-border-subtle rounded px-2 py-1 text-[13px] bg-surface-secondary text-content-primary resize-none font-mono"
                />
                <button
                  onClick={() => setEditingId(null)}
                  className="text-[11px] text-content-muted hover:text-content-secondary"
                >
                  Done editing
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-medium text-content-primary">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${article.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {article.published ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      {new Date(article.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(article.id)}
                    className="text-[11px] text-content-muted hover:text-content-secondary px-2 py-0.5"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => updateArticle.mutate({ id: article.id, updates: { published: !article.published } })}
                    className="text-[11px] text-content-muted hover:text-accent px-2 py-0.5"
                  >
                    {article.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    onClick={() => deleteArticle.mutate(article.id)}
                    className="text-[11px] text-content-muted hover:text-red-400 px-2 py-0.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {(!articles || articles.length === 0) && !showCreate && (
          <p className="text-sm text-content-muted text-center py-6">No articles yet.</p>
        )}
      </div>
    </div>
  );
}
