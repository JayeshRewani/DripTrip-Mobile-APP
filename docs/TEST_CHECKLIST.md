# DripTrip app — test checklist

Do **not** place real paid orders without the owner's approval. To test payments end-to-end,
enable a test gateway (Shopify Bogus Gateway or the payment provider's test mode) first.

Legend: **PASS** verified · **FAIL** broken · **PARTIAL** partly verified · **TODO** not yet run

Last run: 17 Oct 2026, release build 1.0.2 (versionCode 3), upload-key signed. Push code included; live FCM delivery needs owner Firebase + OneSignal credentials (see `docs/PUSH_NOTIFICATIONS.md`).

## Automated / build

| Check | Result | Notes |
| --- | --- | --- |
| TypeScript (`npm run typecheck`) | PASS | |
| Unit tests (`npm test`) | PASS | 38 tests: URL routing, HTTPS upgrade, checkout detection, bridge, notification URL extract, tab bar |
| Lint (`npm run lint`) | PASS | 0 errors, 1 warning (intentional `javascript:` URL in a test) |
| Release APK + AAB (`assembleRelease bundleRelease`) | PASS | |
| APK signature (`apksigner verify`) | PASS | v2, CN=DripTrip, SHA-256 `715C5814…D29C04` |
| AAB signature (`keytool -printcert -jarfile`) | PASS | Same upload certificate |
| 16 KB alignment (`zipalign -c -P 16 4`) | PASS | |
| Native debug symbols in AAB | PASS | `BUNDLE-METADATA/com.android.tools.build.debugsymbols/...` |
| Manifest | PASS | `com.driptrip.app`, minSdk 24, targetSdk 36, permissions: INTERNET, ACCESS_NETWORK_STATE, ACCESS_WIFI_STATE |
| iOS build | TODO | Needs macOS + Xcode |

## On emulator (Android 15 / API 35, Pixel 6 profile, release APK)

Screenshots are in `docs/screenshots/`. The Android 16.1 (API 36.1) Play Store emulator image
crash-looped in the system compositor (`surfaceflinger`) before the app was involved, so testing
was moved to API 35.

| # | Journey | Result | Screenshot |
| --- | --- | --- | --- |
| 1 | Cold start → storefront with native tab bar (2.7 s launch) | PASS | 01 |
| 2 | Shop tab → `/collections/all`, tab highlighted | PASS | 02 |
| 3 | Product page, add to cart → native Cart badge updates | PASS | 03b, 04, 20 |
| 4 | Back with "added to cart" popup open → popup closes, stays on product | PASS | 21 |
| 5 | Back from product → collection | PASS | 05 |
| 6 | Cart tab → cart page with totals | PASS | 06 |
| 7 | Checkout opens in-app, tab bar hidden | PASS | 07 |
| 8 | Back from checkout → cart | PASS | 08 |
| 9 | Account tab → native sheet | PASS | 09 |
| 10 | Delete my account → confirmation dialog (cancelled, no email sent) | PASS | 10 |
| 11 | Privacy policy opens in-app | PASS (but the policy content is wrong; see the Play checklist) | 11 |
| 12 | My account → login page | PASS | 12, 19 |
| 13 | "Login with Google" (Clevercat) | Hidden in-app. Before: opened Chrome, so the customer would be signed in to Chrome, not the app | 13, 19 |
| 14 | Offline → banner, then "You're offline" screen on navigation | PASS | 14, 25 |
| 15 | Back online → reloads automatically without tapping retry | PASS | 16 |
| 16 | Home button, then reopen → same page and state | PASS | 17 |
| 17 | WhatsApp button (`wa.me`) → opens outside the app | PASS | — |
| 18 | Back on Home → "Exit DripTrip?" prompt | PASS | 23 |
| 19 | Remove items → cart empty, badge cleared | PASS | 24 |
| 20 | No crashes in the `crash` log buffer, no `ReactNativeJS` errors | PASS | — |

## Still to test on a real phone (needs owner authorization for payments)

| # | Journey | Result |
| --- | --- | --- |
| 1 | Login with a real customer account, orders page, logout | TODO |
| 2 | Checkout: keyboard does not cover address fields | TODO |
| 3 | Discount code applies in checkout | TODO |
| 4 | UPI option opens GPay / PhonePe / Paytm and returns to the app | TODO (owner approval) |
| 5 | Card payment / 3-D Secure page loads | TODO (owner approval) |
| 6 | Order confirmation page → "Continue shopping" | TODO |
| 7 | Tablet / foldable layout (Android 16 ignores the portrait lock there) | TODO |
| 8 | Install from Play internal testing track | TODO |

## How to run

```bash
npm start           # Metro (debug builds only)
npm run android     # build + install debug on connected phone
```

Or install `DripTrip-share.apk` directly (no Metro needed).
