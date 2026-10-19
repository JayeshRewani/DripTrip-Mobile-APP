# DripTrip theme inspection (pre-implementation)

**Theme export:** `theme_export__www-driptrip-in-spotlight__10OCT2026-0448pm`  
**Live store:** https://www.driptrip.in (apex `driptrip.in` redirects to `www`)  
**Theme base:** Shopify Online Store 2.0 (Spotlight / Dawn lineage)

## Architecture

| Area | Finding |
| --- | --- |
| Layout | `layout/theme.liquid`, `password.liquid`, Zipify layout variant |
| Templates | JSON templates for index, product, collection, cart, search, customers, Zipify page variants |
| Cart | AJAX cart + **cart drawer** (`assets/cart-drawer.js`, `sections/cart-drawer.liquid`) |
| Checkout | Standard Shopify checkout via cart / dynamic checkout buttons (`show_dynamic_checkout: true`) |
| Customer | Classic customer templates under `templates/customers/` |
| Search / filters | Predictive search + facets CSS/JS present |
| Apps observed | Zipify Pages, Loox Reviews, CleverCat shoppable videos, Whatmore (disabled block), Recharge/Bold references in Zipify snippets |

## WebView-relevant risks

1. **Cart drawer** uses focus trapping and `overflow-hidden` — should work in mobile WebView; back button may need to close drawer via history (browser back) rather than exiting app — handled by WebView `goBack` when history exists.
2. **Dynamic checkout / Shop Pay / wallets** may open payment-provider domains — allowlisted in `src/config/store.ts`.
3. **Third-party apps** (Loox, CleverCat, Zipify) load external scripts — cookies/DOM storage enabled; no theme changes made.
4. **Customer login** may use Shopify Customer Accounts (hosted) — `account.shopify.com` / `shopify.com` allowed in-WebView.
5. **File uploads** — `enctype="multipart/form-data"` appears in Zipify product forms; WebView file access flags enabled where supported.
6. **Checkout is Shopify-hosted** — theme Liquid cannot alter hosted checkout behavior; no theme edits proposed.

## Theme modifications

**None.** Production theme was not modified. No deploy proposed.

## Unverified from theme alone

- Exact payment gateways enabled on the live shop (footer icons come from `shop.enabled_payment_types` at runtime).
- Whether new Customer Accounts or classic customer accounts are active.
- Full 3-D Secure / UPI / Razorpay redirect hostnames beyond the common allowlist — expand `TRUSTED_HOST_SUFFIXES` if a specific provider host is blocked during testing.
