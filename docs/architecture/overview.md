# Architecture overview

CircuTrace is a modular monolith with explicit domain boundaries. Services can be extracted only when operational evidence justifies the additional complexity.

## Applications
- `apps/web`: React + TypeScript single-page application.
- `apps/api`: Express + TypeScript HTTP API.
- MongoDB: tenant-scoped system of record.
- Redis: reserved for future background jobs, cache and rate coordination.
- Object storage: planned evidence adapter; binary uploads are not part of the current milestones.

## API conventions
- Versioned routes under `/api/v1`.
- Stable JSON success envelope and machine-readable errors.
- Every request receives an `x-request-id`.
- Bounded pagination and tenant-scoped domain queries.

## Security
Helmet, explicit CORS, bounded request bodies, API rate limiting, request IDs, bcrypt credentials, short-lived JWT access tokens, rotating opaque refresh sessions, organization membership checks and database-derived role permissions are implemented. Product registry routes derive tenant scope exclusively from authenticated membership context.

## Data integrity
Lifecycle events will be append-only with actor, tenant, event time, source and evidence references. Corrections should be represented as compensating or superseding events rather than rewriting history. Product registry updates are audited; a dedicated lifecycle event ledger and public passport verification are later milestones.
