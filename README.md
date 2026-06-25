# Splitwise-Lite Expense Tracker

A collaborative group expense ledger for roommates and travel friends. Add shared bills, split them proportionally with percentage sliders, and see minimized settlement instructions in real time.

## Architecture

| Layer | Stack | Responsibility |
|-------|-------|----------------|
| **Frontend** (`src/`) | React + Vite + TypeScript | UI, sliders, form interactions |
| **Backend** (`server/`) | Express + TypeScript | Validation, splits, balances, debt minimization |

All business logic (proportional splitting, net balances, debt minimization) runs on the **server**. The frontend only handles presentation and calls the REST API.

## Features

- **Multiple groups** — create groups (e.g. Roommates, Goa Trip) with custom members; switch between them
- **Bill creation** — description, total amount, and payer selection per group
- **Percentage sliders** — custom proportional splits; submit is enabled only when sliders total exactly 100%
- **Live settlement board** — human-readable lines like `Rahul owes Sneha $15.00` or `Amit owes nobody (Even)`
- **Debt minimization** — greedy algorithm consolidates overlapping counter-debts into the fewest transactions

## Run locally

Install dependencies for both client and server:

```bash
npm install
npm install --prefix server
```

Start the API (terminal 1):

```bash
npm run dev:server
```

Start the frontend (terminal 2):

```bash
npm run dev
```

Open **http://localhost:5173** (API runs on port 3001).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/groups` | List all groups |
| `POST` | `/api/groups` | Create group `{ name, members[] }` |
| `DELETE` | `/api/groups/:groupId` | Delete group and its expenses |
| `GET` | `/api/groups/:groupId` | Group details and default splits |
| `GET` | `/api/groups/:groupId/expenses` | List expenses for a group |
| `POST` | `/api/groups/:groupId/expenses` | Add expense (server validates splits = 100%) |
| `DELETE` | `/api/groups/:groupId/expenses/:id` | Remove an expense |
| `GET` | `/api/groups/:groupId/settlements` | Net balances and minimized settlements |

## Build

```bash
npm run build:all
npm run preview          # frontend preview
npm run start:server     # production API
```

## Project structure

```
server/src/
├── index.ts                 # Express app entry
├── routes/api.ts            # REST routes
├── services/
│   ├── expenseService.ts    # CRUD + validation
│   └── settlement.ts        # Split & minimize logic
└── types.ts

src/
├── api/client.ts            # API client
├── components/              # React UI
├── utils/format.ts          # Display formatting only
└── types.ts
```
