'use client';

import { useEffect, useState } from 'react';
import { canSpeak, speak, stopSpeaking } from '@/lib/platform/speech';

/** Reads the card aloud with the device voice. */
export default function SpeakButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(canSpeak());
    return () => void stopSpeaking();
  }, []);
  if (!ok) return null;
  return (
    <button className="icon-btn" aria-label="Read aloud" title="Read aloud" onClick={() => speak(text)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 5a10 10 0 0 1 0 14" />
      </svg>
    </button>
  );
}
