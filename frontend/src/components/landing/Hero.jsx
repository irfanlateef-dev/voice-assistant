import { useEffect, useRef, useState } from 'react';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

const HEADLINE_WORDS_1 = ['Your', 'sous', 'chef'];
const HEADLINE_WORDS_2 = ['is', 'listening.'];

const TRANSCRIPT_SEQUENCE = [
  { role: 'user', text: 'I want to make butter chicken', delay: 1000 },
  { role: 'assistant', text: 'Love it! How spicy do you like it?', delay: 2400 },
  { role: 'user', text: 'Medium, and low oil please', delay: 4200 },
  { role: 'assistant', text: 'Perfect. Do you have heavy cream or coconut milk?', delay: 5800 },
  { role: 'user', text: 'Coconut milk works', delay: 7600 },
  { role: 'assistant', text: 'Adding your ingredients now…', delay: 9000 },
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
          <span key={i} className="siri-orb__wave" style={{ animationDelay: `${i * 0.13}s` }} />
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
        }, lastDelay + 2800),
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
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs font-semibold text-amber-700 uppercase tracking-widest">
          Live session
        </span>
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
                  ? 'self-end bg-amber-50 text-amber-900 border border-amber-200'
                  : 'self-start bg-stone-100 text-stone-700 border border-stone-200'
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
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-stone-50">
      <div className="noise-overlay" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-20">
          <div className="flex flex-col gap-8">
            <div className="hero-fade-up" style={{ animationDelay: '0s' }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-800 border border-amber-200 bg-amber-50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Powered by Deepgram + LiveKit
              </span>
            </div>

            <h1 className="text-[3.5rem] sm:text-[4rem] lg:text-[4.75rem] font-extrabold leading-[1.08] tracking-tight">
              <div className="flex flex-wrap gap-x-4">
                {HEADLINE_WORDS_1.map((word, i) => (
                  <span
                    key={word}
                    className="hero-word text-stone-900"
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
                    className={`hero-word ${i === 1 ? 'gradient-text' : 'text-stone-900'}`}
                    style={{ animationDelay: `${(HEADLINE_WORDS_1.length + i) * 0.08}s` }}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </h1>

            <p
              className="hero-fade-up text-lg text-stone-600 leading-relaxed max-w-xl"
              style={{ animationDelay: '0.55s' }}
            >
              Just say what you want to cook. Grace guides you step by step, remembers your
              preferences, and keeps you company while things simmer.
            </p>

            <div className="hero-fade-up flex flex-wrap gap-4" style={{ animationDelay: '0.7s' }}>
              <AppLink
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-white no-underline transition-all duration-200 hover:brightness-105 hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
              >
                {getAppCtaLabel('Start cooking free')}
              </AppLink>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-base font-semibold text-amber-800 no-underline border border-amber-200 bg-white hover:bg-amber-50 transition-all duration-200"
              >
                See how it works
              </a>
            </div>

            <div className="hero-fade-up flex items-center gap-4 mt-2" style={{ animationDelay: '0.9s' }}>
              <div className="flex -space-x-2">
                {['#f59e0b', '#ea580c', '#fbbf24', '#f97316', '#fcd34d'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: `radial-gradient(circle at 40% 35%, ${c}dd, ${c}66)` }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900 m-0">Home cooks love it</p>
                <p className="text-xs text-stone-500 m-0">★★★★★ Hands-free & delicious</p>
              </div>
            </div>
          </div>

          <div className="hero-scale-in flex flex-col items-center gap-6 relative min-h-[580px] justify-center">
            <div className="absolute top-0 right-4 lg:right-0 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-800 border border-amber-200 bg-white shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Grace is online
            </div>

            <SiriOrb />
            <LiveSessionCard />
          </div>
        </div>
      </div>
    </section>
  );
}
