/** True in the Capacitor (Android) build. Fixed at build time. */
export const IS_APP = process.env.NEXT_PUBLIC_IS_APP === '1';

/** Where the licence and question API lives. Same origin on the web. */
export const API = IS_APP ? (process.env.NEXT_PUBLIC_API_ORIGIN ?? 'https://pmp.calecutech.com') : '';

export const PRICE_LABEL = '$39';
