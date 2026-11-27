# Product identity registry

## Domain boundaries
Each product and category belongs to exactly one organization. The API always derives that organization from the authenticated membership context; request payloads cannot select a tenant. Product identifiers are allocated by an atomic per-organization counter and have the form `CT-{ORG_SUFFIX}-{SEQUENCE}`. The organization-scoped unique index is the final integrity boundary.

## Product record
A registry record includes identity, descriptive fields, category, optional SKU and GTIN, manufacturer details, supplier/assembler/distributor parties, material composition, configurable category metadata, status, creator/updater references and timestamps.

## Category metadata
Organization administrators define categories and typed metadata fields (text, number, boolean, date or select). The API rejects undeclared attributes, missing required values and invalid types/options. Category IDs are resolved with the active organization scope.

## Lifecycle status
The registry currently supports draft, active, discontinued and recalled states. Allowed forward transitions are draft → active → discontinued → recalled, with active → recalled also allowed. Recalled products cannot be reactivated. A status correction is recorded as an audit event; a full append-only product lifecycle ledger is a later milestone.

## API
- `GET /api/v1/products/categories` — list tenant categories.
- `POST /api/v1/products/categories` — create a category (owner/admin).
- `GET /api/v1/products` — search, filter, sort and paginate products.
- `POST /api/v1/products` — create a product.
- `GET /api/v1/products/:identifier` — retrieve a tenant-owned product.
- `PATCH /api/v1/products/:identifier` — update product details and valid status transitions.

All endpoints require a valid session. Product reads require `products:read`, product writes require `products:write`, and category configuration requires `products:configure`.

## Integrity and security
- Tenant scope is included in every read/write query.
- Product identifiers, SKU and GTIN uniqueness are enforced per organization with database indexes.
- Category metadata is validated server-side.
- Product changes create tenant-scoped audit events.
- Pagination is bounded to 100 records per request.
- Search text is escaped before use in a regular expression.
- No binary file upload, public passport publishing, lifecycle attestation or sustainability certification is implied by this milestone.
