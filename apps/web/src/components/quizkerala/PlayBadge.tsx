import { QUIZKERALA } from "@/lib/quizkerala/content";
import { LIVE_ON_PLAY } from "@/lib/play-store";

const PACKAGE = "com.calecutech.quizkerala";

/**
 * Google's official "Get it on Google Play" badge once the listing is live;
 * until then a plain "Coming soon on Google Play" label.
 */
export function PlayBadge() {
  if (!LIVE_ON_PLAY.has(PACKAGE)) {
    return (
      <span className="play-soon" aria-label="QuizKerala: coming soon on Google Play">
        <small>Coming soon on</small>
        <strong>Google Play</strong>
      </span>
    );
  }
  return (
    <a className="play-badge" href={QUIZKERALA.playStoreUrl} target="_blank" rel="noopener">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/badges/google-play-en.svg" alt="Get it on Google Play" height={52} />
    </a>
  );
}
