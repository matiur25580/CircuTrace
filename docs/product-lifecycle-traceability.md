# Product Lifecycle & Traceability

Milestone 4 adds a tenant-scoped, append-only application workflow for recording a product's journey.

## Event model

Supported event types: `manufactured`, `quality_inspected`, `packaged`, `dispatched`, `shipped`, `received`, `custody_transferred`, `repaired`, `refurbished`, `recycled`, and `recalled`.

Each event records an organization-scoped event ID and sequence, the product identity, event type, occurrence time, server-recorded time, authenticated actor, optional location/lot/shipment details, a description, evidence references, and source classification. Custody transfers require distinct sending and receiving parties; shipment events require a shipment reference.

## API

- `GET /api/v1/lifecycle/:identifier/events` — tenant-scoped timeline, optional event type filter, bounded pagination and ascending/descending order.
- `POST /api/v1/lifecycle/:identifier/events` — append a lifecycle event using the authenticated organization and actor.

Both endpoints require authentication. Read access requires `products:read`; appending requires `products:write`. The organization is always taken from the validated membership context, never from the request body or query.

## Integrity and evidence boundaries

The API exposes no update or delete operation for lifecycle events. Event identity, sequence, actor, organization, product, and recorded event data are immutable at the Mongoose schema layer. This is application-level append-only behavior, not a claim of cryptographic tamper-proof storage: database administrators and direct database access remain outside this control. Sequence allocation is atomic per organization; gaps can occur if a sequence is allocated but event persistence subsequently fails.

Evidence is stored as metadata references only. This milestone does not upload, scan, host, or verify files. `self_reported`, `supplier_provided`, and `system_recorded` classify the origin of a claim; none means independently verified. A future evidence-verification workflow must establish that separately.

Events are records of reported activity, not proof that a physical transfer, inspection, repair, or recycling operation actually occurred. Consumers should evaluate issuer, evidence, and verification status before relying on a claim.
