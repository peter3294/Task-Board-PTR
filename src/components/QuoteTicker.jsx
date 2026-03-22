// ─────────────────────────────────────────────────────────────────────────────
// QuoteTicker — scrolling motivational quote strip
// To add / edit quotes, update the QUOTES array below.
// ─────────────────────────────────────────────────────────────────────────────

const QUOTES = [
  {
    text: 'The Pareto Principle: 20% of your efforts drive 80% of your results — focus relentlessly on what moves the needle.',
    attribution: 'Pareto Principle',
  },
  {
    text: 'Worry is not the same as preparation.',
    attribution: 'Ping Yeh, StemoniX',
  },
  {
    text: 'The test of a first-rate intelligence is the ability to hold two opposed ideas in mind at the same time and still retain the ability to function.',
    attribution: 'F. Scott Fitzgerald',
  },
  {
    text: 'Be an Elephant, not a Hippopotamus — listen deeply, speak thoughtfully, and lead with care rather than dominance.',
    attribution: 'Lead Life Well',
  },
];

const SEPARATOR = '◆';

function TickerContent() {
  return (
    <>
      {QUOTES.map((q, i) => (
        <span key={i} className="inline-flex items-baseline gap-2 mx-10 whitespace-nowrap">
          <span className="text-av-gold font-medium">{q.text}</span>
          {q.attribution && (
            <span className="text-white/50 text-xs italic">— {q.attribution}</span>
          )}
          <span className="text-white/25 mx-4 text-xs">{SEPARATOR}</span>
        </span>
      ))}
    </>
  );
}

export default function QuoteTicker() {
  return (
    <div
      className="bg-av-navy border-b border-white/10 overflow-hidden flex-shrink-0"
      style={{ height: '30px' }}
      aria-label="Motivational quotes"
    >
      <div className="flex items-center h-full">
        {/* Duplicated content so the scroll loops seamlessly */}
        <div
          className="flex items-center animate-marquee"
          style={{ willChange: 'transform' }}
        >
          <TickerContent />
          <TickerContent />
        </div>
      </div>
    </div>
  );
}
