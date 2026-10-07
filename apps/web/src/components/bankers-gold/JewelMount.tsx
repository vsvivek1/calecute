"use client";

/**
 * Holds the hero's 3D jewellery. The page renders a CSS ring here on the
 * server, so the hero is complete before any script loads; Three.js is then
 * fetched as a separate chunk once the browser is idle and the WebGL canvas
 * fades in over the CSS ring.
 *
 * Unlike the agents page (components/agents/SceneMount.tsx), the scene also
 * loads on phones: here it is the hero image, not a background, and it is a
 * single small object rather than a full-screen field. It is still skipped on
 * save-data, 2G and very low-memory devices, where the CSS ring stays.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";

const JewelScene = dynamic(
  () => import("./JewelScene").then((m) => m.JewelScene),
  { ssr: false },
);

interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: string;
}

export function JewelMount() {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation })
      .connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /2g/.test(connection.effectiveType)) return;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof memory === "number" && memory <= 1) return;

    const begin = () => setLoad(true);
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    if (w.requestIdleCallback) {
      const handle = w.requestIdleCallback(begin, { timeout: 1200 });
      return () => w.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(begin, 300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`jewel${ready ? " is-ready" : ""}`}>
      <div className="jewel-fallback" aria-hidden="true">
        <span className="jewel-fallback-ring" />
        <span className="jewel-fallback-stone" />
      </div>
      {load && <JewelScene onReady={onReady} />}
    </div>
  );
}
