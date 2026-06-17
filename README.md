# HireMatch API

Explainable resume-to-job fit scoring API built for RapidAPI.

## Quick Start

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npm run migrate
npm run dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/health` | Health check |
| POST | `/v1/match/score` | Score resume vs job description |
| GET | `/v1/usage` | Current plan usage |

## Local Test

```bash
curl -X POST http://localhost:3000/v1/match/score \
  -H "Content-Type: application/json" \
  -H "X-RapidAPI-Subscription: PRO" \
  -d '{
    "resumeText": "Senior Software Engineer with 6 years experience in Node.js, Express, React, PostgreSQL, Redis, Docker, AWS. Bachelors in Computer Science.",
    "jobDescriptionText": "We are hiring a Senior Backend Engineer. Required Node.js, Express, PostgreSQL, 5+ years experience. Preferred Redis, Docker, AWS. Remote US."
  }'
```

## Docker (full stack)

```bash
cp .env.example .env
docker compose up --build
```

## RapidAPI Setup

1. Deploy API to Railway/Render with HTTPS
2. Set `REQUIRE_RAPIDAPI_PROXY=true` in production
3. Copy `X-RapidAPI-Proxy-Secret` from RapidAPI Gateway tab to `RAPIDAPI_PROXY_SECRET`
4. Import `openapi.yaml` in RapidAPI Studio
5. Set Base URL to your deployed URL
6. Configure pricing: BASIC (free), PRO ($29), ULTRA ($99), MEGA ($299)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `RAPIDAPI_PROXY_SECRET` | Secret from RapidAPI Gateway tab |
| `REQUIRE_RAPIDAPI_PROXY` | `true` in production |
| `RUN_MIGRATIONS` | Auto-run migrations on startup |

## Plans

| RapidAPI Plan | Requests/mo | Rate/min | Explanation |
|---------------|-------------|----------|-------------|
| BASIC | 100 | 10 | Score only |
| PRO | 2,000 | 60 | Full explanation |
| ULTRA | 15,000 | 120 | Custom weights |
| MEGA | 100,000 | 300 | All features |
