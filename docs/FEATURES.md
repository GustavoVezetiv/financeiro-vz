# Features

## MVP

The MVP should deliver a useful web-based decision dashboard for a single authenticated user.

### Authentication and Data Ownership

- Login with Supabase Auth.
- User profile linked to the authenticated user.
- Row Level Security so each user only accesses their own data.

### People and Responsibility

- Register people such as friends, family members, and the user's mother.
- Mark who is responsible for reimbursable expenses.
- Track open amounts by person.

### Categories

- Create basic categories for expenses, income, reimbursements, debts, and planned purchases.
- Allow categories to support dashboard grouping and future templates.

### Income Sources

- Register recurring and occasional income sources.
- Distinguish salary, other real income, reimbursements, and third-party money.

### Accounts Payable

- Track bills, debts, and obligations.
- Store due dates, status, amount, risk level, and payment priority.
- Support one-off and recurring obligations.

### Credit Cards and Invoices

- Register credit cards.
- Track invoice cycles, due dates, closing dates, limits, and status.
- Add transactions to invoices.
- Show current invoice pressure and next invoice impact.

### Credit Card Transactions

- Register personal and third-party card transactions.
- Link transactions to invoices, categories, people, reimbursements, and installments.
- Mark whether a transaction is reimbursable.

### Reimbursements

- Treat reimbursements as first-class records.
- Link reimbursements to original expenses, card transactions, invoices, or payable items.
- Track expected amount, received amount, status, expected date, and person responsible.
- Separate reimbursement inflows from real income.

### Installments

- Track purchases split into installments.
- Show future monthly impact.
- Link installments to credit card transactions and invoices.

### Payment Plans

- Create monthly payment plans.
- Add payment plan items from accounts payable, invoices, debts, planned purchases, and manual entries.
- Classify items as pay now, can wait, parcel, monitor, or risky.

### Planned Purchases

- Register purchases being considered before they happen.
- Estimate cash flow or credit card impact.
- Decide whether to buy now, delay, cancel, or split.

### Goals

- Track simple financial goals such as emergency reserve, debt reduction, or planned purchase savings.
- Reflect goal contributions in projections.

### Notes

- Add notes to financial decisions, people, invoices, reimbursements, and plans.
- Keep decision context close to the records.

### Import Foundation

- Store import batches and import rows.
- Support future CSV/XLSX preview before saving.
- Keep raw imported data separate from validated application records.

### Dashboard

- Show projected balance for the current month.
- Show upcoming obligations.
- Show credit card invoice pressure.
- Show pending reimbursements.
- Show cash flow dependency on reimbursements.
- Highlight highest-risk bills or debts.

## Phase 2

Phase 2 should deepen planning, imports, and operational usability.

- CSV import with preview, validation, and mapping.
- XLSX import with preview, validation, and mapping.
- Export spreadsheet templates for each module.
- Better recurring payable generation.
- Better recurring income projections.
- Reimbursement aging and reminder views.
- Invoice reconciliation workflow.
- Payment planner recommendations based on due date, risk, available cash, and invoice impact.
- Scenario planning for parceling or delaying purchases.
- Dashboard filters by month, person, card, and category.
- Basic charts for monthly projection and invoice composition.
- Data audit history for important financial records.

## Future

Future work can expand automation, integrations, and intelligence after the core workflows are stable.

- Open Finance integration.
- OCR for invoices and receipts.
- WhatsApp reminders or ingestion.
- Multi-user collaboration or shared household mode.
- Advanced role-based permissions.
- Native mobile app.
- Automated bank synchronization.
- More advanced forecasting.
- Investment tracking.
- Debt payoff optimization.
- AI-assisted import categorization.
- AI-assisted monthly decision summaries.

