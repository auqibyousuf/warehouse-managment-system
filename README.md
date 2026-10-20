# Warehouse Management System (BatchIQ)

An industrial-grade, multi-platform Warehouse and Manufacturing Operations Management System built with **React Native**, **Expo SDK 58**, **PanelUI Native**, and **Tailwind CSS (Uniwind)**.

Designed for manufacturing plants, feed processing factories, formulation mills, and multi-category warehouse operations to track production batches, raw material/packaging stock levels, purchases, sales invoices, and supplier/customer financial ledgers in real-time.

> **Status:** personal-use build, no login yet. Data is stored on this device (SQLite on phones, localStorage on web; a snapshot of the in-memory database in `src/services/api/mockDatabase.ts`) and starts from sample data. Save and restore a JSON backup, or clear everything, from Settings. There is no server or sync yet. Native modules (`panelui-native`, `uniwind`, `react-native-worklets`) require a development build, not Expo Go.
>
> Checks: `npm run lint`, `npm run typecheck` and `npm test`. Product/architecture audit: `AUDIT.md`. Design rules: `docs/design-system.md`.

---

## 🚀 Key Features

Bottom tabs: **Home, Batches, Stock, Invoices**. Everything else (recipes, suppliers, customers, expenses, movements, settings) is reached from the top bar and the Manage list.

### Home
- Overview tiles (units produced, batches done, stock alerts, customer dues) for Today, This Week, This Month or All Time; each opens the place it summarises.
- "Needs attention": overdue invoices and the customers who owe the most. A card for batches running now.

### Batches (production)
- **Recipes** list the stock items and quantities for one mix. Output is optional, because it is only known after mixing.
- **Start Batch** loads the mixer: pick a recipe, set mixer loads, edit amounts used, and see Ready/Short per item. Ingredients are deducted immediately and the batch shows as Running.
- **Complete Batch** records what it made (packs, pack size, wastage). Finished stock, packaging and the final cost per pack are booked then. **Cancel run** returns the materials.
- Recipes can be edited (new version, past batches keep the old one) or deleted (archived when they have history).

### Stock
- Raw materials, packaging and finished goods with search, filters and low-stock alerts.
- Add Stock (purchase), Use Stock (consumption or waste), Count Stock (physical count), and edit or delete items. A full movement ledger records every change.

### Invoices and money
- Create Invoice with payment terms (Immediate, Net 7/15/30), credit-limit warning, partial payment, PDF share. Receive Payment against a customer or one invoice. Add Expense. Customers and suppliers are added and edited as full pages.

### Settings
- Business profile, currency, units and alert levels are all editable; nothing is hard-coded. Backup, restore and start-fresh live here.

### Conventions
- Light and dark follow the device. Fonts are Hanken Grotesk and JetBrains Mono. Colors, sizes and radii come from `src/theme`.
- Action flows are full pages built from `src/components/flow`; they are routes under `/sheets/<name>`.
- Branches are named by purpose (`feature/...`, `fix/...`, `docs/...`).

---

## 🛠 Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) / [Expo SDK 58](https://docs.expo.dev/) (New Architecture ready)
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

# Lint and tests
npm run lint
npm test

# Diagnose Expo configuration and dependencies
npx expo-doctor
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
