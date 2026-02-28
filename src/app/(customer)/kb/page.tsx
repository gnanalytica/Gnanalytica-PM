'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';

const supabase = createClient();

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  published: boolean;
  created_at: string;
};

export default function KBPage() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ['kb-articles-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('id, title, slug, excerpt, published, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Article[];
    },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-content-primary mb-4">Knowledge Base</h1>

      {isLoading ? (
        <p className="text-sm text-content-muted">Loading...</p>
      ) : !articles || articles.length === 0 ? (
        <p className="text-sm text-content-muted text-center py-12">
          No articles published yet.
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/kb/${article.id}`}
              className="block border border-border-subtle rounded-md p-4 hover:bg-hover transition-colors"
            >
              <h2 className="text-[14px] font-medium text-content-primary mb-1">
                {article.title}
              </h2>
              {article.excerpt && (
                <p className="text-[12px] text-content-muted line-clamp-2">
                  {article.excerpt}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
