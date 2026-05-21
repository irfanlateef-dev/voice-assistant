import { BookOpen, Clock, Heart } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal.js';

const CASES = [
  {
    accent: '#f59e0b',
    icon: BookOpen,
    title: 'First-time cooks',
    persona: 'Beginner cooks',
    summary: "Never cooked this dish before? Grace explains every step, warns you before things go wrong, and tells you what to look for.",
    examples: [
      'How do I know when the oil is hot enough?',
      'What does "fold in" mean?',
      'Can I use butter instead of ghee?',
    ],
    capabilities: ['Step-by-step guidance', 'Substitution tips', 'Beginner-friendly'],
  },
  {
    accent: '#ea580c',
    icon: Clock,
    title: 'Busy parents',
    persona: 'Multitasking parents',
    summary: "Hands full? Say everything, touch nothing. Grace keeps track of where you are even if you get interrupted mid-recipe.",
    examples: [
      'Where were we?',
      'I added the tomatoes',
      'How long does this step take?',
    ],
    capabilities: ['Hands-free control', 'Progress memory', 'Quick catch-up'],
  },
  {
    accent: '#fbbf24',
    icon: Heart,
    title: 'Solo cooks',
    persona: 'People who cook alone',
    summary: "Grace keeps you company. Food facts, questions, jokes. Cooking alone has never been less lonely.",
    examples: [
      'Tell me something interesting about turmeric',
      'What wine goes with this?',
      'What should I make next time?',
    ],
    capabilities: ['Conversation', 'Food facts', 'Cooking companionship'],
  },
];

export default function UseCases() {
  const headerRef = useReveal();
  const gridRef   = useReveal();

  return (
    <section id="use-cases" className="py-28 relative overflow-hidden bg-white">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(245,158,11,0.08) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative">

        <div ref={headerRef} className="reveal text-center mb-16">
          <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-3">
            Who it's for
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-stone-900 leading-tight mb-4">
            In the kitchen, Grace has your back.
          </h2>
          <p className="text-stone-600 text-lg max-w-xl mx-auto">
            Whether it's your first time or your hundredth.
          </p>
        </div>

        <div
          ref={gridRef}
          className="reveal-group grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {CASES.map((c) => {
            const Icon = c.icon;
            return (
              <article
                key={c.title}
                className="reveal-item glass-card p-7 flex flex-col gap-5 relative overflow-hidden"
                style={{ borderLeft: `3px solid ${c.accent}` }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none"
                  style={{ background: `linear-gradient(90deg, ${c.accent}14, transparent)` }}
                />

                <div className="flex items-start gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${c.accent}1a`, border: `1px solid ${c.accent}33` }}
                  >
                    <Icon size={20} style={{ color: c.accent }} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900 m-0 leading-tight">{c.title}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-1.5 m-0" style={{ color: c.accent }}>
                      {c.persona}
                    </p>
                  </div>
                </div>

                <p className="text-stone-600 text-sm leading-relaxed m-0">{c.summary}</p>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2.5 m-0">
                    Try saying
                  </p>
                  <ul className="flex flex-col gap-2 list-none m-0 p-0">
                    {c.examples.map((line) => (
                      <li
                        key={line}
                        className="text-sm text-amber-900 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 leading-snug"
                      >
                        "{line}"
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 mt-auto">
                  {c.capabilities.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-md text-xs text-stone-600 border border-stone-200 bg-stone-50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
