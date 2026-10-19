# Google Play publication checklist — DripTrip (com.driptrip.app)

Google Play approval is **not guaranteed**. This list covers what the app does today, the
known policy risks, and everything that must be done by hand in Shopify admin and Play Console.

## 1. Policy risk: website-only WebView app

| Policy | Status | Notes |
|---|---|---|
| Spam / webview of a site you don't own | Low risk | The app only wraps `driptrip.in`, which the developer owns. Use the same owner identity (business name, email, website) in Play Console so ownership is obvious. |
| Minimum / Limited functionality | **Main risk** | Reviewers reject apps that are "just a website". Native features added to reduce this risk are listed below. They do not guarantee approval. |
| Impersonation / IP | Low | Use only DripTrip's own logo, name and screenshots. |

Native functionality currently in the app:

- Native bottom tab bar (Home, Shop, Search, Cart with a live item-count badge, Account). It hides during checkout and payment pages and while the keyboard is open.
- A native Account sheet with account and order links, an **in-app account deletion request**, support email and phone, sharing the current page through the system share sheet, and links to the privacy, terms, refund and shipping policies.
- Android back button: closes the theme's cart drawer, menu, search or modal first, then goes back through history, then to Home, then asks before exiting.
- Native loading screen, page progress bar, offline banner, an error screen with retry, and automatic retry when the connection returns or the app resumes.
- Recovery when the WebView renderer crashes (Android) or its process is killed (iOS).
- UPI, `intent://`, `tel:`, `mailto:` and other external links are handed to the right app or the system browser.

Native push (Phase 1) is implemented via OneSignal + FCM. The owner must still create Firebase /
OneSignal accounts and paste the App ID + `google-services.json` — see `docs/PUSH_NOTIFICATIONS.md`.

Further candidates that would reduce Limited Functionality risk:

1. Automatic order-status pushes (Phase 2: Shopify webhook → OneSignal API). Documented but not wired.
2. A native wishlist or recently-viewed list stored on the device.
3. A native product search screen using Shopify's public Storefront API (needs a public Storefront access token; never use the Admin token).
4. Deep links / Android App Links for `https://www.driptrip.in/*` (needs `assetlinks.json` on the domain, which is a theme or hosting change that needs owner approval).

If Play rejects the app under Minimum Functionality after push is live, item 3 is the usual next step.

## 2. Blocking items for the store owner (Shopify admin, no app change)

- [ ] **Fix the privacy policy.** `https://www.driptrip.in/policies/privacy-policy` is currently an
      unfilled template. It names **www.warriortribe.in** and contains about 24 `[PLACEHOLDER]` blocks,
      e.g. `[email address]` and `[DATE]`. Play will reject or suspend an app whose policy is
      incomplete or names another business. Use `docs/PRIVACY_POLICY_ADDENDUM.md` as a starting point and
      edit it in *Settings → Policies → Privacy policy*.
- [ ] **Create a public account-deletion page**, e.g. *Online Store → Pages → "Delete your account"*
      (`/pages/delete-account`). It must explain how to request deletion (email Veejay@driptrip.in from
      the account's email address), what data is deleted, and what is kept and for how long. Play
      Console requires this URL because customers can create accounts.
- [ ] Check that the terms of service, refund, shipping and contact policies are filled in. The app links to all of them.
- [ ] The store's Shopify domain is still `warriortribe-in.myshopify.com`. That is fine technically, but make
      sure no customer-facing text (policies, emails, checkout name) still says WarriorTribe.
- [ ] Checkout shows **"Email me with news and offers" pre-ticked**. Pre-ticked marketing consent is a
      problem under India's DPDP Act and GDPR. Untick it by default in *Settings → Checkout → Marketing options*.
- [ ] **Google login (Clevercat app):** Google blocks sign-in inside embedded WebViews, and the button opened
      Chrome, signing customers in there instead of in the app. The app now hides that button, so
      email/password login and guest checkout still work. If Google login is important, it needs
      a Custom Tabs + deep-link return flow supported by Clevercat; ask them.
- [ ] Decide who answers deletion emails and how fast. Aim for under 30 days, and document this on the page.

## 3. Play Console — manual steps

### Account and app

- [ ] Developer account: an **organization** account is recommended (D-U-N-S number needed). New *personal*
      accounts must run a **closed test with at least 12 testers for 14 continuous days** before production access.
- [ ] Create the app: name *DripTrip*, default language, App (not Game), Free.
- [ ] Turn on **Play App Signing** (default) and upload `DripTrip-playstore.aab`. Play keeps the app
      signing key; our key is the *upload key*.

### App content (Policy → App content)

- [ ] **Privacy policy URL:** `https://www.driptrip.in/policies/privacy-policy` (only after it is fixed).
- [ ] **App access:** "All or some functionality is restricted" → No login is needed to browse. Shopping and
      checkout work as a guest. If reviewers need an account, provide a test customer login
      (do not use a real customer).
- [ ] **Ads:** "No, my app does not contain ads". The storefront shows no ad network inventory.
      The Google Ads / Meta pixels are conversion tracking, not ads, but they still go in Data safety.
- [ ] **Content rating:** complete the IARC questionnaire (shopping, no user-generated content, no gambling).
- [ ] **Target audience:** 18+ (or 13+ if appropriate). Do **not** target children.
- [ ] **News app:** No. **COVID / health:** No. **Government:** No. **Financial features:** No
      (the app does not provide financial services; payments go through Shopify Checkout).
- [ ] **Account deletion:** "Yes, users can create accounts". Enter the deletion page URL from section 2.
      The in-app path is *Account tab → Delete my account*.
- [ ] **Data safety** (answer based on the storefront loaded inside the app):

| Data type | Collected | Shared | Purpose | Source in the WebView |
|---|---|---|---|---|
| Name, email, phone, address | Yes | Yes (Shopify, payment and shipping providers) | Account management, app functionality (orders) | Shopify checkout and customer account |
| Purchase history | Yes | Yes (Shopify) | App functionality, analytics | Shopify |
| Payment info | Collected by Shopify / payment providers, not by the app | — | Payments | Shopify Checkout, Razorpay/UPI etc. |
| App interactions / pages viewed | Yes | Yes (Google, Meta, Clevercat) | Analytics, advertising/marketing | Google Analytics, GTM, Google Ads, Meta Pixel, Clevercat ads pixel (`ads.clevercat.ai`), Shopify analytics |
| Device or other IDs (cookies) | Yes | Yes (Google, Meta, Clevercat) | Analytics, advertising/marketing | Same trackers |
| Device or other IDs (push token / OneSignal subscription) | Yes, if the user allows notifications | Yes (OneSignal, Google FCM) | App functionality, advertising/marketing (offers) | OneSignal SDK + FCM |
| Product reviews / photos the customer submits | Yes, if they review | Yes (Loox) | App functionality | Loox reviews widget |
| Approximate location (from IP / address) | Yes | Yes | App functionality (shipping, currency) | Shopify |

  - Data is encrypted in transit: **Yes** (HTTPS only; cleartext is disabled in the app).
  - Users can request deletion: **Yes** (in-app and through the web page).
  - Re-check the list against the trackers enabled in *Shopify → Settings → Customer privacy* and
    installed apps before submitting. Data safety answers must match reality.
  - After push is configured, also declare **OneSignal** and **Google Firebase Cloud Messaging** as
    data processors / shared parties for device IDs used for notifications.
- [ ] **Permissions declared:** INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE (from NetInfo),
      and **POST_NOTIFICATIONS** (Android 13+). Declare notifications in Play Console App content
      if asked; the in-app soft-ask + Account toggle document purpose.

### Store listing

- [ ] Short description (max 80 characters) and full description (max 4000). Describe the native features. Avoid
      claims like "best" or "#1" and keyword stuffing.
- [ ] App icon 512×512 PNG: `branding/icon-1024.png`, resized.
- [ ] Feature graphic 1024×500 PNG.
- [ ] At least 2 phone screenshots (recommended 4–8, 1080×1920 or larger), taken from the real app.
      Optional: 7" and 10" tablet screenshots.
- [ ] Contact details: email Veejay@driptrip.in, website https://www.driptrip.in, phone (optional).
- [ ] Category: Shopping. Tags as relevant.

### Release

- [ ] Start with **Internal testing** and install from Play on a real device. Test the flows in
      `docs/TEST_CHECKLIST.md`, including one real low-value order paid with UPI and with a card **only
      if the owner authorizes it**.
- [ ] Then use Closed testing (required for new personal accounts), then Production with a staged rollout (e.g. 20%).
- [ ] Release notes for each version.
- [ ] Check the **pre-launch report** (automatic Firebase Test Lab run) for crashes, accessibility and security warnings.

## 4. Technical facts verified in this repo

| Item | Value |
|---|---|
| Package ID | `com.driptrip.app` (permanent once published) |
| versionCode / versionName | 2 / 1.0.1. Increase versionCode for every upload (`android/app/build.gradle`). |
| minSdk / targetSdk / compileSdk | 24 / 36 / 37. Target 36 meets the Aug 31, 2026 requirement for new apps and updates. |
| Signing | Upload key `android/app/driptrip-upload.keystore` via `android/keystore.properties` (both gitignored). `bundleRelease` now **fails** if the keystore config is missing, instead of silently using the debug key. |
| Native debug symbols | `ndk.debugSymbolLevel = SYMBOL_TABLE`, so symbols are included in the AAB for Play crash reports. |
| 16 KB page size | Checked with `zipalign -c -P 16` on the release APK. |
| Cleartext traffic | Disabled (`usesCleartextTraffic=false`). Trusted `http://` links are upgraded to HTTPS. |
| Backups | `allowBackup=false` (cookies and session are not backed up). |

**Back up the upload keystore and `keystore.properties` somewhere safe (e.g. a password manager plus an
offline copy).** If the upload key is lost, Play support can reset it, but this takes days.

## 5. Known limitations and on-device tests still to do

- Checkout payment steps (address, UPI app hand-off, card 3-D Secure, Razorpay) cannot be tested without
  entering an address and attempting a payment. This needs explicit owner authorization.
- Shopify customer accounts: login was checked to load. A real login with a customer account was not tested.
- Android 16 ignores `screenOrientation="portrait"` on large screens (tablets and foldables). The storefront is
  responsive, but test on a tablet emulator before advertising tablet support.
- iOS was not built here (needs macOS/Xcode). App Store review guideline 4.2 (minimum functionality) is
  stricter than Play's.
