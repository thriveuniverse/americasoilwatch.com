import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const SENT_DIR = path.join(process.cwd(), 'newsletters', 'sent');

export interface Briefing {
  slug: string;
  subject: string;
  date: string;
  html: string;
  excerpt: string;
}

function fileToSlug(file: string): string {
  return file.replace(/\.md$/, '');
}

function extractDate(slug: string): string {
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

function firstParagraph(md: string): string {
  const lines = md.split('\n').map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (l.startsWith('#') || l.startsWith('---')) continue;
    return l.replace(/[*_`]/g, '').slice(0, 220);
  }
  return '';
}

export function getAllBriefings(): Briefing[] {
  if (!fs.existsSync(SENT_DIR)) return [];
  return fs.readdirSync(SENT_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => getBriefing(fileToSlug(f)))
    .filter((x): x is Briefing => x !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getBriefing(slug: string): Briefing | null {
  const p = path.join(SENT_DIR, `${slug}.md`);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf-8');
  const { data, content } = matter(raw);
  const html = marked.parse(content, { async: false }) as string;
  return {
    slug,
    subject: data.subject ?? `Weekly Briefing ${extractDate(slug)}`,
    date:    data.date ?? extractDate(slug),
    html,
    excerpt: firstParagraph(content),
  };
}
