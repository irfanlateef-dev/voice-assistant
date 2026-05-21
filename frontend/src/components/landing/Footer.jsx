import { Github, Twitter, Linkedin } from 'lucide-react';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

const PRODUCT_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Use cases', href: '#use-cases' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact', href: '#' },
];

const SOCIALS = [
  { Icon: Twitter, label: 'Twitter / X', href: '#' },
  { Icon: Github, label: 'GitHub', href: '#' },
  { Icon: Linkedin, label: 'LinkedIn', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}
              >
                🍳
              </span>
              <span className="text-stone-900 font-semibold text-[1.1rem] tracking-tight">HomeChef AI</span>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed max-w-xs m-0">
              Your AI kitchen companion Grace walks you through recipes step by step,
              hands-free. Built on LiveKit, Deepgram, and Neon.
            </p>
            <div className="flex gap-3 mt-2">
              {SOCIALS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors duration-200 border border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-5">
              Product
            </h3>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              {PRODUCT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-stone-600 hover:text-stone-900 transition-colors duration-200 no-underline">
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <AppLink className="text-sm text-stone-600 hover:text-stone-900 transition-colors duration-200 no-underline">
                  {getAppCtaLabel('Get started')}
                </AppLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-5">
              Company
            </h3>
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              {COMPANY_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-stone-600 hover:text-stone-900 transition-colors duration-200 no-underline">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-stone-200">
          <p className="text-xs text-stone-500 m-0">
            © 2026 HomeChef AI. All rights reserved.
          </p>
          <div className="flex gap-5">
            <a href="#" className="text-xs text-stone-500 hover:text-stone-900 no-underline transition-colors duration-200">
              Privacy
            </a>
            <a href="#" className="text-xs text-stone-500 hover:text-stone-900 no-underline transition-colors duration-200">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
