'use client';

// Read a card aloud with the device's text-to-speech.

import { IS_APP } from '../env';

export const canSpeak = () => IS_APP || (typeof window !== 'undefined' && 'speechSynthesis' in window);

export async function speak(text: string) {
  try {
    if (IS_APP) {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      await TextToSpeech.stop();
      await TextToSpeech.speak({ text, lang: 'en-US', rate: 1.0 });
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  } catch {}
}

export async function stopSpeaking() {
  try {
    if (IS_APP) {
      const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
      await TextToSpeech.stop();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}
