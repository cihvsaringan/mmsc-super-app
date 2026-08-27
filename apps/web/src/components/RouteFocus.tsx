import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteFocus() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : document.querySelector<HTMLElement>('[data-route-main]');
      if (!target) return;
      if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
      target.focus({ preventScroll: Boolean(hash) });
      if (hash) target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash, pathname]);
  return null;
}
