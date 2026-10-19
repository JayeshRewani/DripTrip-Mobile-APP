# Push notifications — DripTrip (OneSignal)

The app can show system push notifications for offers and updates. **You write the message text in
the OneSignal dashboard** — it is not hard-coded in the app. Opening a notification can open a store
URL inside the WebView (product, collection, cart, home).

Code is ready. Delivery stays off until you finish the one-time Firebase + OneSignal setup below and
paste the App ID into the project.

## One-time setup (owner / developer)

### 1. Firebase (Android FCM)

1. Open [Firebase Console](https://console.firebase.google.com/) → Create project (or use an existing one).
2. Add an **Android** app with package name `com.driptrip.app`.
3. Download `google-services.json` and place it at:

   `android/app/google-services.json`

   (This file is gitignored. A template lives at `android/app/google-services.json.example`.)

4. In Firebase → Project settings → Cloud Messaging, keep the Default FCM API (V1) enabled.
   OneSignal will ask you to upload a Firebase service account JSON (Server credentials) when you
   connect Android — follow OneSignal’s wizard.

### 2. OneSignal

1. Create an account at [onesignal.com](https://onesignal.com) → New App/Website → **DripTrip**.
2. Choose **Google Android (FCM)** and connect the Firebase project from step 1.
3. Copy the **OneSignal App ID** from Settings → Keys & IDs.
4. Paste it into [src/config/store.ts](../src/config/store.ts):

```ts
export const ONESIGNAL_APP_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

5. Rebuild the release APK/AAB after changing the App ID or `google-services.json`.

Do **not** put the OneSignal REST API key in the app. That key is only for the dashboard and for
Phase 2 automation servers.

### 3. Privacy / Play

- Add the “Push notifications” section from `docs/PRIVACY_POLICY_ADDENDUM.md` to the live Shopify policy.
- In Play Console Data safety, declare device IDs shared with OneSignal and Google FCM for notifications.

## How you send a message (day to day)

1. Log into OneSignal → select **DripTrip**.
2. **Messages → New Push** (or New Message → Push).
3. Fill **Title** and **Message** (this is what customers see).
4. Optional: add an image (Android rich notification).
5. **Audience:** All Subscribed Users, or a segment.
6. **Launch URL** (recommended): a store HTTPS link, e.g.  
   `https://www.driptrip.in/collections/all`  
   or a product URL. The app only opens trusted hosts (driptrip.in / Shopify / payment hosts).
   You can also set Additional Data key `url` to the same link.
7. Send now or **Schedule**.
8. Check delivery and click stats on the same campaign.

### Test on your phone

1. Install a build that has the real App ID + `google-services.json`.
2. Open the app → allow notifications on the soft-ask (or Account → Push notifications ON).
3. In OneSignal, open Audience → find your device (or use **Send to Test Device** after sharing the
   OneSignal subscription / player id from Logcat in a debug build).
4. Send a test push with Launch URL `https://www.driptrip.in/`.
5. Background the app, receive the banner, tap it → app should open that page.

Without App ID / `google-services.json`, the app still builds and runs; the soft-ask and Account
toggle stay inactive / show “Not configured yet”.

## What customers control

| Action | Where |
|---|---|
| Allow or decline first ask | Soft-ask sheet after first load |
| Turn on/off later | Account tab → Push notifications |
| System deny | Phone Settings → Apps → DripTrip → Notifications |

## App behaviour (for developers)

| Piece | Role |
|---|---|
| `src/notifications/onesignal.ts` | Init, permission, opt-in/out, URL extract from click |
| `src/components/NotificationPrompt.tsx` | Soft-ask UI |
| `src/components/MoreSheet.tsx` | Account toggle |
| `App.tsx` | Init, soft-ask timing, click → `StoreWebView.navigate` |
| `POST_NOTIFICATIONS` | Android 13+ permission in the manifest |

Click URLs are validated with `isTrustedHost` / `classifyNavigation` before navigation.

## Phase 2 — automatic order status (not built yet)

Marketing pushes (Phase 1) need no server. Order updates need a small bridge:

```text
Shopify order/fulfillment webhook
  → Cloudflare Worker / Cloud Function / Zapier / Make
  → OneSignal REST API (use the REST key only on the server)
  → push to the customer’s device
```

Requirements for reliable targeting:

1. When a customer signs in on `/account`, tag OneSignal with an external id (Shopify customer id
   or email) via `OneSignal.login(externalId)` — requires a trusted bridge message from the
   storefront after login (not implemented yet).
2. Guest checkout has no stable app identity; guests only get broadcast / segment marketing unless
   you later collect an email → OneSignal alias.
3. Keep order-template copy in OneSignal or the automation tool; Shopify only fires the event.

Until Phase 2 ships, use Shopify’s normal order emails for transactional updates.

## Checklist before the first real campaign

- [ ] `google-services.json` in `android/app/`
- [ ] `ONESIGNAL_APP_ID` set in `src/config/store.ts`
- [ ] Privacy policy push section published on driptrip.in
- [ ] Play Data safety updated for OneSignal / FCM
- [ ] Test push received on a real phone
- [ ] Launch URL opens the correct page in the app
