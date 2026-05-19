import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Wifi, Mic, Sparkles } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Wifi,
    title: 'Connect',
    desc: 'One click opens a LiveKit WebRTC session. Your browser requests mic access. That\'s it — no installs, no setup.',
    color: '#6366f1',
  },
  {
    number: '02',
    icon: Mic,
    title: 'Speak',
    desc: 'Deepgram Flux v2 detects when you\'ve finished speaking with near-zero delay and transcribes every word in real time.',
    color: '#a855f7',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Done',
    desc: 'The AI executes your intent — creates a task, marks it complete, saves a note — then speaks the confirmation back instantly.',
    color: '#22d3ee',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const itemVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function HowItWorks() {
  const ref   = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" className="py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-20"
        >
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">
            The process
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-white leading-tight mb-4">
            From voice to action in under a second.
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
            No forms. No clicks. Just speak.
          </p>
        </motion.div>

        {/* Steps grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {/* SVG connector line — desktop only */}
          <div className="absolute top-10 left-[16%] right-[16%] hidden md:block pointer-events-none">
            <svg width="100%" height="2" viewBox="0 0 100 2" preserveAspectRatio="none">
              <motion.line
                x1="0" y1="1" x2="100" y2="1"
                stroke="url(#lineGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
              />
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.7" />
                  <stop offset="50%"  stopColor="#a855f7" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.7" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={itemVariants}
                className="glass-card p-8 flex flex-col gap-5 relative group hover:border-indigo-500/40 transition-colors duration-200"
              >
                {/* Number + icon row */}
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

                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="text-[#94a3b8] text-base leading-relaxed m-0">{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
