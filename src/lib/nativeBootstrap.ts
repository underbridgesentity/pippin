// Native-only startup chrome (status bar, splash). No-op on the web build.
import { isNative } from './platform'

export async function nativeBootstrap(): Promise<void> {
  if (!isNative) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    // overlay:false makes iOS reserve the status-bar strip so the webview starts
    // below the notch; our existing top paddings then line up with zero CSS work.
    await StatusBar.setOverlaysWebView({ overlay: false })
    // Dark glyphs read well on the light Daylight background.
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    /* status-bar plugin unavailable; ignore */
  }
}

// Hide the launch splash once React has painted the first screen.
export async function hideNativeSplash(): Promise<void> {
  if (!isNative) return
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch {
    /* splash plugin unavailable; ignore */
  }
}
