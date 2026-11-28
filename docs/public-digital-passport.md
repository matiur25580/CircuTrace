# Public Digital Product Passport

Milestone 5 introduces controlled public product passport publication.

## Organization API

All management endpoints require an authenticated active organization membership. The organization scope comes from the verified access-token membership context, never from request input.

- `GET /api/v1/passports/manage/:identifier` — retrieve publication state.
- `POST /api/v1/passports/manage/:identifier/publish` — publish an active or later-stage product with an explicit section allowlist.
- `PATCH /api/v1/passports/manage/:identifier` — update the public section allowlist.
- `POST /api/v1/passports/manage/:identifier/revoke` — revoke public access.

The allowed sections are identity, manufacturer, materials and lifecycle. At least one section must be enabled. Supplier records, custom attributes, internal organization identifiers, user details and audit metadata are not included in the public response.

## Public endpoint

- `GET /api/v1/passports/public/:slug` — read an active passport without authentication.

The opaque 192-bit random slug is the public capability URL and should be treated as shareable access. Revocation immediately removes the public response. Responses use `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow`. Lifecycle output is bounded to the first 200 events.

## Trust and privacy boundaries

A published passport is a curated disclosure of organization-entered records, not independent certification. Evidence references are metadata and are not independently verified. Public URLs are bearer capabilities: anyone possessing the URL can view its selected fields until revoked. A QR code can encode the public URL, but this milestone does not generate or host QR image files. Public data should be reviewed before publication.
