'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

const supabase = createClient();

export default function KBArticlePage() {
  const params = useParams<{ articleId: string }>();
  const articleId = typeof params.articleId === 'string' ? params.articleId : '';

  const { data: article, isLoading } = useQuery({
    queryKey: ['kb-article', articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kb_articles')
        .select('*')
        .eq('id', articleId)
        .eq('published', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  if (isLoading) {
    return <p className="text-sm text-content-muted">Loading...</p>;
  }

  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-content-muted mb-2">Article not found.</p>
        <Link href="/kb" className="text-sm text-accent hover:underline">
          Back to Knowledge Base
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/kb" className="text-[12px] text-content-muted hover:text-content-secondary mb-4 block">
        &larr; Back to Knowledge Base
      </Link>

      <article className="prose prose-sm max-w-none">
        <h1 className="text-xl font-semibold text-content-primary mb-2">
          {article.title}
        </h1>
        <p className="text-[11px] text-content-muted mb-6">
          Last updated: {new Date(article.updated_at ?? article.created_at).toLocaleDateString()}
        </p>
        <div
          className="text-[13px] text-content-secondary leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: article.content ?? '' }}
        />
      </article>
    </div>
  );
}
