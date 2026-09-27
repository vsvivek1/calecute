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
 * It is skipped entirely for readers who have asked for reduced motion, on
 * devices reporting a saving-data preference or very low memory, and on phones
 * and tablets outright. The client asked for a modern 3D page and for a page
 * that is fast on a phone; those two only fit together if the scene is the part
 * that gives way on the small screen.
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

    /*
     * Not on a phone.
     *
     * Measured on the deployed page: the scene chunk is 137KB over the wire and
     * 507ms of main-thread work — more than everything else on the page put
     * together, and the largest single cost left. On a desktop that is free. On
     * the budget Android this programme recruits on it is half a second of an
     * unresponsive page, spent on decoration, to a reader who is still deciding
     * whether this is a scam.
     *
     * A narrow viewport or few cores is a good enough proxy, and it errs the
     * right way: a phone reporting nothing useful is treated as a phone.
     */
    const narrow = window.matchMedia("(max-width: 48rem)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const fewCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4;
    if (narrow || coarse || fewCores) return;

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
