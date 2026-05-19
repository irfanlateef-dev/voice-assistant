import { motion } from 'framer-motion';

const BADGES = [
  { emoji: '🎙',  name: 'LiveKit',        desc: 'WebRTC room & audio routing' },
  { emoji: '🔊',  name: 'Deepgram',       desc: 'Flux v2 STT + Aura TTS' },
  { emoji: '🧠',  name: 'OpenRouter',     desc: 'LLM reasoning & tool calls' },
  { emoji: '🗄',  name: 'Neon',           desc: 'Serverless PostgreSQL' },
  { emoji: '⚛️', name: 'React',          desc: 'Real-time frontend UI' },
  { emoji: '🟢',  name: 'Node.js',        desc: 'Agent worker & API server' },
];

const MARQUEE_ITEMS = [...BADGES, ...BADGES];

export default function TechStack() {
  return (
    <section className="py-24" style={{ background: '#0a0f1e' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">
            The stack
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-white leading-tight mb-4">
            Engineered on the best infrastructure.
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
            Every layer chosen for reliability and speed.
          </p>
        </motion.div>

        {/* Badges row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="flex flex-wrap justify-center gap-4 mb-14"
        >
          {BADGES.map((b) => (
            <div
              key={b.name}
              className="glass-card flex items-center gap-3 px-5 py-3.5 rounded-full hover:border-indigo-500/40 transition-colors duration-200 cursor-default"
            >
              <span className="text-xl" role="img" aria-label={b.name}>{b.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-white m-0 leading-none">{b.name}</p>
                <p className="text-xs text-[#94a3b8] m-0 mt-0.5 leading-none">{b.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Marquee strip */}
        <div className="marquee-wrapper opacity-30 select-none" aria-hidden="true">
          <div className="marquee-track">
            {MARQUEE_ITEMS.map((b, i) => (
              <span key={i} className="text-sm font-medium text-[#94a3b8] whitespace-nowrap flex items-center gap-3">
                <span>{b.emoji} {b.name}</span>
                <span className="opacity-40">·</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
