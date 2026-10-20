/**
 * Cattle Feed Factory Management - Mock Database
 * Relational memory store initialized with verified seed data and atomic transaction simulations.
 */

import {
  FactorySettings,
  Product,
  Ingredient,
  ProductionSetup,
  ProductionBatch,
  InventoryMovement,
  Supplier,
  Purchase,
  Customer,
  SaleInvoice,
  CustomerPayment,
  Expense,
} from '../../types';
import { createDeviceSnapshotStore } from '../storage/deviceStore';
import { DB_SCHEMA_VERSION } from '../storage/schemaVersion';

export interface DatabaseState {
  settings: FactorySettings;
  products: Product[];
  ingredients: Ingredient[];
  setups: ProductionSetup[];
  batches: ProductionBatch[];
  movements: InventoryMovement[];
  suppliers: Supplier[];
  purchases: Purchase[];
  customers: Customer[];
  invoices: SaleInvoice[];
  payments: CustomerPayment[];
  expenses: Expense[];
}

export const initialDatabase: DatabaseState = {
  settings: {
    factoryName: 'My Business',
    tagline: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    termsAndConditions: '',
    currencySymbol: '₹',
    defaultUnitName: 'bags',
    defaultUnitSize: 20,
    defaultBaseUnit: 'kg',
    lowStockThresholdKg: 400,
    lowUnitsThreshold: 50,
    defaultBagWeightKg: 20,
    lowBagsThreshold: 50,
  },

  products: [
    {
      id: 'prod-1',
      name: 'NutraMax High-Yield Feed 20kg',
      outputUnit: 'bags',
      unitSize: 20,
      baseUnit: 'kg',
      sellingPricePerUnit: 520,
      currentStockUnits: 80,
      bagWeightKg: 20,
      sellingPricePerBag: 520,
      currentStockBags: 80,
      description: 'Balanced dairy cattle feed enriched with bypass fats and digestive minerals.',
      isActive: true,
    },
  ],

  ingredients: [
    {
      id: 'ing-1',
      name: 'Rice Bran (Deoiled/Chokar)',
      category: 'raw_material',
      unit: 'kg',
      unitCost: 14,
      currentStock: 2500,
      minThreshold: 500,
      isActive: true,
    },
    {
      id: 'ing-2',
      name: 'Raab / Cane Molasses',
      category: 'raw_material',
      unit: 'kg',
      unitCost: 32,
      currentStock: 600,
      minThreshold: 200,
      isActive: true,
    },
    {
      id: 'ing-3',
      name: 'Mineral Salt & Premix',
      category: 'raw_material',
      unit: 'kg',
      unitCost: 8,
      currentStock: 200,
      minThreshold: 50,
      isActive: true,
    },
    {
      id: 'ing-4',
      name: 'Empty HDPE Bags (20kg)',
      category: 'packaging',
      unit: 'pcs',
      unitCost: 18,
      currentStock: 400,
      minThreshold: 100,
      isActive: true,
    },
  ],

  setups: [
    {
      id: 'setup-1',
      name: 'NutraMax 20-Bag Batch Setup',
      productId: 'prod-1',
      productName: 'NutraMax High-Yield Feed 20kg',
      outputUnit: 'bags',
      unitSize: 20,
      baseUnit: 'kg',
      targetUnits: 20,
      bagWeightKg: 20,
      targetBags: 20,
      status: 'active',
      version: 1,
      effectiveDate: '2026-10-01',
      notes: 'Standard batch formulation for daily production run.',
      recipeItems: [
        {
          ingredientId: 'ing-1',
          ingredientName: 'Rice Bran (Deoiled/Chokar)',
          targetQuantity: 300,
          unit: 'kg',
        },
        {
          ingredientId: 'ing-2',
          ingredientName: 'Raab / Cane Molasses',
          targetQuantity: 80,
          unit: 'kg',
        },
        {
          ingredientId: 'ing-3',
          ingredientName: 'Mineral Salt & Premix',
          targetQuantity: 20,
          unit: 'kg',
        },
      ],
    },
  ],

  batches: [],

  movements: [
    {
      id: 'mov-1',
      date: '2026-10-16',
      itemId: 'ing-1',
      itemName: 'Rice Bran (Deoiled/Chokar)',
      itemType: 'raw_material',
      movementType: 'purchase',
      quantity: 2500,
      unit: 'kg',
      direction: 'in',
      referenceType: 'purchase',
      referenceId: 'pur-001',
      notes: 'Received bulk delivery from Annapurna Raw Materials Co.',
    },
    {
      id: 'mov-2',
      date: '2026-10-18',
      itemId: 'prod-1',
      itemName: 'NutraMax High-Yield Feed 20kg',
      itemType: 'finished_feed',
      movementType: 'sale_dispatch',
      quantity: 20,
      unit: 'bags',
      direction: 'out',
      referenceType: 'sale',
      referenceId: 'inv-101',
      notes: 'Dispatched to Shree Balaji Agro Traders',
    },
  ],

  suppliers: [
    {
      id: 'sup-1',
      name: 'Annapurna Raw Materials Co.',
      phone: '+91 98200 11223',
      balanceDue: 15000,
    },
  ],

  purchases: [
    {
      id: 'pur-001',
      purchaseNumber: 'PUR-2026-001',
      date: '2026-10-16',
      supplierId: 'sup-1',
      supplierName: 'Annapurna Raw Materials Co.',
      supplierPhone: '+91 98200 11223',
      billNumber: 'BILL-8821',
      itemId: 'ing-1',
      itemName: 'Rice Bran (Deoiled/Chokar)',
      quantity: 2500,
      unit: 'kg',
      unitPrice: 14,
      totalAmount: 35000,
      amountPaid: 20000,
      balanceDue: 15000,
      paymentStatus: 'partial',
      notes: 'Bulk truckload inward. Balance payable within 15 days.',
    },
  ],

  customers: [
    {
      id: 'cust-1',
      name: 'Shree Balaji Agro Traders',
      phone: '+91 98450 12345',
      email: 'balajiagro@example.com',
      address: 'Shop #14, APMC Market Yard, Pune - 411037',
      gstin: '27AAACB2345D1Z8',
      creditLimit: 50000,
      totalPurchases: 10400,
      totalPaid: 5400,
      outstandingBalance: 5000,
      notes: 'Wholesale distributor. Credit cycle: 15 days.',
    },
    {
      id: 'cust-2',
      name: 'Kisan Seva Dairy Farm',
      phone: '+91 94250 67890',
      email: 'kisansevamilk@example.com',
      address: 'Gat No. 108, Manchar Road, Khed, Pune - 410505',
      gstin: '27BZPPA9876C1ZF',
      creditLimit: 25000,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      notes: 'Direct farm buyer. Prompt bank payments.',
    },
  ],

  invoices: [
    {
      id: 'inv-101',
      invoiceNumber: 'INV-2026-001',
      date: '2026-10-18',
      customerId: 'cust-1',
      customerName: 'Shree Balaji Agro Traders',
      customerPhone: '+91 98450 12345',
      customerAddress: 'Shop #14, APMC Market Yard, Pune - 411037',
      customerGstin: '27AAACB2345D1Z8',
      productId: 'prod-1',
      productName: 'NutraMax High-Yield Feed 20kg',
      quantity: 20,
      outputUnit: 'bags',
      bagQuantity: 20,
      unitPrice: 520,
      subtotal: 10400,
      discount: 0,
      totalAmount: 10400,
      amountPaid: 5400,
      balanceDue: 5000,
      paymentStatus: 'partial',
      isCredit: true,
      notes: 'Dispatched via Tempo MH-12-AB-3456. Balance due in 15 days.',
    },
  ],

  payments: [
    {
      id: 'pay-001',
      paymentNumber: 'REC-2026-001',
      date: '2026-10-18',
      customerId: 'cust-1',
      customerName: 'Shree Balaji Agro Traders',
      invoiceId: 'inv-101',
      amount: 5400,
      paymentMethod: 'upi',
      notes: 'Advance UPI transfer at the time of loading.',
    },
  ],

  expenses: [],
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const snapshots = createDeviceSnapshotStore<DatabaseState>();

// Active database: the saved snapshot when there is one, otherwise the demo seed.
// Spreading over the seed keeps newly added collections defined after an app update.
const saved = snapshots.load();
let db: DatabaseState = saved ? { ...clone(initialDatabase), ...saved } : clone(initialDatabase);

/** Queue a save of the current state. Called after every completed API call. */
export const persistDB = (): void => snapshots.scheduleSave(() => db);

export const getDB = (): DatabaseState => db;

/** Back to the demo seed (also overwrites what is saved on the device). */
export const resetDB = (): void => {
  db = clone(initialDatabase);
  snapshots.saveNow(db);
};

const COLLECTIONS = [
  'products',
  'ingredients',
  'setups',
  'batches',
  'movements',
  'suppliers',
  'purchases',
  'customers',
  'invoices',
  'payments',
  'expenses',
] as const;

/** Everything on this device as one JSON document, for a backup file. */
export const exportDatabase = (): string =>
  JSON.stringify({
    app: 'batchiq',
    version: DB_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: db,
  });

/** Replace everything with a backup made by exportDatabase. Throws a readable message if it is not one. */
export const importDatabase = (json: string): void => {
  let parsed: any;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('This file is not a BatchIQ backup.');
  }
  if (parsed?.app !== 'batchiq' || !parsed.data)
    throw new Error('This file is not a BatchIQ backup.');
  if (parsed.version !== DB_SCHEMA_VERSION) {
    throw new Error('This backup was made by a different version of BatchIQ.');
  }
  const data = parsed.data;
  if (!data.settings || COLLECTIONS.some((key) => !Array.isArray(data[key]))) {
    throw new Error('This backup is incomplete.');
  }
  db = { ...clone(initialDatabase), ...data };
  snapshots.saveNow(db);
};

/** Empty every record but keep the business settings, for starting real work. */
export const clearDatabase = (): void => {
  const empty = clone(initialDatabase);
  for (const key of COLLECTIONS) (empty as any)[key] = [];
  db = { ...empty, settings: db.settings };
  snapshots.saveNow(db);
};
