import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const INSIGHTS_DIR = path.join(process.cwd(), 'content', 'insights');

export interface InsightFrontmatter {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  tags: string[];
}

export interface Insight extends InsightFrontmatter {
  slug: string;
  html: string;
  readingMinutes: number;
}

export function getAllInsights(): Insight[] {
  if (!fs.existsSync(INSIGHTS_DIR)) return [];
  return fs.readdirSync(INSIGHTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => getInsight(f.replace(/\.md$/, '')))
    .filter((x): x is Insight => x !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getInsight(slug: string): Insight | null {
  const p = path.join(INSIGHTS_DIR, `${slug}.md`);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf-8');
  const { data, content } = matter(raw);
  const html = marked.parse(content, { async: false }) as string;
  const words = content.split(/\s+/).length;
  return {
    slug,
    title:   data.title   ?? 'Untitled',
    excerpt: data.excerpt ?? '',
    date:    data.date    ?? new Date().toISOString().slice(0, 10),
    author:  data.author  ?? 'AmericasOilWatch Editorial',
    tags:    data.tags    ?? [],
    html,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}
