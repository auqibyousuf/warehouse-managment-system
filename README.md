# Warehouse Management System (BatchIQ)

An industrial-grade, multi-platform Warehouse and Manufacturing Operations Management System built with **React Native**, **Expo SDK 58**, **PanelUI Native**, and **Tailwind CSS (Uniwind)**.

Designed for manufacturing plants, feed processing factories, formulation mills, and multi-category warehouse operations to track production batches, raw material/packaging stock levels, purchases, sales invoices, and supplier/customer financial ledgers in real-time.

> **Status:** prototype. Data lives in an in-memory mock database (`src/services/api/mockDatabase.ts`) and resets on reload. Native modules (`panelui-native`, `uniwind`, `react-native-worklets`) require a development build, not Expo Go.
>
> Checks: `npm run lint`, `npm run typecheck` and `npm test`. Product/architecture audit: see `AUDIT.md`.

---

## 🚀 Key Features

### 1. Operations Dashboard
- Real-time KPI metrics for production runs, sales turnover, cash collections, and outstanding dues.
- Dynamic period filtering: *Today*, *This Week*, *This Month*, *All Time*.
- Proactive low-stock safety threshold alerts.
- Quick action triggers for starting batch runs, recording inward purchase bills, logging sales invoices, and customer payments.

### 2. Production Control & Recipe Formulation
- **Reusable Production Setups (Formulas)**: Create and manage persistent standard recipes with customizable output units (e.g., bags, drums, bottles, metric tons, kg).
- **Inline Material Creation**: Register new raw materials with custom units directly during recipe formulation.
- **Production Batches & Ledger Integration**: Starting batch runs automatically deducts raw materials/packaging from stock and increments finished goods.
- **Batch History & Audit Reversals**: Complete audit trail of completed runs with reversal safeguard options.

### 3. Inventory & Warehouse Stock Ledger
- **Multi-Category Tracking**: Raw materials, packaging materials, and finished goods floor stock.
- **Dynamic Measurement Units**: Full support for custom units (`kg`, `L`, `tons`, `bags`, `drums`, `pcs`, etc.).
- **Live Stock Editing & Deletion**: Update stock items, standard purchase costs, safety alert thresholds, and current stock counts (with automatic ledger reconciliation entries).
- **Dependency Guardrails**: Prevents accidental deletion of ingredients that are actively referenced by active formulas.
- **Stock Movement Ledger**: Complete transaction history with reference IDs (purchases, production outputs, count adjustments, dispatches).

### 4. Procurement & Supplier Ledger
- **Vendor Registration**: Manage suppliers with GST numbers, contact phones, and factory addresses.
- **Purchase Bills (Inward Stock)**: Record bills with custom bill numbers, rate, quantity, and payment breakdowns (Paid vs. Outstanding Due).
- **Accounts Payable**: Live balance due tracking per vendor with inline quick-billing.

### 5. Sales & Invoicing
- **Customer Directory**: Customer profiles, phone numbers, addresses, and balance receivables.
- **Purchase Orders & Invoices**: Generate professional sales invoices with automatic tax, discount, and net balance calculations.
- **Detailed Data Tables**: Invoiced items breakdown and payment reconciliation.

---

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 54](https://docs.expo.dev/) (New Architecture ready)
- **UI Components**: [PanelUI Native](https://github.com/) & [Tailwind CSS (Uniwind)](https://uniwind.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Server State / Cache**: [TanStack React Query v5](https://tanstack.com/query/latest)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons**: [Expo Vector Icons (Ionicons)](https://icons.expo.fyi/)
- **Haptics**: [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- **Cross-Platform**: Web, iOS, and Android support

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/auqibyousuf/warehouse-managment-system.git

# Navigate to project directory
cd warehouse-managment-system

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Metro bundler with cache reset
npx expo start -c

# Run on Web directly
npx expo start --web
```

### Verification & Diagnostic Checks
```bash
# Run TypeScript type check
npx tsc --noEmit

# Diagnose Expo configuration and dependencies
npx expo-doctor
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
