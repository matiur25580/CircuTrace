# Local development

## Prerequisites
- Node.js 22+
- npm 10+
- Docker Desktop or Docker Engine (optional)

## Setup
1. Copy `.env.example` to `.env` and set a unique `ACCESS_TOKEN_SECRET`.
2. Start MongoDB: `docker compose up -d mongodb`.
3. Install dependencies: `npm install`.
4. Start frontend and API: `npm run dev`.

Frontend: http://localhost:5173  
API health: http://localhost:4000/api/v1/health  
API readiness: http://localhost:4000/api/v1/health/ready

## Authentication
- Register at the frontend to create a user and first organization.
- Registration requires a 12+ character password containing lowercase, uppercase and numeric characters.
- Refresh sessions are held in an HttpOnly cookie; access tokens stay in memory in the browser.
- Use `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` and `GET /api/v1/auth/me`.
- Organization endpoints: `GET/POST /api/v1/organizations`, `POST /api/v1/organizations/switch`, `GET /api/v1/organizations/members`, `POST /api/v1/organizations/members/invitations`, `POST /api/v1/organizations/members/invitations/accept`, `PATCH/DELETE /api/v1/organizations/members/:membershipId`, `GET /api/v1/organizations/audit-events`.

## Product registry
- Product categories are tenant-scoped. Owners and administrators can define category metadata fields.
- Products receive a stable identifier in the form `CT-{ORG_SUFFIX}-{SEQUENCE}`.
- Create products with `POST /api/v1/products`; list/search/filter with `GET /api/v1/products`; retrieve and update with `GET/PATCH /api/v1/products/:identifier`.
- Product records can capture manufacturer, suppliers, material composition, SKU, GTIN and category-defined metadata.
- The API returns a one-time invitation token for manual delivery; outbound email is not configured.

## Quality checks
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run lint`

Dashboard metrics remain placeholders until backed by implemented product and lifecycle data.
