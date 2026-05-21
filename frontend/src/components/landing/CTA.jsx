import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';
import { useReveal } from '../../hooks/useReveal.js';

export default function CTA() {
  const contentRef = useReveal();

  return (
    <section
      id="cta"
      className="relative py-32 overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-y border-amber-100"
    >
      <div className="max-w-3xl mx-auto px-6 text-center relative">
        <div ref={contentRef} className="reveal flex flex-col items-center gap-7">
          <p className="text-amber-700 text-sm font-semibold uppercase tracking-widest">
            Start for free
          </p>

          <h2 className="text-4xl md:text-[3.25rem] font-extrabold text-stone-900 leading-tight m-0">
            What are you cooking<br />tonight?
          </h2>

          <p className="text-stone-600 text-lg m-0">
            Connect in 10 seconds. No credit card. No app.
          </p>

          <AppLink
            className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-base font-bold text-white no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
          >
            {getAppCtaLabel('Start cooking with Grace →')}
          </AppLink>

          <p className="text-stone-500 text-sm m-0">
            Sub-second latency · Built on LiveKit + Deepgram
          </p>
        </div>
      </div>
    </section>
  );
}
