import { BANKERS_GOLD } from "@/lib/bankers-gold/content";

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Z" />
      <path fill="#FBBC04" d="m17.3 8.5-3.5 3.5 3.5 3.5 3.9-2.2c1.1-.6 1.1-2 0-2.6l-3.9-2.2Z" />
      <path fill="#4285F4" d="M13.8 12 3.6 22.2c.4.2.9.2 1.4-.1l12.3-6.6-3.5-3.5Z" />
      <path fill="#EA4335" d="M13.8 12 17.3 8.5 5 1.9c-.5-.3-1-.3-1.4-.1L13.8 12Z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.5-1-2.4-3.9ZM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4Z"
      />
    </svg>
  );
}

/** Google Play (live link) and App Store (coming soon until an iOS build ships). */
export function StoreBadges() {
  return (
    <div className="badges">
      <a className="badge" href={BANKERS_GOLD.playStoreUrl} target="_blank" rel="noopener">
        <PlayIcon />
        <span>
          <small>Get it on</small>
          Google Play
        </span>
      </a>
      {BANKERS_GOLD.appStoreUrl ? (
        <a className="badge" href={BANKERS_GOLD.appStoreUrl} target="_blank" rel="noopener">
          <AppleIcon />
          <span>
            <small>Download on the</small>
            App Store
          </span>
        </a>
      ) : (
        <span className="badge is-soon" aria-label="App Store: coming soon">
          <AppleIcon />
          <span>
            <small>Coming soon on the</small>
            App Store
          </span>
        </span>
      )}
    </div>
  );
}
