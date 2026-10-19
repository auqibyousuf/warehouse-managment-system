/**
 * BatchIQ - Inventory API Service
 * Comprehensive raw material, packaging, and finished feed stock tracking with ledger movements.
 */

import { getDB } from './mockDatabase';
import { simulateNetwork, generateId } from './apiClient';
import {
  Ingredient,
  Product,
  InventoryMovement,
  Purchase,
  StockUnit,
} from '../../types';

export interface UnifiedStockItem {
  id: string;
  name: string;
  type: 'raw_material' | 'packaging' | 'finished_feed';
  currentStock: number;
  unit: StockUnit;
  unitCostOrPrice: number;
  minThreshold: number;
  isLowStock: boolean;
}

export interface RecordPurchaseInput {
  supplierId: string;
  itemId: string;
  quantity: number;
  unitPrice: number;
  amountPaid: number;
  date: string;
  billNumber?: string;
  supplierPhone?: string;
  notes?: string;
}

export interface AdjustStockInput {
  itemId: string;
  itemType: 'raw_material' | 'packaging' | 'finished_feed' | 'finished_goods';
  newQuantity: number;
  reason: string;
}

export const inventoryService = {
  // Get all inventory items unified across raw materials, packaging, and finished goods
  getItems: async (): Promise<UnifiedStockItem[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      const unified: UnifiedStockItem[] = [];

      for (const ing of db.ingredients) {
        unified.push({
          id: ing.id,
          name: ing.name,
          type: ing.category,
          currentStock: ing.currentStock,
          unit: ing.unit,
          unitCostOrPrice: ing.unitCost,
          minThreshold: ing.minThreshold,
          isLowStock: ing.currentStock <= ing.minThreshold,
        });
      }

      for (const prod of db.products) {
        const stock =
          prod.currentStockUnits !== undefined
            ? prod.currentStockUnits
            : (prod.currentStockBags ?? 0);
        const unit = prod.outputUnit || 'units';
        const price = prod.sellingPricePerUnit || prod.sellingPricePerBag || 0;
        const threshold =
          db.settings.lowUnitsThreshold || db.settings.lowBagsThreshold || 100;
        unified.push({
          id: prod.id,
          name: prod.name,
          type: 'finished_feed',
          currentStock: stock,
          unit,
          unitCostOrPrice: price,
          minThreshold: threshold,
          isLowStock: stock <= threshold,
        });
      }

      return unified;
    });
  },

  // Get raw materials & packaging
  getIngredients: async (): Promise<Ingredient[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.ingredients];
    });
  },

  // Get finished products
  getProducts: async (): Promise<Product[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.products];
    });
  },

  // Get stock ledger movements
  getMovements: async (): Promise<InventoryMovement[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.movements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  },

  // Record raw material / packaging purchase
  recordPurchase: async (input: RecordPurchaseInput): Promise<Purchase> => {
    return simulateNetwork(() => {
      const db = getDB();
      const supplier = db.suppliers.find((s) => s.id === input.supplierId);
      if (!supplier) throw new Error('Supplier not found');

      const item = db.ingredients.find((i) => i.id === input.itemId);
      if (!item) throw new Error('Inventory material not found');

      const totalAmount = input.quantity * input.unitPrice;
      const balanceDue = Math.max(0, totalAmount - input.amountPaid);
      const paymentStatus =
        input.amountPaid >= totalAmount
          ? 'paid'
          : input.amountPaid > 0
          ? 'partial'
          : 'unpaid';

      // Update item stock
      item.currentStock += input.quantity;
      // Update item unit cost if different
      item.unitCost = input.unitPrice;

      // Update supplier balance
      supplier.balanceDue += balanceDue;

      const purchaseId = generateId('pur');
      const purchaseNumber = `PUR-2026-${(db.purchases.length + 1).toString().padStart(3, '0')}`;

      const newPurchase: Purchase = {
        id: purchaseId,
        purchaseNumber,
        date: input.date,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: input.supplierPhone || supplier.phone,
        billNumber: input.billNumber,
        itemId: item.id,
        itemName: item.name,
        quantity: input.quantity,
        unit: item.unit,
        unitPrice: input.unitPrice,
        totalAmount,
        amountPaid: input.amountPaid,
        balanceDue,
        paymentStatus,
        notes: input.notes,
      };

      db.purchases.unshift(newPurchase);

      // Record inventory movement
      db.movements.unshift({
        id: generateId('mov'),
        date: input.date,
        itemId: item.id,
        itemName: item.name,
        itemType: item.category,
        movementType: 'purchase',
        quantity: input.quantity,
        unit: item.unit,
        direction: 'in',
        referenceType: 'purchase',
        referenceId: purchaseId,
        notes: input.notes || `Received from ${supplier.name} at ₹${input.unitPrice}/${item.unit}`,
      });

      return newPurchase;
    });
  },

  // Get all purchases / inward bills
  getPurchases: async (): Promise<Purchase[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.purchases].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  },

  // Get all registered suppliers
  getSuppliers: async () => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.suppliers];
    });
  },

  // Create new supplier
  createSupplier: async (input: {
    name: string;
    phone: string;
    address?: string;
    gstNumber?: string;
  }) => {
    return simulateNetwork(() => {
      const db = getDB();
      const newSup = {
        id: generateId('sup'),
        name: input.name,
        phone: input.phone,
        address: input.address,
        gstNumber: input.gstNumber,
        balanceDue: 0,
      };
      db.suppliers.push(newSup);
      return newSup;
    });
  },


  // Adjust stock based on physical count or reconciliation
  adjustStock: async (input: AdjustStockInput): Promise<void> => {
    return simulateNetwork(() => {
      const db = getDB();

      if (input.itemType === 'finished_feed' || input.itemType === 'finished_goods') {
        const prod = db.products.find((p) => p.id === input.itemId);
        if (!prod) throw new Error('Product not found');
        const currentStock =
          prod.currentStockUnits !== undefined
            ? prod.currentStockUnits
            : (prod.currentStockBags ?? 0);
        const diff = input.newQuantity - currentStock;
        if (prod.currentStockUnits !== undefined) {
          prod.currentStockUnits = input.newQuantity;
        }
        prod.currentStockBags = input.newQuantity;

        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: prod.id,
          itemName: prod.name,
          itemType: 'finished_feed',
          movementType: 'adjustment',
          quantity: Math.abs(diff),
          unit: prod.outputUnit || 'units',
          direction: diff >= 0 ? 'in' : 'out',
          referenceType: 'adjustment',
          referenceId: 'reconcile',
          notes: `Physical reconciliation: ${input.reason}`,
        });
      } else {
        const ing = db.ingredients.find((i) => i.id === input.itemId);
        if (!ing) throw new Error('Ingredient not found');
        const diff = input.newQuantity - ing.currentStock;
        ing.currentStock = input.newQuantity;

        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: ing.id,
          itemName: ing.name,
          itemType: ing.category,
          movementType: 'adjustment',
          quantity: Math.abs(diff),
          unit: ing.unit,
          direction: diff >= 0 ? 'in' : 'out',
          referenceType: 'adjustment',
          referenceId: 'reconcile',
          notes: `Stock count adjustment: ${input.reason}`,
        });
      }
    });
  },

  // Add new raw material or packaging ingredient
  createIngredient: async (input: {
    name: string;
    category?: 'raw_material' | 'packaging';
    unit: string;
    unitCost: number;
    initialStock?: number;
    minThreshold?: number;
  }): Promise<Ingredient> => {
    return simulateNetwork(() => {
      const db = getDB();
      const newIng: Ingredient = {
        id: generateId('ing'),
        name: input.name,
        category: input.category || 'raw_material',
        unit: input.unit || 'kg',
        unitCost: Number(input.unitCost) || 0,
        currentStock: Number(input.initialStock) || 0,
        minThreshold: Number(input.minThreshold) || 100,
        isActive: true,
      };
      db.ingredients.push(newIng);

      if (newIng.currentStock > 0) {
        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: newIng.id,
          itemName: newIng.name,
          itemType: newIng.category,
          movementType: 'adjustment',
          quantity: newIng.currentStock,
          unit: newIng.unit,
          direction: 'in',
          referenceType: 'adjustment',
          referenceId: 'initial_stock',
          notes: 'Initial stock on ingredient creation',
        });
      }

      return newIng;
    });
  },

  // Update existing raw material or packaging item
  updateIngredient: async (input: {
    id: string;
    name?: string;
    category?: 'raw_material' | 'packaging';
    unit?: string;
    unitCost?: number;
    minThreshold?: number;
    currentStock?: number;
  }): Promise<Ingredient> => {
    return simulateNetwork(() => {
      const db = getDB();
      const ing = db.ingredients.find((i) => i.id === input.id);
      if (!ing) throw new Error(`Stock item ${input.id} not found.`);

      if (input.name !== undefined) ing.name = input.name.trim();
      if (input.category !== undefined) ing.category = input.category;
      if (input.unit !== undefined) ing.unit = input.unit.trim();
      if (input.unitCost !== undefined) ing.unitCost = Number(input.unitCost);
      if (input.minThreshold !== undefined) ing.minThreshold = Number(input.minThreshold);
      if (input.currentStock !== undefined) {
        const diff = Number(input.currentStock) - ing.currentStock;
        if (diff !== 0) {
          ing.currentStock = Number(input.currentStock);
          db.movements.unshift({
            id: generateId('mov'),
            date: new Date().toISOString().split('T')[0],
            itemId: ing.id,
            itemName: ing.name,
            itemType: ing.category,
            movementType: 'adjustment',
            quantity: Math.abs(diff),
            unit: ing.unit,
            direction: diff > 0 ? 'in' : 'out',
            referenceType: 'adjustment',
            referenceId: 'stock_edit',
            notes: `Stock quantity manual adjustment on item update`,
          });
        }
      }

      // Also update ingredientName in setups referencing this ingredient if name changed
      if (input.name) {
        for (const setup of db.setups) {
          for (const item of setup.recipeItems) {
            if (item.ingredientId === ing.id) {
              item.ingredientName = ing.name;
            }
          }
        }
      }

      return ing;
    });
  },

  // Delete raw material or packaging item
  deleteIngredient: async (id: string): Promise<boolean> => {
    return simulateNetwork(() => {
      const db = getDB();
      const idx = db.ingredients.findIndex((i) => i.id === id);
      if (idx === -1) throw new Error(`Stock item ${id} not found.`);

      // Check if ingredient is actively used in setups
      const inUseSetup = db.setups.find((s) =>
        s.recipeItems.some((r) => r.ingredientId === id)
      );
      if (inUseSetup) {
        throw new Error(
          `Cannot delete "${db.ingredients[idx].name}" because it is currently used in formula "${inUseSetup.name}". Remove it from the formula first.`
        );
      }

      db.ingredients.splice(idx, 1);
      return true;
    });
  },
};

