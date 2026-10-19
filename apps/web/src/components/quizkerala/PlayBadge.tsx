import { QUIZKERALA } from "@/lib/quizkerala/content";

/** Google's official "Get it on Google Play" badge, linking to the store listing. */
export function PlayBadge() {
  return (
    <a className="play-badge" href={QUIZKERALA.playStoreUrl} target="_blank" rel="noopener">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/badges/google-play-en.svg" alt="Get it on Google Play" height={52} />
    </a>
  );
}
