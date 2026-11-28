# Lifecycle Traceability Architecture

The lifecycle module is isolated behind a router, Zod request schemas, service layer, and Mongoose models. Product resolution always includes the authenticated organization ID. Event queries likewise filter on both organization and product IDs.

An organization-scoped counter allocates monotonically increasing event sequence numbers through an atomic MongoDB find-and-update. The generated event identifier is `CTE-{ORG_SUFFIX}-{SEQUENCE}`. A unique compound index enforces uniqueness within the organization.

The event model has no update/delete API and marks persisted fields immutable in Mongoose. This is a practical application boundary, not a cryptographic ledger or a protection against privileged database operators. Do not describe it as blockchain, cryptographically sealed, or tamper-proof.

Evidence references are opaque references and metadata; the API deliberately does not accept binary uploads or claim that referenced evidence has been validated. Source classification is descriptive only.
