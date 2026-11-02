"use client";

/**
 * Share an opening: the phone's share sheet where there is one, plus
 * WhatsApp and copy-link for everywhere else.
 */
import { useState } from "react";

const pill =
  "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition";

export default function ShareButton({
  url,
  title,
  text,
  onDark = false,
}: {
  url: string;
  title: string;
  text: string;
  onDark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const tone = onDark
    ? "border-white/20 bg-white/5 text-white hover:bg-white/10"
    : "border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Dismissed or unsupported: fall through to copying the link.
      }
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={share} className={`${pill} ${tone}`}>
        <span aria-hidden="true">↗</span> Share
      </button>
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`${pill} ${tone}`}>
        WhatsApp
      </a>
      <button type="button" onClick={copy} className={`${pill} ${tone}`} aria-live="polite">
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
