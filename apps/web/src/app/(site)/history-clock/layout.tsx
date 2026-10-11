import type { ReactNode } from "react";
import { handFont } from "@/lib/history-clock/fonts";
import s from "@/components/history-clock/sketch.module.css";

/** Paper, ink and the hand-lettered face for every History Clock page. */
export default function HistoryClockLayout({ children }: { children: ReactNode }) {
  return <div className={`${handFont.variable} ${s.page}`}>{children}</div>;
}
