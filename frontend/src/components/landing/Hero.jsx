import { useEffect, useRef, useState } from 'react';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

const HEADLINE_WORDS_1 = ['Ready', 'for', 'your'];
const HEADLINE_WORDS_2 = ['calls,', '24/7.'];

const TRANSCRIPT_SEQUENCE = [
  { role: 'user',      text: 'Add a task to call the dentist',  delay: 1200 },
  { role: 'assistant', text: 'Done! Task added.',               delay: 2400 },
  { role: 'user',      text: 'Note: follow up on proposal',     delay: 4000 },
  { role: 'assistant', text: 'Saved!',                          delay: 5200 },
  { role: 'user',      text: "What's on my to-do list?",        delay: 7000 },
  { role: 'assistant', text: 'You have 3 pending tasks.',        delay: 8400 },
];

function SiriOrb() {
  return (
    <div className="siri-orb">
      <div className="siri-orb__glow" />
      <div className="siri-orb__shell">
        <div className="siri-orb__layer siri-orb__layer--1" />
        <div className="siri-orb__layer siri-orb__layer--2" />
        <div className="siri-orb__layer siri-orb__layer--3" />
        <div className="siri-orb__core" />
      </div>
      <div className="siri-orb__waves">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="siri-orb__wave"
            style={{ animationDelay: `${i * 0.13}s` }}
          />
        ))}
      </div>
      <div className="siri-orb__ripple siri-orb__ripple--1" />
      <div className="siri-orb__ripple siri-orb__ripple--2" />
      <div className="siri-orb__ripple siri-orb__ripple--3" />
    </div>
  );
}

function LiveSessionCard() {
  const [visible, setVisible] = useState([]);
  const feedRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const timers = [];

    const runCycle = () => {
      if (cancelled) return;
      setVisible([]);

      TRANSCRIPT_SEQUENCE.forEach((item, i) => {
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setVisible((prev) => [...prev, i]);
          }, item.delay),
        );
      });

      const lastDelay = TRANSCRIPT_SEQUENCE[TRANSCRIPT_SEQUENCE.length - 1].delay;
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          runCycle();
        }, lastDelay + 2500),
      );
    };

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTop = feed.scrollHeight;
  }, [visible]);

  return (
    <div className="glass-card p-4 w-72 h-[240px] flex flex-col shrink-0">
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Live session</span>
      </div>
      <div
        ref={feedRef}
        className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5 overscroll-contain"
      >
        {TRANSCRIPT_SEQUENCE.map((item, i) =>
          visible.includes(i) ? (
            <div
              key={i}
              className={`bubble-appear text-xs px-3 py-1.5 rounded-lg max-w-[90%] shrink-0 ${
                item.role === 'user'
                  ? 'self-end bg-indigo-500/20 text-indigo-200 border border-indigo-500/20'
                  : 'self-start bg-white/[0.06] text-slate-300 border border-white/[0.08]'
              }`}
            >
              {item.text}
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">

          {/* ── Left: text ── */}
          <div className="flex flex-col gap-8">
            {/* Eyebrow badge */}
            <div className="hero-fade-up" style={{ animationDelay: '0s' }}>
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-300 border"
                style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Powered by Deepgram + LiveKit
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[3.5rem] sm:text-[4rem] lg:text-[4.75rem] font-extrabold leading-[1.08] tracking-tight">
              <div className="flex flex-wrap gap-x-4">
                {HEADLINE_WORDS_1.map((word, i) => (
                  <span
                    key={word}
                    className="hero-word text-white"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 mt-1">
                {HEADLINE_WORDS_2.map((word, i) => (
                  <span
                    key={word}
                    className={`hero-word ${i === 1 ? 'gradient-text' : 'text-white'}`}
                    style={{ animationDelay: `${(HEADLINE_WORDS_1.length + i) * 0.08}s` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </h1>

            {/* Sub-headline */}
            <p
              className="hero-fade-up text-lg text-[#94a3b8] leading-relaxed max-w-xl"
              style={{ animationDelay: '0.55s' }}
            >
              Speak naturally. Your AI assistant creates tasks, captures notes, and manages
              your to-do list — without touching a keyboard.
            </p>

            {/* CTA buttons */}
            <div
              className="hero-fade-up flex flex-wrap gap-4"
              style={{ animationDelay: '0.7s' }}
            >
              <AppLink
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-white no-underline transition-all duration-200 hover:brightness-110 hover:shadow-xl hover:shadow-indigo-500/30"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
              >
                {getAppCtaLabel('Start talking free')}
              </AppLink>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-indigo-300 no-underline border border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-400/50 transition-all duration-200"
              >
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div
              className="hero-fade-up flex items-center gap-4 mt-2"
              style={{ animationDelay: '0.9s' }}
            >
              <div className="flex -space-x-2">
                {['#6366f1','#a855f7','#22d3ee','#ec4899','#f59e0b'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#070b14] flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `radial-gradient(circle at 40% 35%, ${c}dd, ${c}66)` }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-white m-0">2,000+ users active</p>
                <p className="text-xs text-[#94a3b8] m-0">★★★★★ Loved by builders</p>
              </div>
            </div>
          </div>

          {/* ── Right: visual ── */}
          <div className="hero-scale-in flex flex-col items-center gap-6 relative min-h-[580px] justify-center">
            <div
              className="absolute top-0 right-4 lg:right-0 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-500/30"
              style={{ background: 'rgba(16,185,129,0.12)' }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Agent online
            </div>

            <SiriOrb />
            <LiveSessionCard />
          </div>

        </div>
      </div>
    </section>
  );
}
