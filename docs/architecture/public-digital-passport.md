# Public Passport Architecture

A `PublicPassport` record binds one product to one organization and one opaque random public slug. A unique compound index enforces one passport per tenant/product; the slug has a global unique index. Publication, section updates and revocation are audit logged.

The management routes authenticate and authorize using the existing `products:read` / `products:write` permissions. Product lookup always includes the authenticated organization ID. The public route is intentionally separate and resolves only a published slug, then rechecks the product with both product ID and organization ID.

The public response is assembled from explicit allowlisted projections. It never serializes the product document, tenant record, user, or audit event wholesale. Supplier arrays and custom attributes are excluded. Lifecycle data is limited to 200 chronologically ordered records and excludes actor user IDs and internal request IDs.

The opaque slug is a bearer capability, not an identity check. Anyone who receives it can read the configured public fields until revocation. Every publish operation rotates the slug, so republishing never reactivates a previously revoked QR or URL. No-store and noindex response headers reduce accidental caching and indexing but are not access control. Published records are organization-provided claims, not third-party verification.
