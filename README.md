# DripTrip (React Native CLI)

Native Android/iOS shell that loads the live Shopify storefront  
**https://www.driptrip.in** inside a full-screen `react-native-webview`.

No Expo. No custom checkout. Shopify remains the source of truth.

## Stack

- React Native **0.87** (CLI)
- TypeScript
- `react-native-webview`
- `react-native-safe-area-context`
- `@react-native-community/netinfo`

## Identifiers

| Platform | ID |
| --- | --- |
| Android `applicationId` | `com.driptrip.app` |
| iOS bundle ID | `com.driptrip.app` |
| Display name | `DripTrip` |

## Prerequisites

- Node.js ≥ 22.11
- JDK 17+
- Android Studio + SDK / emulator **or** a USB device with USB debugging
- For iOS: macOS + Xcode + CocoaPods

## Install

```bash
cd D:\driptrip-modile-app
npm install
```

iOS only (on macOS):

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

## Run

```bash
# Terminal 1
npm start

# Terminal 2 — Android
npm run android

# iOS (macOS)
npm run ios
```

## Release builds

### Android debug APK (local)

```bash
cd android
.\gradlew.bat assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Android release APK / AAB

Release builds are signed with the DripTrip upload key:

- `android/app/driptrip-upload.keystore`
- `android/keystore.properties` (store/key passwords)

Both files are gitignored. **Back them up somewhere safe (password manager / private drive).**
If they are lost you cannot ship updates to the same Play Store listing.
Without `keystore.properties`, release builds fall back to the debug key (OK for sideloading only).

```bash
cd android
.\gradlew.bat assembleRelease bundleRelease
```

Outputs:

- APK (share / sideload): `android/app/build/outputs/apk/release/app-release.apk`
- AAB (Play Store upload): `android/app/build/outputs/bundle/release/app-release.aab`

Before each Play Store upload, bump `versionCode` (and `versionName`) in `android/app/build.gradle`.

### iOS

Open `ios/DripTrip.xcworkspace` in Xcode, set signing team, then Archive for TestFlight / App Store.

## Project layout

```
App.tsx
src/
  config/store.ts          store URL, links, support contacts, allowed hosts
  utils/navigation.ts      URL classification (allow / external / native / https upgrade)
  utils/bridge.ts          read-only page→app messages (cart count, back press)
  notifications/onesignal.ts  OneSignal init, permission, open→URL
  components/
    StoreWebView.tsx       WebView, back handling, offline/lifecycle, error recovery
    TabBar.tsx, TabIcons.tsx  native bottom tabs with cart badge
    MoreSheet.tsx          account, notifications toggle, delete-account, policies
    NotificationPrompt.tsx soft-ask before system permission
    LoadingOverlay.tsx
    ErrorScreen.tsx
android/
ios/
docs/
  PLAY_STORE_CHECKLIST.md  Play Console manual steps + policy risks
  PRIVACY_POLICY_ADDENDUM.md  fixes the store owner must make to the privacy policy
  PUSH_NOTIFICATIONS.md    OneSignal / Firebase setup and how to send campaigns
  TEST_CHECKLIST.md        latest test results
```

## Checks

```bash
npm run typecheck
npm test
npm run lint
```

## Web ↔ app bridge

Storefront pages can only send two read-only messages (`cart` count and `back` result).
Messages are accepted only from `driptrip.in` / `www.driptrip.in`, are size-limited and
schema-checked in `src/utils/bridge.ts`, and cannot trigger navigation or any native action.

## Push notifications

Uses OneSignal (FCM on Android). The store owner writes message text in the OneSignal dashboard;
tap can open a trusted store URL in the WebView. Soft-ask + Account toggle for consent.

1. Add `android/app/google-services.json` from Firebase.
2. Set `ONESIGNAL_APP_ID` in `src/config/store.ts`.
3. Follow `docs/PUSH_NOTIFICATIONS.md` to send a test campaign.

## Navigation rules

- Top-level pages on `driptrip.in`, Shopify, and listed payment hosts stay in the app.
- Iframes (Shopify card fields, reviews, videos) always load; only top-level navigations are gated.
- `upi://`, `intent://` and other app links open the payment app (UPI apps, Play Store fallback).
- `tel:` / `mailto:` open the dialer / mail app; other websites open in the system browser.
- If a payment provider page gets bounced to the browser, add its domain to
  `TRUSTED_HOST_SUFFIXES` in `src/config/store.ts`.

## Branding

App icons are generated from the store logo (`branding/driptrip-logo.png`):

```bash
powershell -ExecutionPolicy Bypass -File branding\make-icons.ps1
```

The store logo is only ~194 px tall, so the 1024 px App Store icon is upscaled;
use a high-resolution original for the store listing if available.

## Notes

- Theme was inspected only; production Shopify theme is unchanged.
- Customer login uses classic Shopify accounts (`/account/login`), which stays inside the app.
  The Clevercat "Login with Google" button is hidden in the app because Google blocks OAuth in WebViews.
- Every Play upload needs a higher `versionCode` (`android/app/build.gradle`); keep `APP_VERSION`
  in `src/config/store.ts` in sync with `versionName`.
