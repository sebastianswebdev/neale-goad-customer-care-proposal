# Neale Goad Customer Care — proposal and interactive prototype

A static, English-language proposal prepared for Danny and the Neale Goad Automotive team. Includes an interactive workshop/customer demonstration and a local discovery checklist.

## Preview

Serve this directory with a static HTTP server, or open `index.html`. No package installation or build is needed. Paths are relative so the same files work under a GitHub Pages project URL.

## Demonstration boundaries

- All customer and vehicle records are fictional. No real contact details are included.
- Reminders are simulated; no email/SMS provider is contacted.
- Booking requests become confirmed only after a separate staff action in the demo.
- Customer records and demo state live in memory and reset on refresh.
- Optional discovery notes stay in the browser's local storage or a locally downloaded text file. No notes are submitted.
- This is not production customer-record software. No backend, authentication, live calendar or payment handling is included.
- `noindex, nofollow` is a search-engine instruction, not access control. The GitHub Pages proposal is public.

## Confirmed business alignment

The existing website accepts booking requests, followed by staff confirmation. Vehicle details and email are optional in that flow; pickup/delivery is arranged with staff within the published 10 km Ballarat CBD area. App permissions, integration access, exact operating arrangements and current workshop software still need confirmation.

Public sources checked 21 October 2026:

- https://ballaratcarrepairsandservicing.com.au/
- https://ballaratcarrepairsandservicing.com.au/book-service/
- https://ballaratcarrepairsandservicing.com.au/services-ballarat/
- https://developers.brevo.com/docs/send-a-transactional-email
- https://developers.brevo.com/docs/transactional-sms-endpoints
- https://www.acma.gov.au/avoid-sending-spam
- https://www.acma.gov.au/sms-sender-id-register

## Production dependencies

Confirm the source workshop system and supported API/export before promising an integration. Keep job, invoice and calendar records authoritative in that system where possible. A production release requires secure server-side integrations, access controls, sender setup, appropriate messaging permissions/preferences, opt-out handling, monitoring and agreed costs. API keys must never be committed to this repository or exposed in a browser.

## Assets

Workshop logo and team photograph are sourced from the client's public website for this client proposal:

- `/wp-content/uploads/2026/06/NGA-logo-header.jpeg`
- `/wp-content/themes/astra-child/assets/img/meet-the-crew.jpg`

Rights remain with their respective owners. Do not treat these brand assets as generally reusable stock. The small favicon/car diagram are original interface illustrations. Barlow and Barlow Condensed are requested through Google Fonts; system fallbacks are provided.

## GitHub Pages

Publish the `main` branch root (`/`) in repository Settings → Pages. `.nojekyll` keeps this a plain static site. The public site must never receive real customer records or private business documents.
