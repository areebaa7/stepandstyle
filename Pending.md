# Pending Work

This is the single checklist for work that cannot be completed yet because it needs a client decision, approved business data, an external account/provider, production access, or a safe upstream fix. Complete these items one by one and remove each item after it has been implemented and verified.

## Client decisions and approved business data

- [ ] **Decide whether card payments are required**
  - **Why pending:** The client has not confirmed whether Stripe or another card-payment provider should be part of checkout. Card payment currently fails closed rather than accepting an unverified browser amount.
  - **Needed to finish:** Confirm the provider, supported cards/countries/currency, who pays provider fees, refund/cancellation rules, and whether saved cards are required. After confirmation, implement the payment UI, server-created payment intent, webhook signature verification, success/failure handling, refunds where required, and end-to-end sandbox testing.

- [ ] **Remove demonstration content before final handover**
  - **Why pending:** The current products, collections, variants, stock, prices, banners, reels, blogs, reviews, and sale content are intentionally retained for development, testing, and presentation.
  - **Needed to finish:** After final testing and a database backup, remove the demonstration records without deleting the admin features or reusable media structure. The client will add and manage the real products, categories, prices, stock, campaigns, and content directly from the admin panel; no client catalog import by the developer is planned.

- [ ] **Choose how shipment tracking will work**
  - **Why pending:** The shipping page promises a tracking number and courier website, but there is currently no courier account, tracking-number field/workflow, or courier integration.
  - **Needed to finish:** Choose manual tracking entry or a courier API, provide the courier account/API access if automated, and confirm which couriers are supported. Implement admin tracking entry/status, customer display, and dispatch notifications; otherwise remove the tracking promise from public copy.

## External accounts and provider-dependent work

- [ ] **Activate and verify transactional email/SMTP delivery**
  - **Why pending:** Email delivery is intentionally disabled. SMTP-shaped values exist locally, but a real provider, verified sender/domain, ownership, and successful delivery have not been confirmed. Verification, password reset, order, affiliate, marketing, and recovery emails therefore remain providerless.
  - **Needed to finish:** Confirm the email provider and sender address/domain; securely configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`; verify SPF/DKIM/DMARC where supported; then set `EMAIL_DELIVERY_ENABLED=true` and run controlled verification, reset-password, order, affiliate, abandoned-cart, and spam-placement tests. Never commit credentials to the repository.

- [ ] **Select and configure an email-marketing provider**
  - **Why pending:** Newsletter contacts are stored locally, but the provider is still `NONE`; Brevo, Mailchimp, and Klaviyo connectors cannot synchronize without an owned provider account and list credentials.
  - **Needed to finish:** Client chooses a provider and plan, verifies the business/sender, supplies credentials through production secret storage, approves consent wording and incentive, and authorizes subscribe/unsubscribe synchronization testing. Supported settings are Brevo (`BREVO_API_KEY`, `BREVO_LIST_ID`), Mailchimp (`MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`, `MAILCHIMP_LIST_ID`), or Klaviyo (`KLAVIYO_API_KEY`, `KLAVIYO_LIST_ID`, optional `KLAVIYO_API_REVISION`).

- [ ] **Activate abandoned-cart scheduling**
  - **Why pending:** The recovery endpoint, admin-managed timing/content, capture gate, and email logic are complete, but there is no production `CRON_SECRET`, active scheduler, or verified email provider. Recovery remains safely paused in admin until those dependencies are ready.
  - **Needed to finish:** Create a strong production `CRON_SECRET`, configure the hosting scheduler to call `GET /api/cron/abandoned-carts` with `Authorization: Bearer <CRON_SECRET>`, set `ABANDONED_CART_CRON_CONFIGURED=true`, verify real SMTP delivery, enable recovery from admin, and run one controlled recovery cycle without duplicate delivery.

- [ ] **Create and connect Meta Pixel/Dataset**
  - **Why pending:** Website event code exists, but no client-owned Meta Business Portfolio Pixel/Dataset ID is configured.
  - **Needed to finish:** Client creates/selects the Meta business and dataset, provides the numeric ID, approves tracking/consent behavior, and grants access for Test Events verification. Ad billing is only needed if paid campaigns will run.

- [ ] **Create and connect Google Ads purchase conversion tracking**
  - **Why pending:** Website conversion support exists, but no Google Ads conversion destination is configured; creating the Ads account may require the client's billing profile/payment method.
  - **Needed to finish:** Client creates the Google Ads account and purchase conversion action, keeps campaigns paused until approved, provides `AW-.../CONVERSION_LABEL`, and grants access for a controlled Tag Assistant conversion test.

- [ ] **Verify GA4 and Google Tag Manager on the production domain**
  - **Why pending:** GA4/GTM IDs and loaders are configured locally, but real provider receipt, consent behavior, DebugView, and deployed-domain attribution cannot be proven locally.
  - **Needed to finish:** Production deployment and client access to the GA4/GTM properties. Verify page views and ecommerce events without duplicate GA tags, then confirm consent and purchase attribution on the live domain.

- [ ] **Decide whether WhatsApp is sufficient or dedicated live chat is required**
  - **Why pending:** WhatsApp is implemented, but an embedded support-agent chat needs a client-owned provider property/widget ID.
  - **Needed to finish:** Client either approves WhatsApp as the final chat channel or selects a provider such as tawk.to and supplies its property/widget ID, branding choice, availability hours, and privacy approval.

- [ ] **Decide whether WooCommerce synchronization is required**
  - **Why pending:** This Next.js store works without WooCommerce. Optional customer-sync code exists but remains disabled because there is no separate WooCommerce store or API access.
  - **Needed to finish:** Client confirms that the integration is required and provides the store URL and restricted REST API credentials. Otherwise explicitly close this item as not required.

## Production access, handoff, and operational work

- [ ] **Select hosting, final domain, and production environment ownership**
  - **Why pending:** Local configuration cannot complete deployment-specific DNS, HTTPS, environment secrets, scheduler, monitoring, or provider callback/domain verification.
  - **Needed to finish:** Hosting account access, final domain/DNS access, production database and Cloudinary ownership, application URL, environment-secret access, deployment region, and an agreed deployment/rollback process. Review the Content Security Policy whenever a new provider domain is introduced.

- [ ] **Synchronize and hand off the production admin account**
  - **Why pending:** The configured admin email currently does not match the actual admin account in the database. The correct owner identity and secure credential handoff have not been confirmed.
  - **Needed to finish:** Client provides the final admin-owner email and secure recovery channel. Reset/synchronize the admin account intentionally, verify login and password recovery through real email, remove obsolete access, and enable a secure credential handoff process.

- [ ] **Configure production database backups and restore testing**
  - **Why pending:** Backup scripts are implemented, but `mongodump` is not installed on the current machine and the final host/off-machine encrypted storage are not selected.
  - **Needed to finish:** Install MongoDB Database Tools on the backup runner; run `npm run backup:check`; create a backup with `npm run backup:database`; choose restricted encrypted off-machine storage; schedule daily backups with at least 30 days of retention; alert on failure; and restore one backup into a safe environment before launch. The ignored local `backups/` directory is staging space, not sufficient production protection by itself.

- [ ] **Run final production acceptance and real-service testing**
  - **Why pending:** Local automated QA passes, but a real order, real notification delivery, provider dashboards, payment sandbox/live callbacks, courier workflow, production performance, and live-domain consent behavior require the final deployment and client authorization.
  - **Needed to finish:** Client-approved test products/order/customer details and permission for controlled transactions. Test checkout through fulfillment/refund/cancellation, emails, analytics/conversions, mobile/desktop behavior, accessibility, live images, sitemap/robots/canonicals, Lighthouse/Core Web Vitals, backup restore, and rollback.

## Internal technical follow-up

- [ ] **Clear repository-wide lint debt**
  - **Why pending:** Focused production/type/admin QA passes, but the repository-wide lint command still reports issues in older application files.
  - **Needed to finish:** Replace unsafe `any` types, refactor synchronous effect state updates, escape JSX text, remove unused values, and rerun lint plus the complete regression suite.

- [ ] **Re-audit transitive dependency advisories and apply only safe upgrades**
  - **Why pending:** Earlier production audits documented transitive advisories below framework/analytics dependencies without a safe non-forced application upgrade. A forced audit fix could introduce breaking or invalid downgrades.
  - **Needed to finish:** Re-run the production audit before release, check for compatible upstream releases, apply supported upgrades only, and rerun build, security, checkout, analytics, image, and admin regression tests. Do not use `npm audit fix --force` without a separately approved migration and rollback plan.
