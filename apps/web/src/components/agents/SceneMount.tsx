"use client";

/**
 * Loads the WebGL scene after the page is readable.
 *
 * Three.js is ~130KB gzipped — three times the weight of everything else on
 * this page put together. Loading it eagerly would push first paint behind a
 * decorative layer on exactly the hardware this programme recruits on: a cheap
 * Android phone on a weak connection.
 *
 * So the scene is a dynamic import with `ssr: false`, kicked off after mount
 * and behind `requestIdleCallback` where available. Text, terms and the sign-in
 * button are usable before the download starts; the scene fades in when it is
 * ready and nothing reflows when it does, because the canvas is fixed-position
 * behind the content.
 *
 * It is also skipped entirely for readers who have asked for reduced motion,
 * and on devices reporting a saving-data preference or very low memory — there
 * is no point spending their bandwidth on ambience.
 */
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

export function SceneMount() {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const connection = (
      navigator as Navigator & { connection?: NetworkInformation }
    ).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return;

    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    if (typeof memory === "number" && memory <= 2) return;

    const start = () => setLoad(true);
    const idle = (
      window as Window & { requestIdleCallback?: (cb: () => void) => number }
    ).requestIdleCallback;

    if (idle) {
      const handle = idle(start);
      return () => {
        const cancel = (
          window as Window & { cancelIdleCallback?: (h: number) => void }
        ).cancelIdleCallback;
        cancel?.(handle);
      };
    }

    const timer = window.setTimeout(start, 400);
    return () => window.clearTimeout(timer);
  }, []);

  if (!load) return null;
  return <HeroScene />;
}
