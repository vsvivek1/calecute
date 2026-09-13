"use client";

/**
 * The message after a sign-in that did not complete.
 *
 * Read from the URL in the browser rather than from searchParams on the server,
 * and that is the whole point: touching searchParams in the page would make it
 * dynamic, and this page is the one every WhatsApp forward lands on. Keeping it
 * static means it is served from the edge in about 150ms instead of being
 * rendered per visit in about 600ms.
 *
 * The trade is that the message appears a moment after the page does, for the
 * small minority who arrive with one. That is the right way round: the notice
 * matters to the few who bounced off Google, the load time matters to everyone.
 *
 * useSyncExternalStore rather than an effect, because it is exactly the case
 * that API is for — a value that exists in the browser and not on the server.
 * The server snapshot is empty, so the prerendered HTML and the first client
 * render agree and there is no hydration mismatch to paper over.
 */
import { useSyncExternalStore } from "react";
import { page as copy } from "@/lib/agents/content";

/** The query string does not change without a navigation, so nothing to watch. */
const subscribe = () => () => {};
const clientSearch = () => window.location.search;
const serverSearch = () => "";

export function AuthNotice() {
  const search = useSyncExternalStore(subscribe, clientSearch, serverSearch);
  if (!search) return null;

  const params = new URLSearchParams(search);
  const state = params.get("auth");

  const notice =
    state === "cancelled"
      ? { text: copy.signIn.cancelled, stop: false }
      : state === "suspended"
        ? { text: copy.signIn.suspended, stop: true }
        : state === "failed"
          ? { text: copy.signIn.failed, stop: false }
          : params.get("signedout")
            ? { text: copy.signIn.signedOut, stop: false }
            : null;

  if (!notice) return null;
  return (
    <p className={`notice ${notice.stop ? "stop" : "warn"}`} role="status">
      {notice.text}
    </p>
  );
}
