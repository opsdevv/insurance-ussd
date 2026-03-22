# USSD Insurance Claims System

Production-ready USSD backend for insurance claims using Node.js (Express), Supabase (PostgreSQL), and Africa's Talking request format.

## Folder structure

```
.
├── postman/
│   └── ussd-samples.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── supabaseClient.js
│   ├── routes/
│   │   └── ussd.js
│   ├── services/
│   │   ├── claimService.js
│   │   └── userService.js
│   └── utils/
│       └── ussdHelper.js
├── supabase/
│   └── schema.sql
├── .env.example
├── .gitignore
└── package.json
```

## Environment variables

Copy `.env.example` to `.env` and set:

- `PORT` - API port (default `3000`)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for secure backend writes

## Setup

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`.
3. Run SQL in Supabase SQL editor:
   - `supabase/schema.sql`
4. Start server:
   - `npm run dev` (development)
   - `npm start` (production)

## Endpoint

- `POST /ussd`
- Consumes Africa's Talking payload:
  - `sessionId`
  - `serviceCode`
  - `phoneNumber`
  - `text`

Response format:
- `CON ...` for continuation
- `END ...` to terminate session

## USSD flow implemented

Main menu:
- `1. File a Claim`
- `2. Check Claim Status`
- `3. Policy Info`

### File a Claim
1. Select claim type (`Medical`, `Motor`, `Life`)
2. Enter policy number
3. Enter incident date (`YYYY-MM-DD`)
4. Enter short description
5. Claim saved with generated reference (`CLM...`)

### Check Claim Status
1. Enter claim reference
2. Returns status (`Pending`, `Approved`, `Rejected`) if found

### Policy Info
1. Enter policy number
2. Returns policy type if found

## Database tables

Defined in `supabase/schema.sql`:
- `users`
- `policies`
- `claims`

Includes:
- proper foreign keys
- unique constraints (`users.phone_number`, `claims.reference`)
- operational indexes for status and claim lookup

## Testing with Postman

Import `postman/ussd-samples.json`.

Use the included requests to simulate:
- opening menu (`text=""`)
- full claim submission (`text="1*2*MTR_7789*2026-03-20*Minor collision on highway"`)
- status check (`text="2*CLM1710000000000"`)
- policy info (`text="3*POL_55001"`)

## Reliability notes

- Stateless USSD handler based on `text.split("*")`
- Input validation for policy numbers and dates
- Compact response messages to reduce USSD timeout risk
- Centralized error handling with safe fallback responses

## Admin-ready extension point

Service modules are isolated for easy reuse by future admin APIs. Add a new route module such as `src/routes/admin.js` and reuse `userService`/`claimService` without changing USSD flow logic.
