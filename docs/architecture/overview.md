# Architecture overview

CircuTrace starts as a modular monolith. Domain boundaries are explicit so independently scaled services can be extracted only when operational evidence justifies the added complexity.

## Applications

- `apps/web`: React + TypeScript single-page application.
- `apps/api`: Express + TypeScript HTTP API.
- MongoDB: system of record for tenant-scoped domain data.
- Redis: reserved infrastructure for future background jobs, caching and rate coordination.
- Object storage: planned adapter for evidence files; binary uploads are not part of this foundation milestone.

## API conventions

- Versioned routes live under `/api/v1`.
- JSON responses use a stable `success` envelope.
- Every request receives an `x-request-id`.
- Error responses expose a stable machine-readable code.
- Readiness checks report dependency state separately from process liveness.

## Security baseline

Helmet security headers, explicit CORS origin, bounded JSON request bodies, API rate limiting, request-id propagation and redaction of authorization/cookie headers in logs are enabled. Authentication, tenant resolution, authorization policies, audit events and secure evidence handling are subsequent milestones.

## Data integrity principles

Lifecycle events will be modeled as append-only records with actor, tenant, event time, source and evidence references. Corrections should be represented as compensating or superseding events rather than silently rewriting history. Cryptographic verification and external trust models require a documented threat model before implementation.
