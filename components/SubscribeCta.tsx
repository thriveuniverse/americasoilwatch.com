interface Props {
  variant?: 'full' | 'compact';
  headline?: string;
  subtitle?: string;
}

export default function SubscribeCta({
  variant = 'full',
  headline = 'Weekly Americas Energy Briefing',
  subtitle = 'WTI price moves, US stock changes, producer developments, and supply route alerts — every week. Free.',
}: Props) {
  const compact = variant === 'compact';
  return (
    <div
      id={compact ? undefined : 'briefing'}
      className={`rounded-lg border border-oil-700 bg-oil-900/40 ${compact ? 'px-5 py-4' : 'px-6 py-5'}`}
    >
      <h2 className={`${compact ? 'text-sm' : 'text-sm'} font-semibold text-white mb-1`}>{headline}</h2>
      <p className={`${compact ? 'text-xs' : 'text-xs'} text-gray-400 mb-3`}>{subtitle}</p>
      <form action="/api/subscribe" method="POST" className="flex gap-2 max-w-sm">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          className="flex-1 bg-oil-900 border border-oil-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-oil-500"
        />
        <button
          type="submit"
          className="bg-oil-600 hover:bg-oil-500 text-white text-sm px-4 py-1.5 rounded transition font-medium"
        >
          Subscribe
        </button>
      </form>
      <p className="mt-2 text-[10px] text-gray-600">
        See <a href="/briefings" className="text-oil-400 hover:underline">past briefings</a> · Unsubscribe anytime
      </p>
    </div>
  );
}
