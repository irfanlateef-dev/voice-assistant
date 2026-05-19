import React, { Suspense, lazy } from 'react';
import Navbar from '../components/landing/Navbar.jsx';
import Hero from '../components/landing/Hero.jsx';

const HowItWorks = lazy(() => import('../components/landing/HowItWorks.jsx'));
const Features = lazy(() => import('../components/landing/Features.jsx'));
const UseCases = lazy(() => import('../components/landing/UseCases.jsx'));
const TechStack = lazy(() => import('../components/landing/TechStack.jsx'));
const CTA = lazy(() => import('../components/landing/CTA.jsx'));
const Footer = lazy(() => import('../components/landing/Footer.jsx'));

const SectionFallback = () => (
  <div className="h-32 flex items-center justify-center">
    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
  </div>
);

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Suspense fallback={<SectionFallback />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Features />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <UseCases />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <TechStack />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <CTA />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Footer />
        </Suspense>
      </main>
    </>
  );
}
