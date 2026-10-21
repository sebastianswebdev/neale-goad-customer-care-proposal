# Neale Goad Customer Care — customer portal prototype

The main website opens directly into a job-centred customer portal. **My Vehicle** shows the selected vehicle's active service, its current status and a conversation with the workshop. Photos, progress updates and additional-work decisions stay with that job. The original presentation and discovery checklist remain in `proposal.html`.

## Try the portal

- Open `index.html` or serve this directory with a static HTTP server.
- Workshop view: add a fictional sample vehicle and link it to Alex's sample account. Customers cannot add or link vehicles themselves.
- Customer view: select a linked sample vehicle and follow its one active service in **My Vehicle**. The job moves through **Requested → Booked → Working → Awaiting → Ready → Completed** as appropriate; an Awaiting status includes the reason for the hold.
- A booking request remains Requested until the workshop confirms it. Booking requires a separate future weekday and arrival time; a preferred date is not a confirmed appointment.
- Post messages, photo updates and progress notes in the job conversation. Check that each vehicle and job retains its own conversation and attachments.
- For extra work, the customer asks in the job chat, the workshop creates a sample quote, and the customer approves or declines it. Extra work joins the job scope only after approval. A job cannot be completed while a quote is awaiting a decision.
- Complete the service in workshop view. The same job moves into history with its existing conversation, photos and quote decisions; completion does not create a duplicate history record.
- Start a follow-up request from a completed job to retain the link to the original work. The original job and conversation remain available in history.
- Refresh retains posted demo data on this browser when storage is available. Reset demo restores the fictional starting records.
- Existing v2 browser records are migrated into the current job-centred demo structure when loaded.

## Prototype boundaries

- All seeded customer, vehicle, job, message, quote and service recommendation records are fictional.
- Demo role switching is not authentication. There are no real customer accounts or access controls.
- All changes and photo attachments are stored locally in this browser. They are not shared with another person/device or sent to the workshop.
- No email/SMS, real calendar, quote payments or live booking connection is active. Quote creation and approval are local demonstration actions, not real billing or payment processing.
- Vehicle linking, job status controls and role switching demonstrate the intended workflow; they are not production ownership verification, integration or authentication.
- Use sample data/images only. Public GitHub Pages must never contain customer records or private documents.
- Image picker accepts JPG, PNG and WebP up to 3 MB each; max three per post. Images are resized locally before browser storage. Storage limits can prevent persistence, in which case the app shows a warning.
- Next date/kilometre recommendations are set and approved by the workshop in the demo. There is no live odometer or automatic diagnostic decision.
- API keys must never be committed or exposed in frontend code.

## Production needs to confirm

Identify the real workshop software, authoritative jobs/invoices/calendar and supported API/export. Agree customer identity and staff-verified vehicle ownership, role permissions, allowed job transitions, hold reasons and quote approval records. Confirm who owns conversations, progress updates, follow-up requests and exceptions. A live system also needs moderation, message notifications, server-side image storage and access permissions, upload validation, backups and retention. Confirm actual service schedules, operating hours, contact permissions and messaging provider costs before a pilot. Any real quoting, invoicing or payment connection requires separate scope and approval.

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

Existing v2 requests remain separate when imported, including their original appointment time and pickup preference in the conversation. The demo prevents creating a second new current service for the same vehicle; imported existing jobs can still be opened individually. Workshop quotes can be withdrawn before customer approval, with the decision retained in chat.
