# Local development

## Prerequisites

- Node.js 22+
- npm 10+
- Docker Desktop or Docker Engine (optional, for MongoDB and Redis)

## Setup

1. Copy `.env.example` to `.env`.
2. Start infrastructure: `docker compose up -d mongodb redis`.
3. Install dependencies: `npm install`.
4. Start frontend and API: `npm run dev`.

Frontend: http://localhost:5173  
API health: http://localhost:4000/api/v1/health  
API readiness: http://localhost:4000/api/v1/health/ready

## Quality checks

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run lint`
- `npm run format:check`

The initial UI uses clearly labeled sample dashboard data. No production metrics or customer records are included.
