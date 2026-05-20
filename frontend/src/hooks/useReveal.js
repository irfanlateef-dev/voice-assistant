import { useEffect, useRef } from 'react';

/**
 * Sets data-visible="" on the returned ref element when it enters the viewport
 * (fires once, then disconnects the observer).
 * Used with the .reveal / .reveal-group / .reveal-scale CSS classes.
 */
export function useReveal(margin = '-80px') {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute('data-visible', '');
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return ref;
}
