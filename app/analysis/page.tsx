import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const revalidate = 3600;
export const metadata: Metadata = {
  title: 'Analysis | AmericasOilWatch',
  alternates: { canonical: 'https://americasoilwatch.com/analysis' },
};

interface ArticleMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author?: string;
}

function getArticles(): ArticleMeta[] {
  const dir = path.join(process.cwd(), 'content/analysis');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const slug = file.replace(/\.md$/, '');
      const { data } = matter(fs.readFileSync(path.join(dir, file), 'utf-8'));
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? '',
        excerpt: data.excerpt ?? '',
        author: data.author,
      };
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export default function AnalysisPage() {
  const p = path.join(process.cwd(), 'data', 'analysis.json');
  const analysis = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : null;
  const articles = getArticles();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Analysis</h1>
        <p className="mt-1 text-sm text-gray-400">
          Editorial pieces from the AmericasOilWatch team and an AI-generated daily snapshot from Claude, drawing on EIA petroleum data, WTI price, MARAD advisories, and CREA energy research.
        </p>
      </div>

      {articles.length > 0 && (
        <section aria-label="Editorial articles">
          <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">
            Editorial Articles
          </h2>
          <ul className="space-y-4">
            {articles.map((a) => (
              <li key={a.slug} className="rounded-lg border border-oil-800 bg-oil-900/30 px-5 py-4">
                <a href={`/analysis/${a.slug}`} className="block group">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                    {a.date && (
                      <time dateTime={a.date}>
                        {new Date(a.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    )}
                    {a.author && <><span>·</span><span>{a.author}</span></>}
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-white group-hover:text-oil-300 transition leading-snug">
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="mt-2 text-sm text-gray-400 leading-relaxed">{a.excerpt}</p>
                  )}
                  <p className="mt-2 text-xs text-oil-400 group-hover:underline">Read article →</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="AI market analysis">
        <h2 className="text-xs font-mono font-semibold tracking-widest text-gray-500 uppercase mb-4">
          AI Market Analysis · Daily Snapshot
        </h2>
      {analysis ? (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-oil-800/60">
            <p className="text-sm font-semibold text-white">{analysis.statusLine}</p>
            <p className="text-[10px] text-gray-600 mt-1">
              Generated {new Date(analysis.generatedAt).toLocaleString('en-US')} · {analysis.model}
            </p>
          </div>
          {analysis.keyPoints?.length > 0 && (
            <div className="px-5 py-4 border-b border-oil-800/60">
              <p className="text-[10px] font-mono font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Points</p>
              <ul className="space-y-2">
                {analysis.keyPoints.map((pt: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-oil-400 flex-shrink-0 mt-0.5">›</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="px-5 py-4 prose-article">
            {analysis.fullAnalysis.split('\n\n').map((para: string, i: number) => (
              <p key={i} className="text-sm text-gray-300 leading-relaxed mb-3">{para}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-oil-800 bg-oil-900/20 px-5 py-8 text-center">
          <p className="text-gray-500 text-sm">Analysis not yet generated.</p>
          <p className="text-gray-600 text-xs mt-1">Run: <code className="font-mono">npm run analyze</code></p>
        </div>
      )}
      </section>
    </div>
  );
}
