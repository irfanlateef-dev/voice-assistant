import { motion } from 'framer-motion';
import { Mic, FileText, CheckSquare, BookOpen, Shield, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Mic,
    title: 'Barge-in support',
    desc: 'Interrupt the agent mid-sentence. It stops immediately and listens to your next request without missing a beat.',
    color: '#6366f1',
  },
  {
    icon: FileText,
    title: 'Real-time transcription',
    desc: 'Every word appears on screen as you speak. The live transcript keeps you in the loop even while the agent is replying.',
    color: '#a855f7',
  },
  {
    icon: CheckSquare,
    title: 'Task management',
    desc: 'Create, list, complete, and delete tasks entirely by voice. The agent confirms each action and updates your list instantly.',
    color: '#22d3ee',
  },
  {
    icon: BookOpen,
    title: 'Note capture',
    desc: 'Save ideas hands-free while you\'re driving, cooking, or on a call. Search them by keyword later without opening an app.',
    color: '#f59e0b',
  },
  {
    icon: Shield,
    title: 'Private & scoped',
    desc: 'Neon Auth keeps accounts scoped per user. Your tasks and notes are tied to your Neon Auth identity — nothing bleeds between accounts.',
    color: '#10b981',
  },
  {
    icon: Zap,
    title: 'Sub-second latency',
    desc: 'The Deepgram Flux v2 + Aura TTS pipeline is tuned end-to-end for speed. The agent replies before you\'ve fully exhaled.',
    color: '#ec4899',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Features() {
  return (
    <section id="features" className="py-28">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.55 }}
          className="text-center mb-16"
        >
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-widest mb-3">
            Capabilities
          </p>
          <h2 className="text-4xl md:text-[2.75rem] font-bold text-white leading-tight mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-[#94a3b8] text-lg max-w-xl mx-auto">
            Built for speed. Designed to stay out of your way.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <motion.article
                key={feat.title}
                variants={cardVariants}
                className="glass-card p-6 flex flex-col gap-4 cursor-default
                  hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10
                  hover:scale-[1.02] transition-all duration-200 ease-out"
              >
                {/* Icon box */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${feat.color}1a`, border: `1px solid ${feat.color}33` }}
                >
                  <Icon size={18} style={{ color: feat.color }} strokeWidth={2} />
                </div>

                <h3 className="text-base font-semibold text-white m-0">{feat.title}</h3>
                <p className="text-sm text-[#94a3b8] leading-relaxed m-0">{feat.desc}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
