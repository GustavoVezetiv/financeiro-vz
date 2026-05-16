# Architecture Decisions

## ADR 001: Start with Supabase Instead of Self-Hosted OCI PostgreSQL

Status: Accepted

Date: 2026-05-15

## Context

Financeiro VZ needs authentication, PostgreSQL, Row Level Security, and a fast path to a secure web MVP.

The product will store sensitive personal finance data. From the first version, the app must support login and ensure that each user only accesses their own data.

Two infrastructure paths were considered:

1. Supabase Auth and Supabase PostgreSQL.
2. Self-hosted PostgreSQL on OCI with a custom authentication and backend setup.

## Decision

The first version will use Supabase for authentication and database storage.

Supabase provides:

- Managed PostgreSQL.
- Built-in authentication.
- Row Level Security support.
- A fast development path for user-owned data.
- Good compatibility with Next.js.
- A practical path to deploy on Vercel.
- SQL-level data protection using `auth.uid()`.

This lets the project focus first on product correctness: reimbursements, invoice pressure, payment planning, and cash flow decisions.

## Why Not Start with OCI Self-Hosting

OCI with self-hosted PostgreSQL can be powerful, but it introduces more operational work at the beginning:

- Database provisioning.
- Backup configuration.
- Monitoring.
- Security hardening.
- Network configuration.
- Authentication implementation or integration.
- Deployment infrastructure.
- More manual operational responsibility.

For an early personal finance decision dashboard, that overhead would slow product discovery and increase the risk of building infrastructure before validating the core workflows.

## Why Supabase Fits the First Version

Supabase is a good first-version choice because Financeiro VZ needs:

- Login from the beginning.
- Strict per-user data access.
- PostgreSQL relational modeling.
- RLS policies for sensitive financial data.
- Fast iteration on schema and UI.
- A deployment path that works well with Vercel.

The database model can remain conventional PostgreSQL, which avoids locking the product into a data model that cannot move later.

## OCI as a Future Migration Path

OCI can remain a future migration path if the project needs:

- More infrastructure control.
- Cost optimization at a different scale.
- Custom networking.
- Dedicated database tuning.
- More advanced backend workloads.
- Self-hosted services around imports, background jobs, or analytics.

To preserve this option, the project should:

- Keep business logic understandable and portable.
- Avoid unnecessary coupling to Supabase-specific client behavior.
- Keep database migrations in the repository.
- Use standard PostgreSQL features where possible.
- Treat RLS policies as part of the formal schema.
- Keep authentication boundaries clear.

## Consequences

Positive consequences:

- Faster MVP development.
- Authentication and RLS available immediately.
- Less infrastructure maintenance.
- Easier integration with Next.js and Vercel.
- More time spent on product workflows instead of infrastructure.

Tradeoffs:

- Some dependency on Supabase platform conventions.
- Future migration would require careful planning.
- Background processing and advanced import workflows may need additional services later.

## Follow-Up Decisions

Future architecture decisions should cover:

- Whether to use Supabase client directly in UI components or isolate data access behind service modules.
- Migration tooling.
- Import processing architecture for CSV/XLSX files.
- Background job strategy.
- Production backup and recovery approach.
- Vercel deployment and environment strategy.

