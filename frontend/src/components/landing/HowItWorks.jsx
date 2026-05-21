import { ChefHat, Hand, MessageCircle } from 'lucide-react';
import { useReveal } from '../../hooks/useReveal.js';

const STEPS = [
  {
    number: '01',
    icon: ChefHat,
    title: 'Say what you want to cook',
    desc: 'You name a dish, Grace asks a few smart questions tailored to that recipe — one at a time, like a real conversation.',
    color: '#f59e0b',
  },
  {
    number: '02',
    icon: Hand,
    title: 'Follow along hands-free',
    desc: 'Grace guides you one step at a time. Say "added the onions" and it checks them off automatically. Your hands stay clean, your workspace stays clear.',
    color: '#ea580c',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Never get bored waiting',
    desc: "While your sauce simmers, Grace tells you a food fact, asks you something interesting, or just chats. Not a timer. An actual conversation.",
    color: '#fbbf24',
  },
];

export default function HowItWorks() {
  const headerRef = useReveal();
  const gridRef   = useReveal();

  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div ref={headerRef} className="reveal text-center mb-20">
          <p className="text-amber-600 text-sm font-semibold uppercase tracking-widest mb-3">
            How it works
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-stone-900 leading-tight mb-4">
            From first word to last bite.
          </h2>
          <p className="text-stone-600 text-lg max-w-xl mx-auto">
            No forms. No clicks. No messy screen taps. Just talk.
          </p>
        </div>

        <div
          ref={gridRef}
          className="reveal-group grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* Connector line — desktop only */}
          <div className="absolute top-10 left-[16%] right-[16%] hidden md:block pointer-events-none">
            <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
              <line
                x1="0" y1="1" x2="100" y2="1"
                stroke="url(#amberLineGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="svg-connector"
              />
              <defs>
                <linearGradient id="amberLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#f59e0b" stopOpacity="0.7" />
                  <stop offset="50%"  stopColor="#ea580c" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="reveal-item glass-card p-8 flex flex-col gap-5 relative group hover:border-amber-500/40 transition-colors duration-200"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-5xl font-black leading-none"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}88)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {step.number}
                  </span>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${step.color}22`, border: `1px solid ${step.color}44` }}
                  >
                    <Icon size={18} style={{ color: step.color }} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-stone-900">{step.title}</h3>
                <p className="text-stone-600 text-base leading-relaxed m-0">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
