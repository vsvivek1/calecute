"use client";

/**
 * Referral sharing: copy the link, or open WhatsApp with it pre-filled.
 *
 * WhatsApp is the whole distribution mechanism for this programme, so the share
 * is one tap and the message is already written. Copy falls back to a
 * select-and-copy on browsers without the async clipboard API, which includes
 * some of the older Android WebViews this will run in.
 */
import { useState } from "react";

export function ShareRow({
  link,
  whatsappUrl,
}: {
  link: string;
  whatsappUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission: select the text so the reader can copy it.
      const input = document.getElementById("referral-link") as HTMLInputElement | null;
      input?.select();
    }
  }

  return (
    <div>
      <div className="field">
        <label htmlFor="referral-link">Your referral link
        </label>
        <input id="referral-link" type="text" readOnly value={link} />
      </div>

      <div className="share-row">
        <a
          className="button"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>Share on WhatsApp
          </span>
        </a>
        <button type="button" className="button secondary" onClick={copy}>
          <span>{copied ? "Copied" : "Copy link"}
          </span>
        </button>
      </div>
    </div>
  );
}
