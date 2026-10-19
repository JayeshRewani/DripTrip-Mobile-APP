# Privacy policy: what to fix before Play submission

The live policy at https://www.driptrip.in/policies/privacy-policy is an unfilled Shopify template:
it refers to **www.warriortribe.in** and still contains placeholders such as `[email address]`,
`[DATE]` and `[OR INSERT ALTERNATIVE INSTRUCTIONS…]`. Edit it in
**Shopify admin → Settings → Policies → Privacy policy**. The app does not change it.

This is a draft for the store owner. It is not legal advice; review it for your business and
for India's DPDP Act 2023.

## Replace throughout

- `www.warriortribe.in` / WarriorTribe → `www.driptrip.in` / DripTrip
- `[email address]` → `Veejay@driptrip.in`
- Physical address → `102, SCO 15, Sector 10, Panchkula, Haryana 134109, India`
- `[DATE]` → the date you publish the edited policy
- Remove every remaining `[ … ]` instruction block, or replace it with your real practice.

## Sections to add

### DripTrip mobile app

> The DripTrip app for Android and iOS displays our online store (www.driptrip.in) inside the app.
> Information you provide or that is collected while you use the app (browsing, account, cart,
> checkout) is handled exactly as described in this policy for our website. The app itself does not
> access your contacts, photos, camera, microphone or precise location. It uses your internet
> connection and checks whether you are online so it can show an offline message.
> Payments are processed by Shopify and our payment partners; card and UPI details are not stored by
> DripTrip or by the app.

### Push notifications

> If you allow notifications, the DripTrip app may send you messages about offers, new products and
> (when enabled) order updates. To deliver these messages we use **OneSignal** and, on Android,
> **Google Firebase Cloud Messaging**. They process a device push token / subscription ID and basic
> delivery data (for example whether a message was opened). We do not sell this information.
>
> You can turn notifications off at any time: **Account → Push notifications** in the app, or in your
> phone Settings → Apps → DripTrip → Notifications. Declining or turning off notifications does not
> affect browsing or checkout.

### Analytics and marketing

> We use Shopify analytics, Google Analytics, Google Ads and Meta (Facebook) Pixel to understand how our
> store is used and to measure our advertising. These services may collect device identifiers, cookies
> and information about the pages you view and purchases you make, on our website and in our app.
> You can manage cookie preferences through the cookie banner on our site.

(Keep only the services actually enabled in Shopify → Settings → Customer privacy and in installed apps.)

### Deleting your account and data

> You can ask us to delete your DripTrip account and associated personal data at any time:
>
> - **In the app:** Account tab → *Delete my account*. This sends an email request to us.
> - **On the web:** follow the instructions at https://www.driptrip.in/pages/delete-account
> - **By email:** write to Veejay@driptrip.in from the email address linked to your account with the
>   subject "Account deletion request".
>
> We confirm and complete deletion within 30 days. We delete your customer profile, saved addresses and
> marketing preferences. We keep order and invoice records only as long as required by tax and accounting
> law (typically up to 8 years in India), after which they are deleted.

## Account-deletion web page (`/pages/delete-account`)

Create it under **Online Store → Pages** with the same text as "Deleting your account and data" above.
Enter its URL in Play Console → App content → Data deletion.
