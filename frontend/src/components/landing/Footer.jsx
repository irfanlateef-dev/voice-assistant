import { Github, Twitter, Linkedin } from 'lucide-react';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

const PRODUCT_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Use cases',    href: '#use-cases' },
];

const COMPANY_LINKS = [
  { label: 'About',   href: '#' },
  { label: 'Blog',    href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '#' },
];

const SOCIALS = [
  { Icon: Twitter,  label: 'Twitter / X', href: '#' },
  { Icon: Github,   label: 'GitHub',      href: '#' },
  { Icon: Linkedin, label: 'LinkedIn',    href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#070b14' }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Logo + tagline */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              >
                V
              </span>
              <span className="text-white font-semibold text-[1.1rem] tracking-tight">VoiceAgent</span>
            </div>
            <p className="text-sm text-[#94a3b8] leading-relaxed max-w-xs m-0">
              Real-time AI voice assistant that manages your tasks and notes hands-free.
              Built on LiveKit, Deepgram, and Neon.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 mt-2">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors duration-200 border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] mb-5">
              Product
            </h3>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-[#94a3b8] hover:text-white transition-colors duration-200 no-underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <AppLink className="text-sm text-[#94a3b8] hover:text-white transition-colors duration-200 no-underline">
                  {getAppCtaLabel('Get started')}
                </AppLink>
              </li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] mb-5">
              Company
            </h3>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-[#94a3b8] hover:text-white transition-colors duration-200 no-underline"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-[#94a3b8] m-0">
            © 2025 VoiceAgent. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-[#94a3b8] hover:text-white no-underline transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-xs text-[#94a3b8] hover:text-white no-underline transition-colors duration-200">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
