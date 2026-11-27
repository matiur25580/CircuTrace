# CircuTrace

**Enterprise Digital Product Passport & Circular Supply Chain Intelligence Platform**

CircuTrace is a MERN + TypeScript platform for managing product identity, evidence-backed provenance and circular lifecycle information across organizations.

## Current milestones

- **Milestone 1 — Enterprise foundation:** React + TypeScript + Vite, Express API, MongoDB/Mongoose, secure middleware baseline, Docker, CI and architecture documentation.
- **Milestone 2 — Authentication & multi-tenancy:** bcrypt password hashing, short-lived JWT access tokens, rotating opaque refresh sessions, organization memberships, role-derived permissions, invitation lifecycle, tenant-aware API authorization and audit events.
- **Milestone 3 — Digital Product Identity Registry:** tenant-scoped product categories, configurable metadata, human-readable product identifiers, manufacturer/supplier/material records, GTIN validation, lifecycle status transitions, search/filter/pagination and audit events.

## Technology
MongoDB · Express · React · Node.js · TypeScript · Mongoose · JWT · bcrypt · Docker

## Important status
This is an actively developed portfolio project. Lifecycle event ledger, evidence storage, sustainability analytics and public Digital Product Passports remain planned milestones. The registry currently stores product master data; it does not yet prove supply-chain claims or issue public passports. Dashboard metrics are placeholders until backed by implemented product workflows.

## Local setup
See [development setup](docs/development/README.md), [authentication and tenancy security notes](docs/security/authentication-and-tenancy.md), and the [product identity registry milestone](docs/product-identity-registry.md).
