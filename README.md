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

Not implemented yet:

- Supabase Auth
- Supabase client
- Database tables
- Row Level Security policies
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

## Next Planned Step

The next planned step is Supabase database and authentication setup:

1. Configure Supabase project credentials.
2. Add Supabase Auth.
3. Create the `profiles` table.
4. Create the initial database schema.
5. Enable Row Level Security.
6. Add policies so each user can only access their own data.

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
