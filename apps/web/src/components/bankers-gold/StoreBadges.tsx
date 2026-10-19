import { BANKERS_GOLD } from "@/lib/bankers-gold/content";

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

/** Google Play (official badge, live link) and App Store (coming soon until an iOS build ships). */
export function StoreBadges() {
  return (
    <div className="badges">
      {/* Google's official badge artwork, unmodified, as its brand guidelines require. */}
      <a className="play-badge" href={BANKERS_GOLD.playStoreUrl} target="_blank" rel="noopener">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badges/google-play-en.svg" alt="Get it on Google Play" height={52} />
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
