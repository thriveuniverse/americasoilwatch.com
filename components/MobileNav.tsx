'use client';

import { useState } from 'react';

const LINKS = [
  { href: '/',             label: 'Dashboard' },
  { href: '/supply',       label: 'Supply Routes' },
  { href: '/prices',       label: 'Prices' },
  { href: '/analysis',     label: 'Analysis' },
  { href: '/news',         label: 'News' },
  { href: '/methodology',  label: 'Methodology' },
  { href: '/about',        label: 'About' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 text-gray-400 hover:text-white transition"
        aria-label="Toggle menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 bg-oil-950 border-b border-oil-800 z-50 py-2">
          {LINKS.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-oil-900 transition"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
