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
- Persistence: **done (local-first)**. The database is saved on the device (`expo-sqlite/kv-store`, versioned snapshot, debounced after each API call) and restored at startup. Business, Sample Data, has a confirmed "Reset to Sample Data". Still needed for multi-user: a real backend behind `services/api` (the service layer is unchanged, so it can be swapped). Must have next after that: Should have: roles and permissions (owner vs. staff), because the product has no auth and every user can reverse batches and cancel invoices. Won't have now: more modules.
- Success metrics to track: time to record a purchase or sale, batch-reversal rate, and stock-adjustment frequency (a proxy for ledger trust).

## 2. Head of Product Design

**Readiness: 68/100. Approve with Changes.**

- Clear visual identity and one design system, with tokens for color, type, spacing and radii.
- Critical: no accessibility. No accessibility labels, roles or states anywhere, and the modal close target was 32pt. **Fixed** in the shared components (`Button`, `Card`, `ListItem`, `TabBar`, `ChipPicker`, `Header`, `FeedbackBanner`, `Modal`). The close target is now 44pt.
- High: 8 hardcoded colors bypassed the tokens, a second slate palette plus a duplicate amber. **Fixed** (token references).
- High: the modal sheet body was fixed at 460pt, which was cramped on tablets and landscape, and Android had no keyboard avoidance. **Fixed** (60% of window height, Android `height` behavior).
- Medium: about 115 inline spacing and font values bypassed the tokens. **Fixed** (all on `theme.spacing` / `theme.typography`; new `hairline`, `xsm`, `smd` steps added for the 1/6/10 values in use).
- Medium: light mode only. **Open** (deliberate for now).
- Inconsistency: both Uniwind `className` and `StyleSheet` are used. **Open**, pick one in the design system.

## 3. Senior UX Designer

- Forms: errors surface via banners and field messages. The sale form no longer pre-fills a misleading quantity. **Fixed**.
- Long modal forms are now three-step flows with a progress indicator, Back/Next, and per-step validation: **Fixed** for `CreateSetupModal` (Basics, Output, Ingredients) and `StartRunModal` (Recipe, Output, Materials & cost). The cost summary on the last step doubles as the review before stock changes.
- Ledger, invoice, purchase, payment, stock, supplier, recipe, batch, customer and expense lists are now windowed through `ScreenList` (`FlatList`). **Fixed**. The sold/received item tables and the dashboard's short recent lists stay as they are.
- Copy: empty states in `RecordPurchaseModal` used "Click"; changed to "Tap" for a mobile-first product. **Fixed**.

## 4. Information Architect

- Top level (Dashboard, Production, Stock, Sales, Business) matches intent. "More" was a catch-all label that hid customers, expenses and company profile; renamed **Business**. **Fixed**.
- Recommended tree: Dashboard / Production / Stock (materials, suppliers, purchases) / Sales (invoices, customers, payments) / More (expenses, company profile). Move Customers under Sales and Suppliers stays under Stock. **Open** (needs PM sign-off).
- Terminology: user-facing text now says **Recipe** (was setup / formula / formulation) and **Batch** (was run / production run). **Fixed**. Internal type and field names (`setup`, `bagQuantity`) are unchanged to avoid a risky data-model rename; remove them with the persistence work.
- Role separation (owner vs. staff) is not modeled anywhere. **Open**.

## 5. Principal System Architect

- Boundaries are sound: `services/api` (business rules), `hooks/api` (React Query), `modules/*` (UI), `stores` (UI state), `theme`, `validation`.
- `as any` on all 9 `zodResolver` calls hid a real input/output type mismatch caused by `.default()`. **Fixed**: forms now use `useForm<Input, unknown, Output>` with exported `*FormInput` types, no casts.
- `EditIngredientModal` set state inside an effect (cascading renders, lint error). **Fixed** (derived during render).
- `closeModal` left `selectedCustomerId` behind, so later modals opened with a stale customer. **Fixed**.
- Haptics calls were wrapped in `try/catch` around promises, which cannot catch rejections. **Fixed** (`src/utils/haptics.ts`).
- Tooling: no `lint` or `typecheck` scripts or ESLint config. **Fixed** (`npm run lint`, `npm run typecheck`, `eslint.config.js`). Lint is 0 errors; 8 warnings remain, mostly React Compiler notices about react-hook-form's `watch()` that need `useWatch` per form.
- README claimed Expo SDK 54 (the project is on 58) and did not say data is in memory or that a development build is required. **Fixed**.
- Routing: **done**. Expo Router owns navigation (`src/app`: `(tabs)` group, root layout with providers). All 14 sheets are now routes at `/sheets/<name>?<params>` through one registry (`src/app/sheets/[sheet].tsx`), opened with `openSheet()` and closed with `closeSheet()` from `src/navigation/sheets.ts`. The store no longer holds modal state or selected ids, and chained flows (invoice, then payment) replace the sheet instead of stacking. Open: sheets have no slide-out animation on close, and the edit-material and nested create-material/supplier sheets still open from local state.
- Tests: **Fixed**. `npm test` runs 12 tests over document numbering, sales, purchases, adjustments and production. They found a real bug: reversing a batch after its output was sold clamped stock at 0 and left the ledger inflated. Reversal now refuses with a clear message. UI and form tests are still open.
- Open: split `SalesScreen` (669 lines) into list, filters and invoice table.

## 6. Modern UI refresh and editability (latest)

**Root cause of the clipped cards, rounded headings and highlighted first button:** the shared `Box` wrapped PanelUI's `Surface`, which adds `overflow-hidden` and a 12px radius to every wrapper. It clipped card borders and shadows, rounded text highlights, and cut long text. `Box` is now a plain `View`; `Card` has one radius source. **Fixed globally.**

**Design system (Head of Product Design):**
- Typography: Manrope (headings, metrics) and Inter (reading text), loaded in the root layout behind the splash screen. Weights map to loaded faces, not `fontWeight`.
- Softer radii (cards 20, sheets 28, inputs 12-14, pills full), softer shadows, pill chips and badges, filled-icon tab bar with a pill indicator, circular icon chips on stat cards.
- Headers wrap instead of overflowing; chip rows wrap; verified with no horizontal overflow on all five tabs at 390px width.

**Editability (Product Manager, no hardcoded business data):**
- The dashboard business name is tappable and opens the profile editor. The seed identity is generic ("My Business", blank address and bank details). PDF and screen fallbacks no longer name a company or city.
- New edit flows: customer, supplier, finished product (name, price, description). Issued invoices and bills keep the names they were issued with.
- Cattle-feed wording removed from user-facing copy.
- Still baked in and worth making settings: the currency symbol (the setting exists, but screens show the rupee sign), default units, and low-stock thresholds.

**Login and accounts: Won't Have (now).** Personal single-user use. Required before a public launch, together with a backend and owner/staff roles.

## 7. Stitch redesign (latest)

Source: Stitch project "BatchIQ Warehouse Operations Manager" (20 screens, light and dark). Full guide: `docs/design-system.md`.

- **Appearance:** automatic light and dark from the device setting. Light is blue-led (`#004ac6`), dark is amber-led (`#f59e0b`). Colors come from `useColors()`; the old static `theme.colors` was removed so the compiler flags any leftover.
- **Type:** Hanken Grotesk + JetBrains Mono with the exact Stitch sizes (36/28/22/20/16/14/12/11/18). One type system for both appearances.
- **Shape:** Stitch radii (2/4/8/12), flat bordered cards, segmented tabs, mono caps labels, 44px buttons.
- **Information architecture (Information Architect):** Dashboard, Production, Inventory, Procure, Ledger. Procure holds purchase bills and suppliers; Ledger holds invoices, payments, customers and expenses. The Business tab became **Settings** (avatar). The duplicate "Items Data Table" report was dropped.
- **Real data only (Product Manager):** the Stitch screens for equipment, shifts, storage bins, live telemetry, QA gates and plant data-flow need data BatchIQ does not collect. They are not built and no placeholder numbers are shown.
- **Still open:** currency symbol, default units and thresholds are shown in Settings but not yet editable (the rupee sign is used directly on screens); sheet forms use the new tokens but have not been re-laid-out screen by screen; PDF invoices keep their own print palette.

## 8. Editable preferences and web persistence (latest)

- **Preferences are real settings:** Profile > Preferences edits the currency symbol, default product unit, default measure, default pack size and the finished-goods low-stock level. Money formatting (`useMoney`), new-recipe defaults, the dashboard unit names and PDF documents all read them. Address and phone are now optional, so a name-only edit saves.
- **PDFs never invent details:** invoices and bills print only what the business entered; empty sections are hidden.
- **Web persistence fixed:** the SQLite key-value store has no synchronous API in the browser, so saves silently failed there. Web now uses `localStorage` (`deviceStore.web.ts`); phones keep SQLite. Verified by reloading after a save.
- **Still open:** the sheets (create and edit forms) have not been re-laid-out against Stitch one by one; `lowStockThresholdKg` remains in the type but is unused.

## 9. Stitch "BatchIQ Lite" navigation (latest)

- **Decision (Product Manager and Information Architect):** the newest Stitch screens are BatchIQ Lite, a 3-tab app. For personal daily use it fits better than five tabs, so navigation is **Home, Stock, Invoices** plus a **Manage** list (gear icon) and **Settings** (avatar). Barcode scanning was skipped by choice.
- **Stock:** Add Stock and Use Stock tiles. "Use stock" is a recorded movement (`stock_usage` / `stock_waste`) with tests, not a count overwrite.
- **Invoices:** month overview, filters, reminder (WhatsApp link or share sheet), share PDF, record payment, monthly summary PDF.
- **Financial Ledger:** receivables, payables, net position and a transaction queue from real invoices, bills and payments.
- **Sheets:** invoice sheet shows the customer's balance against their credit limit; batch step 3 shows a stock check (needed vs on hand).
- **Removed baked-in defaults:** forms no longer fall back to customer `cust-1`, product `prod-1`, price 500, pack size 20 or threshold 100.
- **Dependencies:** updated to SDK 58 latest; deprecated transitive packages removed with overrides; install scripts approved via `allowScripts`. ESLint stays on 9.39.5 until eslint-plugin-react supports 10. Remaining audit findings are in build tooling with no patched release.

## 10. Fidelity pass and progressive disclosure (latest)

- **Why it looked unchanged:** colors and fonts matched, but card anatomy did not. Measured from the Stitch markup: cards are borderless with a soft shadow and 12px radius, status chips 2px, key figures mono 18 (28 bold for quantities), tonal fill buttons, separate pill filters, flat 64px bars. All applied through shared components, so every screen inherits them.
- **Rebuilt to the Stitch markup:** Home, Stock, Invoices. Manage lists (recipes, batches, suppliers, bills, customers, payments, expenses) use the same compact rows.
- **Progressive disclosure:** rows show only the essentials; five new detail sheets (batch, profit, stock item, recipe, supplier) hold the rest. See `docs/design-system.md`.
- **Still open:** sheets are bottom sheets, whereas Stitch shows some flows (batch run, invoice generation) as full pages with a step bar; goal bars and hero imagery are skipped because the app has no such data.
