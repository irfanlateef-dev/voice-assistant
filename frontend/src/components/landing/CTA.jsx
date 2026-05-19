import { motion } from 'framer-motion';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

export default function CTA() {
  return (
    <section
      id="cta"
      className="relative py-32 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}
    >
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 65%)',
        }}
      />

      {/* Floating blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(99,102,241,0.25)', filter: 'blur(80px)' }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'rgba(168,85,247,0.2)', filter: 'blur(80px)' }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-7"
        >
          <p className="text-indigo-300 text-sm font-semibold uppercase tracking-widest">
            Get started for free
          </p>

          <h2 className="text-4xl md:text-[3.25rem] font-extrabold text-white leading-tight m-0">
            Stop typing.<br />Start talking.
          </h2>

          <p className="text-indigo-200/80 text-lg m-0">
            Connect in 30 seconds. No credit card required.
          </p>

          <AppLink
            className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-base font-bold text-[#1e1b4b] no-underline transition-all duration-200
              hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20 active:translate-y-0"
            style={{ background: 'white' }}
          >
            {getAppCtaLabel('Try VoiceAgent free →')}
          </AppLink>

          <p className="text-indigo-300/60 text-sm m-0">
            2,000+ users · Sub-second latency · Built on LiveKit + Deepgram
          </p>
        </motion.div>
      </div>
    </section>
  );
}
