# CircuTrace

**Enterprise Digital Product Passport & Circular Supply Chain Intelligence Platform**

CircuTrace is a MERN + TypeScript platform for managing product identity, evidence-backed provenance and circular lifecycle information across organizations.

## Current milestones

- **Milestone 1 — Enterprise foundation:** React + TypeScript + Vite, Express API, MongoDB/Mongoose, secure middleware baseline, Docker, CI and architecture documentation.
- **Milestone 2 — Authentication & multi-tenancy:** bcrypt password hashing, short-lived JWT access tokens, rotating opaque refresh sessions, organization memberships, role-derived permissions, invitation lifecycle, tenant-aware API authorization and audit events.
- **Milestone 3 — Digital Product Identity Registry:** tenant-scoped product categories, configurable metadata, human-readable product identifiers, manufacturer/supplier/material records, GTIN validation, lifecycle status transitions, search/filter/pagination and audit events.
- **Milestone 4 — Product Lifecycle & Traceability:** tenant-scoped append-only event records, organization-scoped event sequences, product timelines, custody transfers, shipment references, source classification and evidence metadata references.\n\n- **Milestone 5 — Public Digital Product Passport:** controlled public publication, explicit section allowlists, opaque shareable URLs, public lifecycle summaries, audit logging and immediate revocation.

## Technology
MongoDB · Express · React · Node.js · TypeScript · Mongoose · JWT · bcrypt · Docker

## Important status
This is an actively developed portfolio project. Milestone 4 provides an application-level append-only event workflow, not cryptographic tamper-proof storage. Evidence is represented by references only; files are not uploaded or independently verified. Self-reported, supplier-provided and system-recorded classifications describe claim origin and do not establish truth. Sustainability analytics remain future work. Dashboard metrics remain placeholders until backed by implemented queries.

## Local setup
See [development setup](docs/development/README.md), [authentication and tenancy security notes](docs/security/authentication-and-tenancy.md), [product identity registry](docs/product-identity-registry.md), and [product lifecycle traceability](docs/product-lifecycle-traceability.md), and [public digital passports](docs/public-digital-passport.md).
