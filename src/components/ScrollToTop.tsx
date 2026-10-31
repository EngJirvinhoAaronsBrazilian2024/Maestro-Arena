import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Reset window and root document
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // 2. Reset all scrollable containers throughout the app
    const resetScrollableElements = () => {
      const scrollContainers = document.querySelectorAll<HTMLElement>(
        '.overflow-y-auto, .overflow-y-scroll, .overflow-auto, [data-scroll-container], main'
      );
      scrollContainers.forEach((el) => {
        el.scrollTop = 0;
      });
    };

    resetScrollableElements();
    const frameId = requestAnimationFrame(resetScrollableElements);
    const timer = setTimeout(resetScrollableElements, 60);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [pathname, search]);

  return null;
}

