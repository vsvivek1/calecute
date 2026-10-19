import type { CapacitorConfig } from '@capacitor/cli';

// The Android app bundles the static export in `out/` and calls the web
// deployment for licences and the question bank (NEXT_PUBLIC_API_ORIGIN).
const config: CapacitorConfig = {
  appId: 'com.calecutech.pmpprep',
  appName: 'PMP Prep',
  webDir: 'out',
  android: {
    backgroundColor: '#f7f8fb',
  },
};

export default config;
