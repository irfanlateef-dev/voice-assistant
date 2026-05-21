import { Sliders, Hand, MessageCircle, ListChecks, BookMarked, Globe } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal.js';

const FEATURES = [
  {
    icon: Sliders,
    title: 'Personalised recipes',
    desc: 'Asks only what matters for the dish you chose — servings, swaps, style — before you touch a pan. Grace remembers what you said.',
    color: '#f59e0b',
  },
  {
    icon: Hand,
    title: 'Hands-free checklist',
    desc: 'Say "I added the garlic" and it\'s marked done. No touching your phone with messy hands. Ever.',
    color: '#ea580c',
  },
  {
    icon: MessageCircle,
    title: 'Smart wait time fill',
    desc: 'Grace detects when you\'re waiting and starts a real conversation. Not a timer. An actual chat.',
    color: '#fbbf24',
  },
  {
    icon: ListChecks,
    title: 'Progress tracking',
    desc: 'Live ingredient checklist and step tracker update in real time as you cook. Always know exactly where you are.',
    color: '#f97316',
  },
  {
    icon: BookMarked,
    title: 'Recipe memory',
    desc: 'Preferences and notes saved per session so you can review what you made and how you made it.',
    color: '#fb923c',
  },
  {
    icon: Globe,
    title: 'Works on any device',
    desc: 'Open in any browser. No app install needed. Start cooking in 10 seconds from any device.',
    color: '#fcd34d',
  },
];

export default function Features() {
  const headerRef = useReveal();
  const gridRef   = useReveal();

  return (
    <section id="features" className="py-28 bg-stone-50">
      <div className="max-w-7xl mx-auto px-6">

        <div ref={headerRef} className="reveal text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-3">
            Capabilities
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-stone-900 leading-tight mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-stone-600 text-lg max-w-xl mx-auto">
            Built to keep your hands free and your food on point.
          </p>
        </div>

        <div
          ref={gridRef}
          className="reveal-group grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <article
                key={feat.title}
                className="reveal-item glass-card p-6 flex flex-col gap-4 cursor-default
                  hover:border-amber-300 hover:shadow-md
                  hover:scale-[1.01] transition-all duration-200 ease-out"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${feat.color}1a`, border: `1px solid ${feat.color}33` }}
                >
                  <Icon size={18} style={{ color: feat.color }} strokeWidth={2} />
                </div>
                <h3 className="text-base font-semibold text-stone-900 m-0">{feat.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed m-0">{feat.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
