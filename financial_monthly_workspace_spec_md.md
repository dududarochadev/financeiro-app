# Financial Monthly Workspace — Product Specification

## Product Vision

This application is NOT a traditional finance manager, accounting system, banking dashboard, or expense analytics platform.

The core objective is:

> Provide the fastest, clearest, and most satisfying monthly financial closing experience possible.

The product exists to help the user:

- Quickly understand what still needs to be paid
- Group payments operationally
- Pay multiple items efficiently
- Track recurring expenses and installments
- Visualize upcoming months
- Maintain historical financial records
- Use the system comfortably on mobile

This is essentially:

> A monthly financial operations workspace.

The application should feel:

- Fast
- Minimal
- Operational
- Mobile-first
- Pleasant to use
- Frictionless

The UX must prioritize:

- Speed
- Clarity
- Low cognitive load
- Few clicks
- Smooth interactions
- Excellent mobile responsiveness

Avoid turning the application into:

- An ERP
- Accounting software
- A bank dashboard
- A complex analytics platform
- A spreadsheet clone

---

# Main User Flow

## During the month

The user:

- Adds expenses quickly
- Adds installment purchases
- Adds recurring expenses
- Adds optional income entries
- Occasionally edits past months

---

## Salary/payment day

The user:

- Opens the app
- Clicks "Pay Bills"
- Sees pending items grouped operationally
- Pays groups together
- Marks groups as paid
- Watches pending items disappear
- Sees remaining balance update instantly

This is the PRIMARY PRODUCT FLOW.

The "Pay Bills" experience is the most important feature in the application.

---

# Product Philosophy

## Important

This product is NOT focused on:

- Deep analytics
- Spending reports
- Investment tracking
- Banking integrations
- Financial charts
- Financial coaching

This product IS focused on:

- Monthly operational execution
- Financial closure workflow
- Payment organization
- Future visibility
- Simplicity
- Speed

---

# Core Concepts

## Wallets

The application supports multiple wallets.

Examples:

- Personal
- Company
- Side projects

Each wallet has completely separated data.

---

## Transaction Templates

Represents recurring or installment definitions.

Examples:

- Spotify monthly
- Internet bill
- MacBook 12x installment
- Monthly salary

Templates generate monthly occurrences.

---

## Transaction Occurrences

Represents the actual monthly item.

Examples:

- Spotify — June 2026
- Internet — July 2026
- MacBook installment 3/12

Occurrences:

- Can be individually paid
- Maintain history forever
- Store actual payment data
- Can diverge from template values

Past occurrences should NEVER be automatically rewritten.

---

# Core Features

## 1. Wallets

Features:

- Create wallet
- Edit wallet
- Switch wallet
- Separate data per wallet

---

## 2. Google Authentication

Authentication should use:

- Supabase Auth
- Google Login

Requirements:

- No password system
- Minimal friction
- Future SaaS-ready architecture
- Free-tier compatible

---

## 3. Monthly Navigation

The app must allow:

- Previous month navigation
- Future month navigation
- Year navigation

Future months should already display generated recurring/installment items.

Users must also be able to edit past months.

---

## 4. Recurring Transactions

Examples:

- Rent
- Spotify
- Salary
- Internet
- Client recurring payment

Features:

- Monthly recurrence
- Infinite recurrence support
- Future-only editing
- Edit all
- Edit single occurrence

Behavior must mimic Google Calendar recurrence logic.

When editing:

Options:

- Edit this occurrence only
- Edit this and future occurrences
- Edit entire series

Past paid items MUST remain historically correct.

---

## 5. Installments

Installments are modeled as finite recurrences.

Example:

- MacBook
- 12 installments
- Starting May 2026

The system generates:

- 1/12
- 2/12
- 3/12
- etc

Requirements:

- Show current installment progress
- Show remaining installments
- Automatically stop generating after final installment
- Preserve full history forever

---

## 6. Expenses and Income

The system supports:

- Expenses
- Income

Both share the same base structure.

Transaction types:

- expense
- income

Income is optional.

If there is no income for the month:

- Show 0
- Never break calculations

---

## 7. Operational Grouping

This is one of the CORE FEATURES.

Transactions should be groupable by operational destination.

Examples:

- Nubank
- BB Credit Card
- PIX Father
- Itaú
- Company

The objective:

Allow the user to pay multiple items together.

Example:

PIX Father:

- Internet = 120
- Market = 80
- Installment = 300

Total group:

500

The user makes ONE PIX transfer and then clicks:

- "Mark Group as Paid"

This is critical.

---

## 8. Pay Bills Mode

This is the PRIMARY PRODUCT FEATURE.

The app should contain a dedicated flow:

# Pay Bills

Behavior:

- Shows pending items only
- Grouped operationally
- Displays total per group
- Allows marking group as paid
- Allows granular payment too
- Updates balance instantly
- Removes paid items from pending flow

Example:

Group:

BB Credit Card

Contains:

- Netflix
- Amazon
- MacBook installment

Total:

R$ 1.250

Actions:

- Mark group as paid
- Mark individual item as paid

After all groups are paid:

Show pleasant completion state.

Example:

"Everything paid 🎉"

The UX should feel satisfying and frictionless.

---

# Main Home Screen

The home screen should prioritize:

- Pending items
- Upcoming payments
- Quick actions
- Operational clarity

NOT dashboards.

---

## Home Layout

### Top section

Displays:

- Current wallet
- Current month/year

---

### Financial summary cards

Cards:

- Pending total
- Paid total
- Income total
- Expected balance

Expected balance:

Income - Pending

If no income exists:

Use 0.

---

### Main section

# Pending Items List

Requirements:

- Pending first
- Grouped operationally
- Mobile optimized
- Extremely scannable

Each item should display:

- Name
- Amount
- Paid amount if different
- Installment progress
- Optional due date
- Group/origin
- Tags
- Status

---

## Quick Actions

Primary CTA:

# Pay Bills

Secondary CTA:

# Add Transaction

---

# UX Rules

## Mobile-first is mandatory

The app is primarily used:

- On mobile
- During real payments
- During monthly closing
- In operational situations

Desktop support must still be excellent.

---

## List-first design

The application is LIST-FIRST.

Avoid:

- Heavy tables
- Spreadsheet UI
- Complex dashboards

Prefer:

- Cards
- Clean grouped lists
- Clear typography
- Large tap areas

---

## Performance is critical

The app should feel:

- Instant
- Lightweight
- Responsive
- Smooth

Avoid:

- Excessive animations
- Slow transitions
- Over-engineered state flows

---

## Editing UX

Inline editing is preferred.

Recommended behavior:

- User clicks edit icon
- Field unlocks
- Prevent accidental edits

Avoid requiring modals for everything.

---

## Paid items visibility

The app should support:

- Hide paid items
- Show paid items toggle

The default focus should always be:

# What still needs to be paid.

---

# Transaction Structure

## Suggested Fields

### Base Transaction

- id
- walletId
- type (income/expense)
- title
- description
- expectedAmount
- paidAmount
- status
- group
- tags
- dueDate (optional)
- month
- year
- paidAt
- createdAt
- updatedAt
- deletedAt

---

## Recurrence Fields

- recurrenceType
- recurrenceInterval
- recurrenceEndDate
- templateId

---

## Installment Fields

- installmentCurrent
- installmentTotal

---

## Audit Fields

Track:

- creation
- updates
- payment
- deletion

---

# History and Audit

The application should maintain full historical data.

Requirements:

- Past months editable
- Historical occurrences preserved
- Soft delete only
- Audit visibility available

Suggested UX:

Optional details panel showing:

- Created date
- Updated date
- Paid date
- Previous values

Only visible if requested.

---

# Tags

Support lightweight tagging.

Examples:

- Market
- SaaS
- Work
- Food

Requirements:

- Fast selection
- Minimal friction
- Optional usage

Do NOT force complex categorization.

---

# Design System Direction

Visual inspiration:

- Linear
- TickTick
- Apple Reminders
- Notion

The application should feel:

- Clean
- Minimal
- Fast
- Operational
- Elegant

Avoid:

- Bank aesthetics
- Neon fintech visuals
- Excessive gradients
- Heavy dashboards
- Gamification overload

---

# Recommended Technical Stack

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

---

## Backend / Database

- Supabase

Use:

- PostgreSQL
- Auth
- Realtime-ready structure

---

## Authentication

- Google OAuth via Supabase

---

## Hosting

- Vercel

---

## PWA

The application should be installable as a PWA.

Requirements:

- Mobile install support
- Responsive layouts
- App-like feel

Offline support is NOT required for MVP.

---

# Important Engineering Rules

## DO NOT overengineer

Prioritize:

- UX
- Speed
- Simplicity
- Operational flow

Avoid:

- Microservices
- Complex backend abstractions
- Heavy DDD
- Excessive architecture
- Premature optimization

---

## MVP Priorities

The MVP MUST focus on:

- Wallets
- Google login
- Monthly navigation
- Recurring transactions
- Installments
- Pending payments
- Pay Bills flow
- Operational grouping
- Group total calculation
- Mark group as paid
- Transaction history
- Tags
- Inline editing
- Mobile-first UX
- PWA

---

# Explicit Non-Goals for MVP

Do NOT implement:

- Banking integrations
- OCR
- Receipt attachments
- Investment tracking
- Financial reports
- AI features
- Notifications
- Offline sync
- Spreadsheet import
- Advanced analytics
- Multi-user collaboration
- Accounting features

---

# Suggested Future Features (Post-MVP)

Possible future improvements:

- Notifications
- Offline mode
- Receipt attachments
- Smart recurring detection
- Spreadsheet import
- AI-assisted quick add
- Payment reminders
- Better analytics
- Shared wallets
- Team/company collaboration

These are NOT part of MVP.

---

# Final Product Goal

The final experience should feel like:

> "I received money, opened the app, paid everything in minutes, and clearly understand my month."

That is the primary success metric of the product.
