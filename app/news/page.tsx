import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'News | AmericasOilWatch' };
export default function NewsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <a href="/" className="text-xs text-oil-400 hover:underline">← Back to dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-white">Americas Energy News</h1>
        <p className="mt-1 text-sm text-gray-400">News feed coming soon. See the <a href="/supply" className="text-oil-400 hover:underline">Supply Routes</a> page for MARAD advisories and CREA research.</p>
      </div>
    </div>
  );
}
