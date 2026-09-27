"use client";

/**
 * Reveals sections as they enter the viewport.
 *
 * Deliberately opt-in: the `reveal-ready` class is added by this component, so
 * the hidden state only ever applies once JavaScript is running. If the script
 * fails, never loads, or is blocked, every section stays plainly visible rather
 * than invisible — the failure mode of a scroll-reveal library that assumes it
 * will run.
 *
 * Only opacity and transform animate, so nothing here can shift layout.
 */
import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (reduced || targets.length === 0) return;

    document.body.classList.add("reveal-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("shown");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    for (const target of targets) observer.observe(target);

    // Anything already on screen at load reveals immediately, so the first
    // paint is not a blank page waiting for a scroll that may never come.
    requestAnimationFrame(() => {
      for (const target of targets) {
        if (target.getBoundingClientRect().top < window.innerHeight) {
          target.classList.add("shown");
          observer.unobserve(target);
        }
      }
    });

    /*
     * Safety net. If the observer never fires — a browser quirk, an odd
     * scroll container, a section taller than the viewport — the content
     * would stay at opacity 0 and the page would look broken. After two
     * seconds everything is revealed regardless.
     */
    const failsafe = window.setTimeout(() => {
      for (const target of targets) target.classList.add("shown");
      observer.disconnect();
    }, 2000);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
      document.body.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
