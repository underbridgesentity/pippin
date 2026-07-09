// Daily streak reminder via native local notifications (no-op on web). This is
// one of the two native capabilities (with the camera) that make the iOS build
// more than a wrapped website.
import { isNative } from './platform'

const REMINDER_ID = 4200

// Request permission (once) and schedule a daily 19:00 nudge to log meals.
// Idempotent: safe to call on every launch and after onboarding.
export async function ensureStreakReminder(): Promise<void> {
  if (!isNative) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const perm = await LocalNotifications.requestPermissions()
    if (perm.display !== 'granted') return
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
    await LocalNotifications.schedule({
      notifications: [
        {
          id: REMINDER_ID,
          title: 'Keep your streak alive 🔥',
          body: "Snap today's meals so Pip keeps growing.",
          schedule: { on: { hour: 19, minute: 0 }, allowWhileIdle: true },
        },
      ],
    })
  } catch {
    /* notifications unavailable or denied; ignore */
  }
}

export async function cancelStreakReminder(): Promise<void> {
  if (!isNative) return
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  } catch {
    /* ignore */
  }
}
