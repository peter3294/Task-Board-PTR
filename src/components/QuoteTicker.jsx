// ─────────────────────────────────────────────────────────────────────────────
// QuoteTicker — displays one motivational quote at a time, rotating every 20s.
// Quotes are loaded from the "Quotes" tab of your Google Sheet.
// To add / edit / remove quotes: update the Quotes tab directly in the sheet.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

// Fallback quotes used only if the sheet hasn't loaded yet
const FALLBACK_QUOTES = [
  { text: 'The Pareto Principle: 20% of your efforts drive 80% of your results — focus relentlessly on what moves the needle.', attribution: 'Pareto Principle' },
  { text: 'Worry is not the same as preparation.', attribution: 'Ping Yeh, StemoniX' },
  { text: 'The test of a first-rate intelligence is the ability to hold two opposed ideas in mind at the same time and still retain the ability to function.', attribution: 'F. Scott Fitzgerald' },
  { text: 'Be an Elephant, not a Hippopotamus — listen deeply, speak thoughtfully, and lead with care rather than dominance.', attribution: 'Lead Life Well' },
  { text: "It's not what you do, it's how well you communicate what you do.", attribution: 'Beamer' },
  { text: 'Individuals vary, but percentages remain constant.', attribution: 'Arthur Conan Doyle, The Sign of the Four' },
  { text: 'Until you make the unconscious conscious, it will direct your life and you will call it fate.', attribution: 'attr. Carl Jung' },
  { text: 'Why do we fall, Bruce? So we can learn to pick ourselves up.', attribution: 'Thomas Wayne, Batman Begins' },
  { text: 'Through discipline comes freedom.', attribution: 'attr. Aristotle' },
  { text: 'Lord, let me be smart enough to know how dumb I am, and give me the courage to carry on anyway.', attribution: '' },
];

const INTERVAL_MS = 20_000;

export default function QuoteTicker({ quotes = [] }) {
  const list = quotes.length > 0 ? quotes : FALLBACK_QUOTES;
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Reset to first quote whenever the quotes list changes
    setIdx(0);
    setVisible(true);
  }, [list.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % list.length);
        setVisible(true);
      }, 400); // match transition duration below
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [list.length]);

  const current = list[idx] || list[0];

  return (
    <div
      className="bg-av-navy border-b border-white/10 flex-shrink-0 flex items-center px-5"
      style={{ height: '52px' }}
      aria-label="Motivational quote"
    >
      <div
        key={idx}
        style={{
          transition: 'opacity 0.4s ease',
          opacity: visible ? 1 : 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        className="flex items-baseline gap-3 min-w-0 w-full"
      >
        <span className="text-av-gold font-medium text-xl truncate">
          {current.text}
        </span>
        {current.attribution && (
          <span className="text-white/45 text-sm italic flex-shrink-0">
            — {current.attribution}
          </span>
        )}
      </div>
    </div>
  );
}
