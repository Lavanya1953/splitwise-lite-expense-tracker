# Splitwise-Lite Expense Tracker

A collaborative group expense ledger for roommates and travel friends. Add shared bills, choose who participated, split costs with percentage sliders, and see minimized settlement instructions after each expense.

## Architecture

| Layer | Stack | Responsibility |
|-------|-------|----------------|
| **Frontend** (`src/`) | React + Vite + TypeScript | UI, forms, sliders, settlement display |
| **Backend** (`server/`) | Express + TypeScript | Validation, splits, balances, debt minimization |

All business logic (proportional splitting, net balances, debt minimization) runs on the **server**. The frontend handles presentation and calls the REST API. In development, Vite proxies `/api` requests to the Express server on port 3001.

## Features

- **Multiple groups** — create groups (e.g. Roommates, Goa Trip) with custom members; switch or delete groups
- **Default group** — starts with a seeded **Roommates** group (Amit, Rahul, Sneha)
- **Duplicate protection** — cannot create a group with the same name or the same member set
- **Bill creation** — description, total amount, and payer dropdown per group
- **Split selector** — checkboxes for who shared each expense; payer is always included; toggling participants auto-splits evenly among checked people
- **Percentage sliders** — custom proportional splits; submit is enabled only when sliders total exactly 100%
- **Reimbursement preview** — before submit, see who will owe the payer for the current bill
- **Expense list** — view and remove past expenses; settlement recalculates on add/remove
- **Live settlement board** — right-hand **Net Balances** panel with:
  - **Payments to make** — minimized transfers (e.g. `Rahul pays Sneha $15.00`)
  - **Already even** — members who owe nobody (Even)
  - **Everyone's standing** — per-person net position vs. what they paid
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

Or start both from the project root (single terminal):

```bash
npm run dev:all
```

Open **http://localhost:5173** (API runs on port 3001).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/groups` | List all groups |
| `POST` | `/api/groups` | Create group `{ name, members[] }` |
| `DELETE` | `/api/groups/:groupId` | Delete group and its expenses |
| `GET` | `/api/groups/:groupId` | Group details and default equal splits |
| `GET` | `/api/groups/:groupId/expenses` | List expenses for a group |
| `POST` | `/api/groups/:groupId/expenses` | Add expense (validates splits = 100%, ≥2 sharers) |
| `DELETE` | `/api/groups/:groupId/expenses/:expenseId` | Remove an expense |
| `GET` | `/api/groups/:groupId/settlements` | Net balances, minimized settlements, and message strings |

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
│   ├── groupService.ts      # Group CRUD + seed default group
│   └── settlement.ts        # Split, net balances, debt minimization
└── types.ts

src/
├── api/client.ts            # API client
├── App.tsx                  # Root layout and state
├── App.css                  # Styles
├── components/
│   ├── BillForm.tsx         # Expense input form
│   ├── SplitSliders.tsx     # Participant checkboxes + % sliders
│   ├── SettlementBoard.tsx  # Net balances panel
│   ├── GroupSelector.tsx    # Multi-group switcher
│   └── ExpenseList.tsx      # Ledger history
├── utils/format.ts          # Display formatting only
└── types.ts
```
