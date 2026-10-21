# Neale Goad Customer Care — customer portal prototype

The main website opens directly into a simplified customer garage. Last service and Next due appear first; service notes, photos and comments open on demand. Optional workshop fields and visit preferences are collapsed to keep forms short. The original presentation and discovery checklist remain in `proposal.html`.

## Try the portal

- Open `index.html` or serve this directory with a static HTTP server.
- Customer view: select a sample vehicle, inspect dated work, mileage, next recommendations and workshop attachments, then comment on a job or request a service.
- Workshop view: publish a dated service/progress update with up to three photos, record completed work and approved next recommendations, reply to job comments and review customer requests.
- A completed job can fulfil an existing recommendation; that recommendation is then removed from Upcoming and labelled completed in the original visit.
- Requests stay pending until the workshop responds. Confirming an appointment requires a separate future weekday and arrival time.
- Switch vehicles to verify histories, attachments, comments and requests remain scoped to that vehicle.
- Refresh retains posted demo data on this browser when storage is available. Reset demo restores the fictional starting records.

## Prototype boundaries

- All seeded customer, vehicle, job, comment and recommendation records are fictional.
- Demo role switching is not authentication. There are no real customer accounts or access controls.
- All changes and photo attachments are stored locally in this browser. They are not shared with another person/device or sent to the workshop.
- No email/SMS, real calendar, payments or live booking connection is active.
- Use sample data/images only. Public GitHub Pages must never contain customer records or private documents.
- Image picker accepts JPG, PNG and WebP up to 3 MB each; max three per post. Images are resized locally before browser storage. Storage limits can prevent persistence, in which case the app shows a warning.
- Next date/kilometre recommendations are set and approved by the workshop in the demo. There is no live odometer or automatic diagnostic decision.
- API keys must never be committed or exposed in frontend code.

## Production needs to confirm

Identify the real workshop software, authoritative jobs/invoices/calendar and supported API/export. Agree customer identity and vehicle ownership verification, staff roles, moderation, message notifications, server-side image storage and access permissions, upload validation, backups and retention. Confirm actual service schedules, operating hours, contact permissions and messaging provider costs before a pilot.

## Sources and assets

Public business workflow checked 21 October 2026:

- https://ballaratcarrepairsandservicing.com.au/
- https://ballaratcarrepairsandservicing.com.au/book-service/
- https://ballaratcarrepairsandservicing.com.au/services-ballarat/
- https://developers.brevo.com/docs/send-a-transactional-email
- https://www.acma.gov.au/avoid-sending-spam
- https://www.acma.gov.au/sms-sender-id-register

Logo, team photo and illustrative example workshop image are from the client's public site, for this client proposal. The service attachment is expressly labelled as an example, not a photo of a fictional customer's car. Rights remain with their owners; do not reuse brand photos as stock.

Source image paths:

- `/wp-content/uploads/2026/06/NGA-logo-header.jpeg`
- `/wp-content/themes/astra-child/assets/img/meet-the-crew.jpg`
- `/wp-content/uploads/2026/06/Mechanic-working-on-car-engine-768x512.png`

The brake diagram, favicon and small car illustration are original interface drawings. Fonts are requested from Google Fonts, with system fallbacks.

## Hosting

Plain HTML/CSS/JS, with relative assets and no build step. GitHub Pages serves the `main` branch root. `.nojekyll` is included. `noindex, nofollow` is a search-engine instruction, not access control: this is a public demo.
