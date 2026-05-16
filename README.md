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

Not implemented yet:

- CRUD operations
- Imports
- Real business logic
- Persistence

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

## Next Planned Step

The next planned step is implementing the first CRUD modules:

1. People
2. Categories
3. Accounts payable
4. Income sources

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
