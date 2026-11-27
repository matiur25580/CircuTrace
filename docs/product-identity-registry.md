# Milestone 3 — Digital Product Identity Registry

## Scope delivered

- Organization-scoped product categories with configurable metadata field definitions (text, number, boolean, date and select).
- Product creation and retrieval with tenant-bound category validation and category-specific attribute validation.
- Organization-scoped, human-readable product identifiers allocated through an atomic MongoDB sequence.
- Optional SKU and GTIN uniqueness within an organization, including GTIN check-digit validation.
- Product manufacturer, supplier and material composition records.
- Draft → active → discontinued/recalled lifecycle transitions with invalid backward transitions rejected.
- Search, category/status filters, bounded pagination and deterministic sorting.
- Audit events for category creation, product creation, product updates and status changes.
- Product registry dashboard with category configuration, dynamic metadata fields, filtering, record detail and status controls.

## API surface

All routes are authenticated and require a current organization membership. The API derives the organization from the verified authentication context; clients cannot select another tenant by supplying an organization ID.

| Method | Endpoint | Permission | Purpose |
| --- | --- | --- | --- |
| GET | /api/v1/products/categories | authenticated membership | List current-tenant categories |
| POST | /api/v1/products/categories | products:configure | Create a category and metadata schema |
| GET | /api/v1/products | products:read | Search and paginate products |
| POST | /api/v1/products | products:write | Register a product |
| GET | /api/v1/products/:identifier | products:read | Retrieve one tenant-owned product |
| PATCH | /api/v1/products/:identifier | products:write | Update product data or lifecycle status |

## Identifier and data integrity

Identifiers use the form CT-{TENANT_SUFFIX}-{SEQUENCE}. The sequence is stored in a tenant-keyed MongoDB document and incremented atomically. Unique compound indexes protect identifier, SKU, GTIN and category-key uniqueness within each organization.

GTIN input is checked for supported length and check digit. Category metadata rejects unknown keys, missing required values and type/option mismatches. Product lifecycle transitions are enforced server-side and recorded in the audit stream.

## Validation

Pure unit tests cover identifier formatting, permitted lifecycle transitions and configurable metadata validation. CI typecheck, full test suite and production build are the required merge gates.

## Explicit boundaries

This milestone does not claim verified supplier attestations, regulatory certification, public Digital Product Passport publishing, evidence-file storage, QR issuance, lifecycle event ingestion or sustainability calculations. Those require their own provenance, access-control, retention and verification designs.
