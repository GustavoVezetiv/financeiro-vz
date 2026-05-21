# Financeiro VZ

Financeiro VZ is a personal finance decision dashboard focused on monthly payment planning, credit card invoices, reimbursements, third-party expenses, cash flow risk, and practical financial decisions.

This is not intended to be a generic expense tracker. The product exists to help answer operational questions such as:

- What should I pay now?
- What can wait?
- What should I split into installments?
- What will hurt the next credit card invoice?
- How much of my monthly cash flow depends on reimbursements?
- Which bills or debts create the highest risk this month?
- What is my projected balance for this month and the next months?

## Product Purpose

The system is designed for a real personal finance workflow where the user frequently pays expenses with credit cards to generate cashback. Some expenses are personal. Others are paid on behalf of friends or the user's mother and are later reimbursed via Pix.

Those reimbursements are not free income. They must be linked to the original expense, invoice, card transaction, and responsible person. Financeiro VZ treats reimbursements as first-class financial entities so the user can clearly distinguish:

- Personal income
- Reimbursement inflows
- Third-party money temporarily passing through the user's cash flow
- Real monthly spending
- Credit card invoice pressure
- Pending responsibility from other people

## Planned Stack

The planned first version will use:

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Supabase Auth
- Supabase database
- Supabase Row Level Security
- Vercel deployment later

The first version will be web-only. Native mobile apps are not part of the initial scope.

## Current Project Status

The initial application scaffold is in place.

Implemented in the foundation phase:

- Next.js App Router
- TypeScript
- Tailwind CSS
- ESLint
- Prettier configuration
- `src` based project structure
- Responsive dashboard shell
- Sidebar navigation
- Top header
- Placeholder routes for all planned MVP modules
- Reusable base UI components
- Isolated static mock data in `src/lib/mock-data.ts`
- Supabase client utilities
- Supabase Auth login and signup UI
- Protected dashboard routes
- Logged user indicator and logout action
- Initial SQL schema with Row Level Security policies
- CRUD for people
- CRUD for categories
- CRUD for accounts payable
- CRUD for income sources
- CRUD for credit cards
- CRUD for credit card invoices
- Invoice transaction management
- Reimbursement tracking linked to people and card transactions
- CRUD for installments
- Payment plans and payment plan items
- Simple deterministic payment decision simulator
- Dashboard summaries using real account, income, invoice, transaction, reimbursement, installment and payment plan data

Not implemented yet:

- Imports
- Import templates
- CSV/XLSX import preview

## Development Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Format files:

```bash
npm run format
```

## Supabase Setup

Create a Supabase project:

1. Go to the Supabase dashboard.
2. Create a new project.
3. Copy the project URL and anon public key from Project Settings > API.
4. Create a local environment file:

```bash
cp .env.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not commit `.env.local`.

## Database Schema

The initial schema lives at:

```bash
supabase/migrations/202605160001_initial_auth_schema_rls.sql
```

Run it in Supabase SQL Editor or through the Supabase CLI if the project is linked.

The schema creates:

- `profiles`
- `people`
- `categories`
- `accounts_payable`
- `income_sources`
- `credit_cards`
- `credit_card_invoices`
- `credit_card_transactions`
- `reimbursements`
- `installments`
- `payment_plans`
- `payment_plan_items`
- `planned_purchases`
- `goals`
- `notes`
- `import_batches`
- `import_rows`

It also creates:

- Financial distinction enums for real income, reimbursements, third-party money, ownership type, risk, status, and payment decisions.
- A reusable `set_updated_at()` trigger function.
- `updated_at` triggers for all user-owned tables.
- Row Level Security policies for select, insert, update, and delete.
- A `handle_new_user()` trigger to create a profile when a Supabase Auth user is created.
- `create_default_categories_for_current_user()` for optional per-user default categories after login.

The default category helper is user safe because it uses `auth.uid()` and does not create global shared data.

An incremental CRUD migration also lives at:

```bash
supabase/migrations/202605200001_extend_foundation_crud_fields.sql
```

Run this migration after the initial schema. It adds the fields used by the first CRUD screens:

- People: `email`, `phone`
- Categories: `icon`, `is_default`
- Accounts payable: planned payment method, delay flags, delay risk and notes
- Income sources: person, description, confidence, received date and notes

The credit card and reimbursement migration lives at:

```bash
supabase/migrations/202605200002_extend_cards_invoices_reimbursements.sql
```

Run it after the CRUD migration. It adds safe fields and enum values used by the card, invoice, transaction and reimbursement screens:

- Credit cards: `brand`, `notes`
- Credit card invoices: `notes`, additional invoice statuses
- Credit card transactions: shared/family ownership and installment numbers
- Reimbursements: `income_source_id`, `received_date` and indexes for linked lookups

The installments and payment plans migration lives at:

```bash
supabase/migrations/202605200003_extend_installments_payment_plans.sql
```

Run it after the credit card migration. It adds fields and enum values used by installments, payment plans, plan items and the simulator:

- Installments: category, person, start/end dates, current/total installment aliases and notes
- Payment plans: description
- Payment plan items: installment, reimbursement and income links, planned payment date, description and notes
- Decision/status enum values for pay when income arrives, ignore for now, active, completed, cancelled, planned, done and skipped

## Authentication

The `/login` route supports:

- Email/password sign in.
- Email/password sign up.
- Loading state.
- Error messages.
- Missing Supabase configuration warning.

The `/dashboard` route and all dashboard subroutes are protected in the server layout. If no authenticated user is found, the app redirects to `/login`.

The app shell displays the logged user email and includes a logout button.

## Row Level Security

Every user-owned table includes `user_id`.

RLS policies enforce:

- Users can select only rows where `user_id = auth.uid()`.
- Users can insert only rows where `user_id = auth.uid()`.
- Users can update only rows where `user_id = auth.uid()`.
- Users can delete only rows where `user_id = auth.uid()`.

No public read policies are created.

## Implemented CRUD Modules

The first real CRUD set is implemented under authenticated dashboard routes:

- `/dashboard/people`
- `/dashboard/categories`
- `/dashboard/accounts`
- `/dashboard/income`
- `/dashboard/cards`
- `/dashboard/invoices`
- `/dashboard/invoices/[id]`
- `/dashboard/reimbursements`
- `/dashboard/installments`
- `/dashboard/payment-plans`
- `/dashboard/payment-plans/[id]`

These pages persist data in Supabase and rely on RLS for user isolation. Inserts send the authenticated user's `user_id`, and reads/updates/deletes are still constrained by database policies.

Current tables used by the app:

- `people`
- `categories`
- `accounts_payable`
- `income_sources`
- `credit_cards`
- `credit_card_invoices`
- `credit_card_transactions`
- `reimbursements`
- `installments`
- `payment_plans`
- `payment_plan_items`

The dashboard now reads:

- `accounts_payable`
- `income_sources`
- `credit_card_invoices`
- `credit_card_transactions`
- `reimbursements`
- `installments`
- `payment_plans`
- `payment_plan_items`

Reimbursements and third-party money are displayed separately from real income. The projected balance can include them for cash-flow visibility, but the UI warns that they are not free income. Invoice transaction ownership distinguishes personal expenses from third-party, shared and family expenses.

## Payment Plans and Simulator

Payment plans are monthly decision scenarios. A plan can include manual items or linked records from:

- Pending accounts payable
- Open or overdue credit card invoices
- Active installments
- Expected income sources
- Pending reimbursements

Each item receives a deterministic decision:

- Pagar agora
- Pagar quando cair renda
- Pagar no cartão
- Parcelar
- Aguardar
- Negociar
- Ignorar por enquanto

The simulator calculates:

- Total planned to pay now
- Total planned when income arrives
- Total planned by credit card
- Total to parcel, wait, negotiate or ignore
- Critical and high risk amounts
- Real income expected
- Reimbursements expected
- Third-party money expected
- Pending obligations
- Estimated remaining cash after planned payments
- Next invoice pressure from pay-by-card decisions plus active installments

Known limitations:

- Calculations are deterministic and rule-based only.
- There are no AI recommendations.
- Plan item links are stored directly where the schema supports them, but no automatic status synchronization is implemented yet.
- Reimbursements and third-party money can help cash flow, but the UI treats them as linked money, not free income.

## Testing CRUD

1. Configure `.env.local` with Supabase URL and anon key.
2. Run all SQL migrations in Supabase.
3. Start the app:

```bash
npm run dev
```

4. Sign up or sign in at `/login`.
5. Open `/dashboard/people`, `/dashboard/categories`, `/dashboard/accounts`, `/dashboard/income`, `/dashboard/cards`, `/dashboard/invoices`, `/dashboard/reimbursements`, `/dashboard/installments`, and `/dashboard/payment-plans`.
6. Create, edit, filter and delete records.
7. Create a card, an invoice, and a linked invoice transaction.
8. Mark a transaction as third-party, shared or family and create an expected reimbursement.
9. Create an installment and confirm the future commitment cards update.
10. Create a payment plan, open it, add items from pending records or manually, choose decisions and review the simulator totals.
11. Mark a plan as active and confirm the dashboard shows the active plan summary.

## Next Planned Step

The next planned step is implementing:

1. Exportable import templates
2. CSV/XLSX upload
3. Import preview before saving records

## Development Philosophy

Financeiro VZ should be built as a decision system before it becomes a reporting system.

The application should prioritize:

- Clear monthly decisions over decorative charts
- Practical payment planning over passive expense history
- Explicit ownership of expenses and reimbursements
- Separation between income, reimbursement, and third-party money
- Conservative financial projections
- Clean, fast, web-first workflows
- Small iterations with usable vertical slices
- Strong data ownership through authentication and Row Level Security

The UI should be clean, practical, and focused on decisions. Screens should help the user understand what requires action, what creates risk, and what can safely wait.

## Documentation

Initial project documentation:

- [Product Specification](docs/PRODUCT_SPEC.md)
- [Feature Plan](docs/FEATURES.md)
- [Database Model](docs/DATABASE_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture Decisions](docs/DECISIONS.md)
