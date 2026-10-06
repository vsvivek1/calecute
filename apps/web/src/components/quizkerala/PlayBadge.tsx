import { QUIZKERALA } from "@/lib/quizkerala/content";

/** "Get it on Google Play" button linking to the store listing. */
export function PlayBadge() {
  return (
    <a className="store-badge" href={QUIZKERALA.playStoreUrl}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Z" />
        <path fill="#FBBC04" d="m17.3 8.5-3.5 3.5 3.5 3.5 3.9-2.2c1.1-.6 1.1-2 0-2.6l-3.9-2.2Z" />
        <path fill="#4285F4" d="M13.8 12 3.6 22.2c.4.2.9.2 1.4-.1l12.3-6.6-3.5-3.5Z" />
        <path fill="#EA4335" d="M13.8 12 17.3 8.5 5 1.9c-.5-.3-1-.3-1.4-.1L13.8 12Z" />
      </svg>
      <span>
        Get it on
        <strong>Google Play</strong>
      </span>
    </a>
  );
}
