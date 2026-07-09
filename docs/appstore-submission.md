# Pippin — App Store Submission Pack

Everything to paste into App Store Connect (ASC) and the exact steps only you can do.
Bundle ID: **za.co.pippin.app** · Version **1.0.0** · Build **1**

---

## 0. Reviewer demo account (solves Guideline 2.1)

A real, populated account is live in production for Apple's reviewers.

- **Email:** `appreview@pippin.co.za`
- **Password:** `PippinReview2026`

It has a logged meal, water, XP, a streak, and a badge so the reviewer sees a working app.
Put these in ASC under **App Review Information → Sign-In required → Username / Password**.
(Keep Supabase email-confirmation OFF, as it is now, so the login works instantly.)

---

## 1. App information

| Field | Value |
|---|---|
| **Name** (max 30) | `Pippin` (fallback if taken: `Pippin: Healthy Habits`) |
| **Subtitle** (max 30) | `The fun way to get healthy` |
| **Primary category** | Health & Fitness |
| **Secondary category** | Lifestyle |
| **Bundle ID** | za.co.pippin.app |
| **Primary language** | English (South Africa) or English (U.S.) |

### URLs
- **Support URL:** `https://www.pippin.co.za/support.html`
- **Marketing URL:** `https://www.pippin.co.za`
- **Privacy Policy URL:** `https://www.pippin.co.za/privacy.html`

### Keywords (max 100 chars, comma-separated, no spaces)
```
calorie,counter,meal,food,diet,nutrition,tracker,steps,fitness,habit,streak,weight,wellness,mascot
```

### Promotional text (max 170, updatable anytime without review)
```
Snap your meals, keep your streak, and grow Pip from a seed to a legend. The fun, friendly way to build healthy habits with friends.
```

### Description (max 4000)
```
Pippin is the fun way to get healthy, with a little green friend cheering you on the whole way.

Snap a photo of your meal and Pippin estimates the calories in seconds. Keep a daily streak, earn XP and badges, take on challenges, and watch your mascot Pip grow from a tiny seed into a legend. Team up with friends to stay accountable and celebrate every win, big or small.

WHAT YOU CAN DO
- Snap and track meals: point your camera at your plate for an instant calorie estimate, or log foods manually.
- Build streaks: show up each day and keep your streak alive.
- Earn XP and badges: every healthy choice levels up Pip.
- Take on challenges: sugar detox, step goals, and more.
- Move more: log walks, runs, workouts, and steps.
- Stay accountable with friends: add friends, cheer each other on, and race a private leaderboard.
- Daily check-in: water, sleep, and mood in a tap.

MEET PIP
Pip is your green fruit companion who grows as you build healthy habits, from Seed to Sprout to Bloomer to Legend. The healthier your week, the happier Pip.

Pippin is a health and wellness tracker to help you build better habits. It is not a medical device and does not provide medical advice. Calorie estimates are guidance, not exact measurements.
```

### What's New (for v1.0.0)
```
The first Pippin. Snap meals, keep streaks, earn badges, and grow Pip. We would love your feedback.
```

---

## 2. App Privacy (the "nutrition label" questionnaire)

Answers mirror `ios/App/App/PrivacyInfo.xcprivacy`.

- **Do you or your partners use data to track the user?** No.
- **Data collected — all "Linked to you", none "Used to track", purpose "App Functionality":**

| Category | Type |
|---|---|
| Contact Info | Email Address, Name |
| User Content | Photos or Videos (meal photos), Other User Content (posts, comments) |
| Health & Fitness | Fitness (calories, activity, steps) |
| Identifiers | User ID |

- No advertising, no analytics/tracking SDKs, no data sold.
- Third parties that process data (as operators): Supabase (auth, DB, storage), Google Gemini (meal-photo + coaching analysis), Resend (transactional email). All disclosed in the privacy policy.

---

## 3. App Review notes (paste into App Review Information → Notes)

```
Pippin is a health and wellness habit tracker. Sign in with the demo account provided.

To exercise core features:
- HOME: shows today's calories, streak, XP, and a daily check-in.
- LOG A MEAL: tap the green camera button in the tab bar. On device this opens the camera to photograph a meal for an AI calorie estimate; you can also tap "Log without photo" to add foods manually.
- CHALLENGES: tap "Challenges" to view daily goals and join a challenge.
- SQUAD: social features (friends, private leaderboard). A fresh account has no friends yet; tap "Find friends" to search.
- PROFILE ("You"): mascot, level, badges, and Settings (including Delete Account).

Account deletion: Settings > Delete account permanently erases the account and all data.
Notifications: an optional daily streak reminder (local notification).
This is not a medical app; calorie values are AI estimates and guidance only.
```

---

## 4. Screenshots

Apple requires **6.7-inch** (1290 x 2796) and accepts **6.9-inch** (1320 x 2868). Capture each screen from the
**iOS Simulator** (iPhone 16 Pro Max) signed in as the demo account (`appreview@pippin.co.za`), for crisp,
exact dimensions, then add the caption over each per the layout spec below.

### The 5 screenshots, in order (screenshot 1 is the most important, it shows in search)

| # | Screen | Headline (Bricolage, bold) | Subhead (Hanken) |
|---|---|---|---|
| 1 | **Home** (calorie ring, streak, XP) | The fun way to get healthy | Meals, streaks, and steps, all in one tap. |
| 2 | **Meal capture / food log** | Just snap your meal | Pip estimates the calories in seconds. |
| 3 | **Challenges** | Take on challenges | Earn badges and brag about it forever. |
| 4 | **Profile / Pip** | Grow Pip from seed to legend | Every healthy choice levels you up. |
| 5 | **Squad** | Stronger with your squad | Cheer friends on and climb the leaderboard. |

Alt headline for #1 if you prefer benefit-first: "Your day, counted."

### Layout spec (keep all 5 consistent)
- **Canvas:** 1290 x 2796 (also export 1320 x 2868 if you want the 6.9" set).
- **Background:** warm cream `#F1EDE4`. For variety, give #3 and #5 a soft green wash (`#E7F6EC`).
- **Caption block:** top ~16-20% of the frame, centered. Headline Bricolage Grotesque ~76px `#231E16`;
  subhead Hanken Grotesk ~36px `#736D60`, one line below.
- **Device:** the screen capture centered below the caption, in a rounded frame (corner radius ~64px) with a
  soft diffuse shadow, OR full-bleed and bottom-anchored. Same treatment on every panel.
- Keep Pip visible on #1 and #4 (he already is). No text over the phone content.
- Tools: iOS Simulator for the captures, then Figma / Keynote / Fastlane frameit to add the caption frames.

---

## 5. Version / build metadata

- **Version:** 1.0.0, **Build:** 1
- **Export compliance:** No (uses only standard encryption; `ITSAppUsesNonExemptEncryption` is set to false in Info.plist, so ASC should not ask again).
- **Content rights:** You own or are licensed for all content. No third-party paid content.
- **Age rating:** likely **12+** because of user-generated content + social. See the UGC note below; the exact rating depends on the UGC moderation answers.

---

## 6. What only YOU can do (Apple-side, I cannot)

Because these need your Apple ID, 2FA, legal acceptance, or code-signing on your Mac:

1. **Apple Developer portal:** register the App ID `za.co.pippin.app` (enable no special capabilities for v1).
2. **App Store Connect:** create the app record, accept the Apple Developer Program License Agreement and (free) app agreements.
3. **Xcode (on your Mac):** `npx cap open ios` → select your Team under Signing & Capabilities → set the bundle id → build to a real device to test → Archive → upload the build (or use Transporter).
   - Confirm `PrivacyInfo.xcprivacy` is included in the App target (drag it into the target if Xcode did not add it).
4. Paste all the copy above, upload screenshots, answer App Privacy, add the reviewer account, then **Submit for Review**.

---

## 7. UGC moderation (Guideline 1.2) — BUILT + LIVE

Pippin has a community feed + friends (user-generated content), so Apple requires report + block. Implemented and verified live end to end:
- **Report post** and **Block {user}** in the post thread (tap a post → options menu).
- Reporting records the post (post_reports) and emails you (info@underbridges.co.za) via the `report-post` Edge Function, then hides it from the reporter.
- Blocking hides all of that user's posts from you (blocks table + feed filtering); persists across sessions.
- Support contact + EULA covered by the support page and privacy policy.

**Schema applied** (post_reports + status, blocks, and the `private.report_queue` view are live). Verified:
Bea reported and blocked Alex, the report showed in `private.report_queue`, the email fired, and the block
kept Alex's post hidden after reload. Test data cleaned up.

**Moderating reports:** run `select * from private.report_queue;` in the Supabase SQL editor. Remove a post by
deleting its row (reports cascade away); ban a user under Authentication > Users. No custom admin app needed.
```
