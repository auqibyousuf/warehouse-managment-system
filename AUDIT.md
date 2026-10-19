# BatchIQ Audit (role-based)

Reviewed through the five standing roles in `.claude/roles/`. Users: factory operator, store/purchase staff, sales staff, owner.
Status: items marked **Fixed** are in this change; the rest are recommendations.

## 1. Principal Product Manager

**Verdict: Approve with Changes.**

- The scope is right for an MVP: production runs, stock ledger, purchases, sales, payments, expenses. Each module has a clear user and problem.
- Dashboard "today / week / month" filters were pinned to 18 Oct 2026, so the numbers were wrong on any other date. **Fixed** (real calendar, week starts Monday).
- The dashboard invented a 334 average cost per unit when no batches exist. A made-up number in a finance view erodes trust. **Fixed** (shows 0).
- A new sale defaulted to 20 units and silently sold 20 when the quantity was empty. That is a feed-factory assumption in a generic product. **Fixed** (default 1, no silent fallback).
- Document numbers (invoice, receipt, purchase, batch, expense) came from `list.length + 1` with a hardcoded year. Deleting or cancelling a record could produce duplicates, which is an accounting risk. **Fixed** (next number from the highest existing, current year).
- Must have next: real persistence, because data is lost on reload. Should have: roles and permissions (owner vs. staff), because the product has no auth and every user can reverse batches and cancel invoices. Won't have now: more modules.
- Success metrics to track: time to record a purchase or sale, batch-reversal rate, and stock-adjustment frequency (a proxy for ledger trust).

## 2. Head of Product Design

**Readiness: 68/100. Approve with Changes.**

- Clear visual identity and one design system, with tokens for color, type, spacing and radii.
- Critical: no accessibility. No accessibility labels, roles or states anywhere, and the modal close target was 32pt. **Fixed** in the shared components (`Button`, `Card`, `ListItem`, `TabBar`, `ChipPicker`, `Header`, `FeedbackBanner`, `Modal`). The close target is now 44pt.
- High: 8 hardcoded colors bypassed the tokens, a second slate palette plus a duplicate amber. **Fixed** (token references).
- High: the modal sheet body was fixed at 460pt, which was cramped on tablets and landscape, and Android had no keyboard avoidance. **Fixed** (60% of window height, Android `height` behavior).
- Medium: about 115 inline spacing and font values still bypass the tokens. **Open**, to be moved onto tokens screen by screen.
- Medium: light mode only. **Open** (deliberate for now).
- Inconsistency: both Uniwind `className` and `StyleSheet` are used. **Open**, pick one in the design system.

## 3. Senior UX Designer

- Forms: errors surface via banners and field messages. The sale form no longer pre-fills a misleading quantity. **Fixed**.
- Open: long modal forms (`CreateSetupModal` 549 lines, `StartRunModal` 464 lines) should be split into steps (recipe, then quantities, then review). Open: no confirmation summary before stock-affecting actions other than delete.
- Open: ledger and invoice lists are `.map` inside `ScrollView`. Move to `FlatList` before data grows.
- Copy: empty states in `RecordPurchaseModal` used "Click"; changed to "Tap" for a mobile-first product. **Fixed**.

## 4. Information Architect

- Top level (Dashboard, Production, Stock, Sales, More) matches intent. "More" hides customers, expenses, company profile and suppliers' ledger, which are daily-use for sales and purchase staff.
- Recommended tree: Dashboard / Production / Stock (materials, suppliers, purchases) / Sales (invoices, customers, payments) / More (expenses, company profile). Move Customers under Sales and Suppliers stays under Stock. **Open** (needs PM sign-off).
- Terminology is mixed ("bags" and "units", "setup" and "formula" and "recipe"). Pick one set. **Open**.
- Role separation (owner vs. staff) is not modeled anywhere. **Open**.

## 5. Principal System Architect

- Boundaries are sound: `services/api` (business rules), `hooks/api` (React Query), `modules/*` (UI), `stores` (UI state), `theme`, `validation`.
- `as any` on all 9 `zodResolver` calls hid a real input/output type mismatch caused by `.default()`. **Fixed**: forms now use `useForm<Input, unknown, Output>` with exported `*FormInput` types, no casts.
- `EditIngredientModal` set state inside an effect (cascading renders, lint error). **Fixed** (derived during render).
- `closeModal` left `selectedCustomerId` behind, so later modals opened with a stale customer. **Fixed**.
- Haptics calls were wrapped in `try/catch` around promises, which cannot catch rejections. **Fixed** (`src/utils/haptics.ts`).
- Tooling: no `lint` or `typecheck` scripts or ESLint config. **Fixed** (`npm run lint`, `npm run typecheck`, `eslint.config.js`). Lint is 0 errors; 8 warnings remain, mostly React Compiler notices about react-hook-form's `watch()` that need `useWatch` per form.
- README claimed Expo SDK 54 (the project is on 58) and did not say data is in memory or that a development build is required. **Fixed**.
- Open, biggest item: routing is a tab switch in `AppNavigator` with 12 globally mounted modals, while `AGENTS.md` requires Expo Router in `src/app/`. Migrating gives deep links, a back stack and route-based sheets. It is a large cross-cutting change, so it should be its own PR, planned after persistence. Tradeoff: this is deferred cost, but doing it together with this fix batch would have made the change unreviewable.
- Open: no tests. Start with the ledger logic in `services/api` (stock deduction and reversal, balances, document numbering).
- Open: split `SalesScreen` (669 lines) into list, filters and invoice table.
