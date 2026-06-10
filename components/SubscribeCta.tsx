interface Props {
  variant?: 'full' | 'compact';
  prominent?: boolean;
  headline?: string;
  subtitle?: string;
}

export default function SubscribeCta({
  variant = 'full',
  prominent = false,
  headline = 'Weekly Americas Energy Briefing',
  subtitle = 'WTI price moves, US stock changes, producer developments, and supply route alerts — every week. Free.',
}: Props) {
  const compact = variant === 'compact';
  return (
    <div
      id={compact ? undefined : 'briefing'}
      className={
        prominent
          ? 'rounded-lg border-2 border-oil-500 bg-gradient-to-br from-oil-800/70 to-oil-900/40 px-6 py-5 shadow-lg shadow-oil-950/40'
          : `rounded-lg border border-oil-700 bg-oil-900/40 ${compact ? 'px-5 py-4' : 'px-6 py-5'}`
      }
    >
      {prominent && (
        <div className="text-[11px] font-mono font-semibold tracking-[0.22em] text-oil-400 uppercase mb-1.5">
          📬 Free weekly email
        </div>
      )}
      <h2 className={`${prominent ? 'text-lg' : 'text-sm'} font-bold text-white mb-1`}>{headline}</h2>
      <p className={`${prominent ? 'text-sm' : 'text-xs'} text-gray-400 mb-3`}>{subtitle}</p>
      <form action="/api/subscribe" method="POST" className={`flex gap-2 ${prominent ? 'max-w-md' : 'max-w-sm'}`}>
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className={`flex-1 bg-oil-900 border border-oil-700 rounded text-white placeholder-gray-600 focus:outline-none focus:border-oil-500 ${prominent ? 'px-3 py-2 text-sm' : 'px-3 py-1.5 text-sm'}`}
        />
        <button
          type="submit"
          className={`bg-oil-600 hover:bg-oil-500 text-white rounded transition font-medium ${prominent ? 'px-5 py-2 text-sm' : 'px-4 py-1.5 text-sm'}`}
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
