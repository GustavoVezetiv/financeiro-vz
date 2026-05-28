# Product Specification

## Vision

Financeiro VZ is a personal finance decision dashboard for managing monthly financial pressure, credit card invoices, reimbursements, third-party expenses, and payment planning.

The product should help the user decide what to do next with their money. It should not behave like a passive ledger that only records what already happened.

The main goal is to make the current month and upcoming months easier to reason about:

- Which payments are urgent?
- Which payments can wait?
- Which credit card invoices are becoming risky?
- Which reimbursements are expected?
- Which expenses belong to other people?
- How much cash is truly available after obligations?
- What future balance is projected if the current plan is followed?

## User Context

The user often pays expenses using credit cards to generate cashback. This creates a specific financial workflow:

- Some card transactions are personal.
- Some transactions are paid on behalf of friends.
- Some transactions are paid on behalf of the user's mother.
- The responsible person later reimburses the user via Pix.
- Reimbursements must be linked back to the original transaction or obligation.
- Reimbursement money must not be counted as regular income.

This makes traditional expense tracking insufficient. The system must show financial responsibility, expected reimbursements, invoice impact, and cash flow dependency.

## Core Problems

Financeiro VZ should solve these problems:

1. Credit card invoices are hard to evaluate when they contain personal and third-party expenses.
2. Reimbursements can temporarily improve cash flow but do not represent free income.
3. The user needs to understand how much of their monthly balance depends on money owed by others.
4. Monthly decisions require comparing cash on hand, upcoming bills, card invoices, debts, income, and expected reimbursements.
5. Installments can make future invoices risky if not planned carefully.
6. Expenses paid for other people need clear ownership and settlement status.
7. Imported bank or card data should be reviewed before it becomes official data.

## Target User

The initial target user is a single individual managing their own financial life, including expenses temporarily paid on behalf of close people.

The first version is designed for one authenticated user at a time. It is not a shared household finance app, accounting system, corporate reimbursement platform, or multi-user collaboration tool.

## Main Workflows

### 1. Monthly Decision Review

The user opens the dashboard and sees:

- Current projected balance
- Upcoming obligations
- Credit card invoice pressure
- Pending reimbursements
- Risky bills or debts
- Suggested payment priorities

### 2. Credit Card Invoice Management

The user registers credit cards, invoices, and transactions. Transactions can be classified as:

- Personal expense
- Third-party expense
- Reimbursable expense
- Installment purchase
- Planned or unplanned purchase

The invoice view should show what belongs to the user and what should be reimbursed by someone else.

### 3. Reimbursement Tracking

The user creates reimbursements linked to a person and an original expense, transaction, invoice, or payable item.

The system tracks:

- Amount expected
- Amount received
- Person responsible
- Due date or expected date
- Settlement status
- Related card invoice or payable

### 4. Payment Planning

The user creates a monthly payment plan with items such as:

- Bills to pay
- Debts to settle
- Credit card invoices
- Optional purchases
- Planned installments
- Items that can wait

The plan helps answer what should be paid now and what can be deferred.

### 5. Cash Flow Projection

The system projects current and future monthly balances using:

- Income sources
- Accounts payable
- Credit card invoices
- Installments
- Planned purchases
- Expected reimbursements
- Goals

The projection must clearly distinguish confirmed money from expected reimbursement money.

### 6. Import Review

The user will later import CSV or XLSX files. Imported rows must go through preview and validation before being saved as official records.

The import process should support mapping rows to modules such as credit card transactions, accounts payable, reimbursements, and income.

## MVP Scope

The MVP should include:

- Login and user-owned data
- Profiles
- People
- Categories
- Income sources
- Accounts payable
- Credit cards
- Credit card invoices
- Credit card transactions
- Reimbursements as first-class entities
- Installments
- Payment plans
- Planned purchases
- Goals
- Notes
- Import batch and import row structure for future CSV/XLSX preview
- Basic dashboard for decisions and monthly projections

The MVP should not include:

- Open Finance integration, OCR, WhatsApp automation, PDF parsing, scraping and AI features
- Native mobile app
- Complex multi-user collaboration
- Automated bank sync
- Advanced investment tracking
- Full accounting reports
