# Portfolio Tracker
## Project Overview
- Portfolio tracker that lets users upload transaction data (ticker, quantity, date) to calculate performance and compare against benchmarks
- Built with: Vite, React, TypeScript, Zustand, Recharts, Vercel, Yahoo Finance API
- Users are individual investors managing personal portfolio data

## Architecture
- Frontend: React + TypeScript with Vite
- State management: Zustand stores — understand existing store structure before adding new state
- Charts: Recharts — use existing chart components before creating new ones
- Data: Yahoo Finance API for market data; user transactions are CSV/manual uploads (no backend database)
- Deployment: Vercel

## Code Standards
- TypeScript only — no JavaScript files, no `any` types without a comment explaining why
- Every API call to Yahoo Finance must include error handling with a user-friendly message — never surface raw API errors to the user
- Keep Zustand stores focused — one store per domain (e.g., portfolio, benchmarks, UI state)
- Use existing component patterns before introducing new libraries or abstractions

## Things You Must Not Do
- Do not modify files outside the project directory without explicit approval
- Do not add new dependencies without proposing them first and explaining why existing tools are insufficient
- Do not refactor working code unless the task specifically requires it
- Do not invent features or UI elements not explicitly requested
- Do not create new Zustand stores without confirming the existing ones can't handle the need

## Working Style
- Before starting any task, propose a brief plan and wait for approval before writing code
- Work in small, focused pieces — one logical change at a time
- If a task will touch more than 3 files, propose a plan and wait for approval before making changes
- Suggest a Git branch name at the start of each meaningful change
- Prefer simple, readable solutions over clever ones — this codebase should be easy to revisit later
- Assume the transaction dataset will eventually hold thousands of records — build with scale in mind

## Transactions Tab UI
- "Add Transaction" and "Import CSV" are collapsed by default behind toggle buttons on a single row
- `activePanel: 'add' | 'csv' | null` state in `App.tsx` controls which panel is open — only one at a time
- `AddTransactionForm` and `CSVImport` render their content directly; they have no internal toggle logic
- `addTransaction` in the store delegates to `addTransactions` — bulk insert is the single source of truth

## Data Handling
- Transaction data (ticker, quantity, date) is user-uploaded and should never be logged or exposed in error messages
- Validate uploaded transaction files on the client before processing — give clear feedback on malformed rows