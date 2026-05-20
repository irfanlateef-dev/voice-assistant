import { Briefcase, Lightbulb, Users } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal.js';

const CASES = [
  {
    accent: '#6366f1',
    icon: Briefcase,
    title: 'Meeting follow-ups',
    persona: 'Busy professionals',
    summary: 'Capture action items the moment a call ends — while walking to your next meeting or grabbing coffee.',
    examples: [
      'Add a task to send the proposal by Friday',
      'What tasks are still pending?',
      'Mark follow up with client as done',
    ],
    capabilities: ['Task creation', 'Follow-up reminders', 'Status updates'],
  },
  {
    accent: '#a855f7',
    icon: Lightbulb,
    title: 'Hands-free note capture',
    persona: 'Solo founders & creators',
    summary: "Save ideas, reminders, and rough thoughts instantly — no unlocking your phone or opening a notes app.",
    examples: [
      'Note: pitch angle for the product demo',
      'Save a note about pricing tiers',
      'Find my notes about the launch',
    ],
    capabilities: ['Note capture', 'Keyword search', 'Instant recall'],
  },
  {
    accent: '#22d3ee',
    icon: Users,
    title: 'Standup & planning',
    persona: 'Remote team leads',
    summary: "Log decisions and next steps right after standup so nothing slips through before the day gets away from you.",
    examples: [
      'Add tasks for the API migration sprint',
      'Note: team agreed to ship v2 on Thursday',
      'List my open tasks for this week',
    ],
    capabilities: ['Meeting notes', 'Task delegation', 'Weekly planning'],
  },
];

export default function UseCases() {
  const headerRef = useReveal();
  const gridRef   = useReveal();

  return (
    <section id="use-cases" className="py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.07) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative">

        <div ref={headerRef} className="reveal text-center mb-16">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Use cases
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-white leading-tight mb-4">
            Built for people who move fast.
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
            If your hands are busy, your voice isn't.
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
                    <h3 className="text-lg font-bold text-white m-0 leading-tight">{c.title}</h3>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-1.5 m-0" style={{ color: c.accent }}>
                      {c.persona}
                    </p>
                  </div>
                </div>

                <p className="text-[#94a3b8] text-sm leading-relaxed m-0">{c.summary}</p>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#64748b] mb-2.5 m-0">
                    Try saying
                  </p>
                  <ul className="flex flex-col gap-2 list-none m-0 p-0">
                    {c.examples.map((line) => (
                      <li
                        key={line}
                        className="text-sm text-indigo-200/90 px-3 py-2 rounded-lg border border-indigo-500/15 bg-indigo-500/8 leading-snug"
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
                      className="px-2.5 py-1 rounded-md text-xs text-[#94a3b8] border border-white/[0.08] bg-white/[0.03]"
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
