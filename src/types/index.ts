/**
 * BatchIQ - Domain Data Types
 * Generalized for any manufacturing industry: solids, powders, liquids, slurries, or discrete packaging.
 */

export type StockUnit =
  | 'kg'
  | 'L'
  | 'pcs'
  | 'bags'
  | 'bottles'
  | 'drums'
  | 'cans'
  | 'boxes'
  | 'cartons'
  | 'tons'
  | 'units'
  | string;

export type SetupStatus = 'active' | 'paused' | 'archived';

export type BatchStatus = 'confirmed' | 'reversed';

export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'cancelled';

export type ExpenseCategory =
  | 'electricity'
  | 'labour'
  | 'transport'
  | 'maintenance'
  | 'packaging'
  | 'other';

export type MovementType =
  | 'purchase'
  | 'production_consumption'
  | 'finished_production'
  | 'sale_dispatch'
  | 'adjustment'
  | 'reversal'
  | 'stock_usage'
  | 'stock_waste';

export interface FactorySettings {
  factoryName: string;
  tagline?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  termsAndConditions?: string;
  currencySymbol: string;
  defaultUnitName: string; // e.g. 'bags', 'bottles', 'drums', 'cans'
  defaultUnitSize: number; // e.g. 20
  defaultBaseUnit: string; // e.g. 'kg', 'L'
  lowStockThresholdKg: number;
  lowUnitsThreshold: number;
  // Aliases for cattle feed backward compatibility
  defaultBagWeightKg?: number;
  lowBagsThreshold?: number;
}

export interface Product {
  id: string;
  name: string;
  outputUnit: string; // 'bags', 'bottles', 'drums', 'cans', 'boxes', 'units'
  unitSize: number; // e.g. 20 (kg) or 5 (L)
  baseUnit: string; // 'kg', 'L', 'g', 'ml'
  sellingPricePerUnit: number;
  currentStockUnits: number;
  description: string;
  isActive: boolean;
  // Backward compatibility aliases
  bagWeightKg?: number;
  sellingPricePerBag?: number;
  currentStockBags?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'raw_material' | 'packaging';
  unit: StockUnit;
  unitCost: number;
  currentStock: number;
  minThreshold: number;
  isActive: boolean;
}

export interface RecipeItem {
  ingredientId: string;
  ingredientName: string;
  targetQuantity: number;
  unit: StockUnit;
}

export interface ProductionSetup {
  id: string;
  name: string;
  productId: string;
  productName: string;
  outputUnit: string; // e.g. 'bags', 'bottles', 'drums', 'cans', 'units'
  unitSize: number; // size per package (e.g. 20 kg or 5 L)
  baseUnit: string; // 'kg', 'L'
  targetUnits: number; // e.g. 50
  status: SetupStatus;
  version: number;
  recipeItems: RecipeItem[];
  effectiveDate: string;
  notes?: string;
  // Backward compatibility aliases
  bagWeightKg?: number;
  targetBags?: number;
}

export interface BatchIngredientConsumption {
  ingredientId: string;
  ingredientName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: StockUnit;
  unitCostSnapshot: number;
  lineCost: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  date: string;
  setupId: string;
  setupVersion: number;
  productId: string;
  productName: string;
  outputUnit: string; // 'bags', 'bottles', 'drums', 'cans', 'units'
  unitsPacked: number; // generalized output count
  baseUnit: string; // 'kg', 'L'
  actualFinishedQuantity: number; // total finished weight/volume
  itemsConsumed: BatchIngredientConsumption[];
  packagingUsedUnits: number;
  packagingUnitCostSnapshot: number;
  packagingCost: number;
  ingredientCost: number;
  directBatchCost: number;
  measurableWastage: number;
  directCostPerUnit: number; // e.g. cost per bag or bottle
  directCostPerBaseUnit: number; // e.g. cost per kg or L
  status: BatchStatus;
  reversedAt?: string;
  notes?: string;
  // Backward compatibility aliases
  packagingUsedBags?: number;
  actualFinishedWeightKg?: number;
  bagsPacked?: number;
  measurableWastageKg?: number;
  directCostPerKg?: number;
  directCostPerBag?: number;
}

export interface InventoryMovement {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  itemType: 'raw_material' | 'packaging' | 'finished_goods' | 'finished_feed';
  movementType: MovementType;
  quantity: number;
  unit: StockUnit;
  direction: 'in' | 'out';
  referenceType: 'purchase' | 'batch' | 'sale' | 'adjustment' | 'reversal' | 'usage';
  referenceId: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balanceDue: number;
  gstNumber?: string;
  address?: string;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  billNumber?: string;
  date: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: StockUnit;
  unitPrice: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  gstin?: string;
  creditLimit?: number;
  notes?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  productId: string;
  productName: string;
  quantity: number; // generalized units sold
  outputUnit: string; // 'bags', 'bottles', 'drums', 'units'
  unitPrice: number;
  subtotal: number;
  discount: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: InvoiceStatus;
  isCredit: boolean;
  notes?: string;
  cancelledAt?: string;
  // Backward compatibility alias
  bagQuantity?: number;
}

export interface CustomerPayment {
  id: string;
  paymentNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  notes?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  paymentStatus: 'paid' | 'unpaid';
}

export interface DashboardMetrics {
  period: 'today' | 'this_week' | 'this_month' | 'all_time';
  production: {
    totalUnitsProduced: number;
    totalBaseQuantity: number;
    totalBatches: number;
    productionCost: number;
    defaultUnitName: string;
    baseUnit: string;
    // Backward compatibility aliases
    totalBagsProduced?: number;
    totalWeightKg?: number;
  };
  sales: {
    totalUnitsSold: number;
    salesRevenue: number;
    cashCollected: number;
    outstandingDues: number;
    defaultUnitName: string;
    // Backward compatibility aliases
    totalBagsSold?: number;
  };
  inventory: {
    rawMaterialsCount: number;
    finishedUnitsCount: number;
    lowStockCount: number;
    // Backward compatibility aliases
    finishedFeedBags?: number;
  };
  financial: {
    salesRevenue: number;
    cashCollected: number;
    costOfGoodsSold: number;
    productionCost: number;
    operatingExpenses: number;
    estimatedOperatingProfit: number;
  };
}
