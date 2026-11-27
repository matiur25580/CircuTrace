# Authentication, authorization and tenant isolation

## Session model

- Passwords are hashed with bcrypt (12 rounds); plaintext passwords are never persisted.
- Access tokens are short-lived JWTs (configured TTL, 15-minute default), signed with a dedicated secret and scoped to issuer and audience.
- Refresh tokens are 384-bit opaque random values. Only SHA-256 fingerprints are stored.
- Refresh tokens are delivered only in an HttpOnly, SameSite=Strict cookie scoped to the authentication routes.
- Refresh rotates atomically with a conditional update. Reuse of a revoked token revokes all still-active tokens in its family.
- Logout revokes the presented refresh token and clears the cookie.

## Tenant model

Users may have multiple organization memberships. Every access token carries one active organization identifier, but the API does not trust the token's role or permission claims for authorization. Authentication reloads the active membership and organization from MongoDB on every protected request and derives permissions from the current database role.

Tenant-owned queries must always include `request.auth.organizationId`. Never accept a client-supplied organization identifier as authorization context. Organization switching verifies an active membership before issuing a new session.

## Roles

- Owner: all defined organization, membership, product and audit permissions.
- Admin: organization read, member administration, product read/write and audit read.
- Member: organization/member read and product read/write.
- Auditor: organization/member read, product read and audit read; no product writes.

## Membership lifecycle

Organization owners and administrators can create email-bound invitations for admin, member or auditor roles. Invitation secrets are high-entropy, stored only as SHA-256 fingerprints, expire after seven days and can be accepted only by an authenticated account with the invited email address. Invitation acceptance is one-time. Member role changes and removals are tenant-scoped and audited; owner removal and self-role changes are blocked. The API returns an invitation token once because outbound email delivery is not configured yet; deliver it through a trusted channel and never log it.

## Important implementation boundaries

- Email verification, password reset, invitations, MFA, SSO and account recovery are not implemented in this milestone.
- Organization creation and registration use compensating cleanup for partial failures. Production rollout should use a MongoDB replica set transaction and an outbox for durable audit delivery.
- Cookie-based refresh requests validate the Origin header when supplied and use SameSite=Strict. Deploy frontend and API under a same-site origin; use HTTPS and `COOKIE_SECURE=true` in production.
- Configure a unique random `ACCESS_TOKEN_SECRET` (at least 32 characters) in production.
- Rate limiting is applied to the API globally; production deployments should add stricter auth-route limits and distributed rate-limit storage.
