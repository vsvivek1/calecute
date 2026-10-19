import { livePlayUrl } from "@/lib/play-store";

/**
 * Google's official "Get it on Google Play" badge when the app is live, or a
 * plain "Coming soon on Google Play" chip when it is not.
 *
 * Google's badge guidelines: use the artwork unmodified, keep it at least as
 * tall as other store badges, and link it only to a live listing. So the
 * coming-soon state is our own chip, never a greyed-out copy of the badge.
 */
export function GooglePlayBadge({
  androidPackage,
  appName,
  size = "md",
  tone = "auto",
  className = "",
}: {
  androidPackage?: string;
  appName: string;
  size?: "sm" | "md";
  /** "light" for pages that stay light in dark mode, like History Clock's paper. */
  tone?: "auto" | "light";
  className?: string;
}) {
  const url = livePlayUrl(androidPackage);
  const height = size === "sm" ? "h-10" : "h-14";

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener"
        aria-label={`Get ${appName} on Google Play`}
        className={`inline-block shrink-0 rounded-[9px] focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/badges/google-play-en.svg" alt="Get it on Google Play" className={`${height} w-auto`} />
      </a>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2.5 rounded-[9px] border border-dashed border-black/30 px-3 text-black/70 ${tone === "auto" ? "dark:border-white/30 dark:text-white/70" : ""} ${height} ${className}`}
      aria-label={`${appName}: coming soon on Google Play`}
    >
      <PlayMark className={size === "sm" ? "h-4 w-4" : "h-6 w-6"} />
      <span className="flex flex-col leading-tight">
        <span className={size === "sm" ? "text-[9px] uppercase tracking-wide" : "text-[11px] uppercase tracking-wide"}>
          Coming soon on
        </span>
        <span className={size === "sm" ? "text-sm font-semibold" : "text-lg font-semibold"}>Google Play</span>
      </span>
    </span>
  );
}

function PlayMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`${className} opacity-70 grayscale`}>
      <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Z" />
      <path fill="#FBBC04" d="m17.3 8.5-3.5 3.5 3.5 3.5 3.9-2.2c1.1-.6 1.1-2 0-2.6l-3.9-2.2Z" />
      <path fill="#4285F4" d="M13.8 12 3.6 22.2c.4.2.9.2 1.4-.1l12.3-6.6-3.5-3.5Z" />
      <path fill="#EA4335" d="M13.8 12 17.3 8.5 5 1.9c-.5-.3-1-.3-1.4-.1L13.8 12Z" />
    </svg>
  );
}
