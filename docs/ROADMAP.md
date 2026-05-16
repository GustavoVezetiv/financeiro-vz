# Roadmap

## Phase 1: Project Setup

Goal: create a clean technical foundation.

Tasks:

- Create the Next.js project.
- Add TypeScript.
- Add Tailwind CSS.
- Configure linting and formatting.
- Define environment variable conventions.
- Add initial folder structure.
- Add basic CI checks later if needed.

Deliverable:

- A running local web project with no business features yet.

## Phase 2: Auth

Goal: support login and user-owned sessions.

Tasks:

- Configure Supabase.
- Add Supabase Auth.
- Create login and logout flows.
- Add protected routes.
- Create the `profiles` table.
- Ensure a profile exists for each authenticated user.

Deliverable:

- Users can sign in and access a protected app shell.

## Phase 3: Database Schema

Goal: create the first version of the financial data model.

Tasks:

- Create core tables.
- Add relationships and indexes.
- Enable Row Level Security.
- Add user ownership policies.
- Add database migrations.
- Add seed data for development.

Deliverable:

- A secure user-owned database schema ready for CRUD screens.

## Phase 4: CRUD

Goal: build basic data management screens.

Tasks:

- People CRUD.
- Categories CRUD.
- Income sources CRUD.
- Accounts payable CRUD.
- Credit cards CRUD.
- Goals CRUD.
- Notes support where useful.

Deliverable:

- The user can manage foundational finance data.

## Phase 5: Cards and Invoices

Goal: model credit card invoice pressure.

Tasks:

- Create credit card invoices.
- Add credit card transactions.
- Link transactions to invoices.
- Classify transactions as personal, reimbursable, or third-party.
- Display invoice totals and due dates.
- Show current and next invoice impact.

Deliverable:

- The user can understand credit card invoice pressure by month.

## Phase 6: Reimbursements

Goal: make reimbursement tracking operational.

Tasks:

- Create reimbursements from transactions or payables.
- Link reimbursements to people.
- Track expected, partial, received, overdue, and canceled statuses.
- Show pending reimbursements by person.
- Show reimbursement dependency in the monthly view.

Deliverable:

- The user can clearly separate real income from money owed by others.

## Phase 7: Cash Flow

Goal: project current and future balances.

Tasks:

- Combine income, payables, invoices, installments, planned purchases, goals, and reimbursements.
- Separate confirmed income from expected reimbursements.
- Calculate projected balance for current and future months.
- Highlight months with negative projected balance.

Deliverable:

- The user can see projected monthly balance and upcoming pressure.

## Phase 8: Payment Planner

Goal: support monthly decision making.

Tasks:

- Create payment plans by month.
- Add payment plan items from obligations and manual entries.
- Mark decisions: pay now, wait, parcel, monitor, skip.
- Show risk and priority.
- Calculate projected effect of the plan.

Deliverable:

- The user has a practical planning screen for monthly payment decisions.

## Phase 9: Import Templates

Goal: prepare structured data import and export workflows.

Tasks:

- Define templates for people, categories, income sources, payables, credit card transactions, reimbursements, and planned purchases.
- Add exportable spreadsheet templates later.
- Add import batch and row preview UI later.
- Validate imported rows before saving.

Deliverable:

- The system has a clear path for CSV/XLSX imports with preview before persistence.

## Phase 10: Dashboard

Goal: provide a decision-focused home screen.

Tasks:

- Show what should be paid now.
- Show what can wait.
- Show invoice pressure.
- Show expected reimbursements.
- Show cash flow dependency on reimbursements.
- Show highest-risk obligations.
- Show projected balances by month.

Deliverable:

- The user can open the app and quickly understand the month.

## Phase 11: Deploy

Goal: publish a protected first version.

Tasks:

- Configure Vercel deployment.
- Configure production Supabase project.
- Set environment variables.
- Run migrations in production.
- Validate RLS policies.
- Smoke test authentication and data isolation.

Deliverable:

- A deployed web-only MVP accessible through login.

