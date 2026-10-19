/**
 * BatchIQ - Form Validation Schemas
 * Type-safe schemas with Zod generalized for any manufacturing industry output units.
 */

import { z } from 'zod';

export const batchRunSchema = z.object({
  setupId: z.string().min(1, 'Please select a production setup'),
  date: z.string().min(1, 'Date is required'),
  unitsPacked: z.number().int().positive('Units packed must be greater than 0'),
  outputUnit: z.string().min(1, 'Production unit is required').default('bags'),
  actualFinishedQuantity: z.number().positive('Finished quantity must be greater than 0'),
  baseUnit: z.string().min(1, 'Base measurement unit is required').default('kg'),
  measurableWastage: z.number().min(0, 'Wastage cannot be negative').default(0),
  actualItems: z
    .array(
      z.object({
        ingredientId: z.string(),
        actualQuantity: z.number().positive('Quantity must be greater than 0'),
      }),
    )
    .min(1, 'At least one ingredient is required'),
  notes: z.string().optional(),
  // Aliases for compatibility
  bagsPacked: z.number().optional(),
  actualFinishedWeightKg: z.number().optional(),
  measurableWastageKg: z.number().optional(),
});

export type BatchRunFormData = z.infer<typeof batchRunSchema>;
export type BatchRunFormInput = z.input<typeof batchRunSchema>;

export const setupSchema = z.object({
  name: z.string().min(2, 'Setup name is required'),
  productId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  outputUnit: z
    .string()
    .min(1, 'Enter output unit (e.g. bags, bottles, drums, boxes)')
    .default('units'),
  targetUnits: z.number().int().positive('Target units must be greater than 0'),
  unitSize: z.number().positive('Standard package size must be greater than 0'),
  baseUnit: z.string().min(1, 'Measurement unit (kg, L, g, ml)').default('kg'),
  recipeItems: z
    .array(
      z.object({
        ingredientId: z.string().optional(),
        ingredientName: z.string().min(1, 'Ingredient name is required'),
        targetQuantity: z.number().positive('Target quantity must be greater than 0'),
        unit: z.string().min(1, 'Unit is required').default('kg'),
        unitCost: z.number().min(0).optional(),
      }),
    )
    .min(1, 'At least one recipe ingredient is required'),
  notes: z.string().optional(),
  // Aliases for compatibility
  targetBags: z.number().optional(),
  bagWeightKg: z.number().optional(),
});

export type SetupFormData = z.infer<typeof setupSchema>;
export type SetupFormInput = z.input<typeof setupSchema>;

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Please select a supplier'),
  itemId: z.string().min(1, 'Please select an ingredient or packaging item'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  amountPaid: z.number().min(0, 'Amount paid cannot be negative'),
  date: z.string().min(1, 'Date is required'),
  billNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;
export type PurchaseFormInput = z.input<typeof purchaseSchema>;

export const saleInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  productId: z.string().min(1, 'Please select a product'),
  quantity: z.number().int().positive('Quantity must be at least 1 unit'),
  outputUnit: z.string().min(1, 'Unit is required').default('bags'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  amountPaidNow: z.number().min(0, 'Amount paid cannot be negative').default(0),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'cheque']).default('cash'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  // Alias
  bagQuantity: z.number().optional(),
});

export type SaleInvoiceFormData = z.infer<typeof saleInvoiceSchema>;
export type SaleInvoiceFormInput = z.input<typeof saleInvoiceSchema>;

export const customerPaymentSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  invoiceId: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'cheque']),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

export type CustomerPaymentFormData = z.infer<typeof customerPaymentSchema>;
export type CustomerPaymentFormInput = z.input<typeof customerPaymentSchema>;

export const expenseSchema = z.object({
  category: z.enum(['electricity', 'labour', 'transport', 'maintenance', 'packaging', 'other']),
  amount: z.number().positive('Expense amount must be greater than 0'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  date: z.string().min(1, 'Date is required'),
  paymentStatus: z.enum(['paid', 'unpaid']).default('paid'),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ExpenseFormInput = z.input<typeof expenseSchema>;

export const stockAdjustmentSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  itemType: z.enum(['raw_material', 'packaging', 'finished_goods', 'finished_feed']),
  newQuantity: z.number().min(0, 'Stock quantity cannot be negative'),
  reason: z.string().min(3, 'Reason is required for audit history'),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
export type StockAdjustmentFormInput = z.input<typeof stockAdjustmentSchema>;

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter valid phone number'),
  address: z.string().min(3, 'Address is required'),
  email: z.string().email('Enter valid email address').or(z.literal('')).optional(),
  gstin: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerFormInput = z.input<typeof customerSchema>;

export const companyProfileSchema = z.object({
  factoryName: z.string().min(2, 'Business name is required'),
  tagline: z.string().optional(),
  address: z.string().optional(),
  gstin: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter valid email address').or(z.literal('')).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  termsAndConditions: z.string().optional(),
  // Preferences (kept as text while typing, converted on save)
  currencySymbol: z.string().trim().min(1, 'Enter a currency symbol').max(5, 'Up to 5 characters'),
  defaultUnitName: z.string().trim().min(1, 'Enter a unit name, e.g. bags'),
  defaultBaseUnit: z.string().trim().min(1, 'Enter a measure, e.g. kg or L'),
  defaultUnitSize: z.string().refine((v) => Number(v) > 0, 'Enter a number above 0'),
  lowUnitsThreshold: z.string().refine((v) => v.trim() !== '' && Number(v) >= 0, 'Enter 0 or more'),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;
export type CompanyProfileFormInput = z.input<typeof companyProfileSchema>;
