import type { CapacitorConfig } from '@capacitor/cli'

// Native iOS wrapper for the Pippin web app. We ship the bundled `dist` build
// (no server.url) so the app works offline and is not a thin web-wrapper.
const config: CapacitorConfig = {
  appId: 'za.co.pippin.app',
  appName: 'Pippin',
  webDir: 'dist',
  backgroundColor: '#F1EDE4',
  ios: {
    // Let our own safe-area handling manage insets rather than Capacitor.
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      backgroundColor: '#F1EDE4',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'native',
    },
  },
}

export default config
