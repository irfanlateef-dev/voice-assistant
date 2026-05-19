import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AppLink from './AppLink.jsx';
import { getAppCtaLabel } from '../../config/appLinks.js';

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features',     href: '#features' },
  { label: 'Use cases',    href: '#use-cases' },
];

export default function Navbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070b14]/90 backdrop-blur-md border-b border-white/[0.08]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline" aria-label="VoiceAgent home">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            V
          </span>
          <span className="text-white font-semibold text-[1.1rem] tracking-tight">VoiceAgent</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[#94a3b8] hover:text-white transition-colors duration-200 text-sm font-medium no-underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <AppLink
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white no-underline transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-indigo-500/30"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
        >
          {getAppCtaLabel('Get started')}
        </AppLink>

        {/* Hamburger */}
        <button
          className="md:hidden text-white p-1.5 rounded-md hover:bg-white/10 transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden px-6 pb-6 pt-2 bg-[#0a0f1e] border-b border-white/[0.08] flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[#94a3b8] hover:text-white text-base font-medium no-underline py-1"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <AppLink
            className="inline-flex justify-center items-center px-5 py-3 rounded-full text-sm font-semibold text-white no-underline"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            onClick={() => setOpen(false)}
          >
            {getAppCtaLabel('Get started')}
          </AppLink>
        </div>
      )}
    </nav>
  );
}
