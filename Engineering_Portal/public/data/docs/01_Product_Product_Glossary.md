# Product Glossary — Merchant Pro

Alphabetical reference for business and technical terms used across product documentation.

| Term | Definition |
|------|------------|
| **Access Token** | Short-lived JWT (default 15 minutes) identifying an authenticated user; stored in HttpOnly cookie or sent via Bearer header. |
| **Activity Center** | Module aggregating recent platform activity for operational awareness (`/activity`). |
| **Authorization (Payment)** | Holding funds on a payment intent without final capture; state `authorized`. |
| **Audit Log** | Immutable record of user and system actions with actor, module, action, and organization context. |
| **Background Job** | Asynchronous task (email, webhook delivery) queued in `background_jobs` and processed by the worker. |
| **Capture** | Finalizing an authorized payment intent; transitions status to `captured`. |
| **Chargeback** | Dispute initiated by cardholder; merchant may submit evidence; statuses include merchant_won/merchant_lost. |
| **Checkout Session** | Hosted payment session with expiry; customer completes payment on public page. |
| **Compliance Queue** | Workflow queue for KYC/compliance review during merchant onboarding. |
| **CSRF Token** | Double-submit cookie token required for cookie-authenticated state-changing API requests. |
| **Customer** | End payer or business entity associated with transactions within an organization. |
| **Developer Portal** | Module for API profiles, OAuth apps, API keys, and usage logs. |
| **Feature Flag** | Toggle controlling module or route availability without deployment. |
| **Hosted Checkout** | Public payment page at `/pay/checkout/:ref` for checkout sessions. |
| **Idempotency** | Property ensuring duplicate requests produce a single outcome (payments, webhooks). |
| **Invoice** | Bill issued to customer with PDF generation and payment link. |
| **JWT** | JSON Web Token; HS256-signed access token carrying user, org, and role claims. |
| **KYC** | Know Your Customer — identity verification during merchant onboarding. |
| **Merchant** | Business entity accepting payments; scoped to an organization. |
| **Merchant Portal** | Context where merchant-role users operate with outlet-scoped permissions. |
| **MFA** | Multi-factor authentication via TOTP or SMS OTP. |
| **Organization** | Top-level tenant; all business data is organization-scoped. |
| **Organization Role** | Membership role (`owner`, `admin`, `member`, `viewer`) capping global permissions. |
| **Outlet** | Physical or logical branch of a merchant. |
| **Partial Capture** | Capturing less than the authorized amount on a payment intent. |
| **Partial Refund** | Refunding less than the captured amount. |
| **Payment Intent** | Core payment record with amount, currency, status, and lifecycle timeline. |
| **Payment Link** | Shareable URL for fixed-amount customer payment. |
| **Payment Order** | Order record associated with checkout flows. |
| **Payout** | Transfer of funds to merchant bank account; may require approval. |
| **Permission** | Granular access right in format `{resource}:{action}` (144 defined). |
| **Platform Role** | Global RBAC role (e.g., `admin`, `finance_manager`) assigned via `user_roles`. |
| **QR Payment** | Static or dynamic QR code leading to public payment page. |
| **RBAC** | Role-Based Access Control — three-layer permission resolution. |
| **Reconciliation** | Matching platform records with external settlement data. |
| **Refresh Token** | Long-lived token (default 7 days) in HttpOnly cookie for session renewal. |
| **Refund** | Return of captured funds; may require approval workflow. |
| **Sandbox** | Test environment simulating payment events without production impact. |
| **Settlement** | Batch process moving captured funds to merchant settlement accounts. |
| **Smart Collect** | Module for virtual account / collect-on-behalf payment flows. |
| **Subscription** | Recurring billing plan and subscriber lifecycle. |
| **Super Admin** | Platform role with `*` permission bypass. |
| **Tenant Isolation** | Enforcement that users access only their organization's data. |
| **Webhook** | HTTP callback to merchant URL on platform events; HMAC-SHA256 signed. |
| **Worker** | Background process polling queues for jobs, webhooks, and retries. |
| **X-Organization-Id** | HTTP header selecting active organization context. |

See also [User_Roles.md](./User_Roles.md) for role-specific terms.
