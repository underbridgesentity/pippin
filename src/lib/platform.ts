// Platform detection for the native (Capacitor) vs web builds.
//
// On the web SPA these all resolve to the web branch, so nothing changes for
// existing users. Native-only behaviour (skipping the marketing Landing, native
// camera, status-bar chrome, local notifications) keys off `isNative`.
import { Capacitor } from '@capacitor/core'

export const isNative = Capacitor.isNativePlatform()
export const isNativeIOS = isNative && Capacitor.getPlatform() === 'ios'

// Where auth redirects (password reset, any future OAuth) should land. Inside
// the native webview window.location.origin is capacitor://localhost, which an
// email link cannot reopen, so native points back at the real website.
export const PUBLIC_WEB_ORIGIN = 'https://www.pippin.co.za'
