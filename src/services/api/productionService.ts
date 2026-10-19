/**
 * BatchIQ - Production API Service
 * Authoritative batch costing, recipe setups, versioning, and atomic inventory transactions.
 */

import { getDB } from './mockDatabase';
import { simulateNetwork, generateId, nextDocumentNumber } from './apiClient';
import {
  Product,
  ProductionSetup,
  ProductionBatch,
  BatchIngredientConsumption,
  SetupStatus,
} from '../../types';

export interface CreateBatchInput {
  setupId: string;
  date: string;
  actualItems: {
    ingredientId: string;
    actualQuantity: number;
  }[];
  unitsPacked?: number;
  bagsPacked?: number;
  outputUnit?: string;
  actualFinishedQuantity?: number;
  actualFinishedWeightKg?: number;
  baseUnit?: string;
  packagingUsedUnits?: number;
  packagingUsedBags?: number;
  measurableWastage?: number;
  measurableWastageKg?: number;
  notes?: string;
}

export interface CreateSetupInput {
  name: string;
  productId?: string;
  productName?: string;
  outputUnit?: string;
  targetUnits?: number;
  unitSize?: number;
  baseUnit?: string;
  targetBags?: number;
  bagWeightKg?: number;
  recipeItems: {
    ingredientId?: string;
    ingredientName?: string;
    targetQuantity: number;
    unit?: string;
    unitCost?: number;
  }[];
  notes?: string;
}

export const productionService = {
  // Fetch all persistent setups
  getSetups: async (): Promise<ProductionSetup[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.setups];
    });
  },

  // Get active setups only
  getActiveSetups: async (): Promise<ProductionSetup[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return db.setups.filter((s) => s.status === 'active');
    });
  },

  // Create a reusable production setup
  createSetup: async (input: CreateSetupInput): Promise<ProductionSetup> => {
    return simulateNetwork(() => {
      const db = getDB();

      // Resolve or automatically create product
      let resolvedProduct: Product;
      const prodName =
        input.productName?.trim() || input.name;

      const foundProduct = input.productId
        ? db.products.find((p) => p.id === input.productId)
        : db.products.find(
            (p) => p.name.toLowerCase() === prodName.toLowerCase()
          );

      if (foundProduct) {
        resolvedProduct = foundProduct;
      } else {
        const prodId = generateId('prod');
        const outputUnit = input.outputUnit || 'units';
        const unitSize = input.unitSize || input.bagWeightKg || 20;
        const baseUnit = input.baseUnit || 'kg';
        resolvedProduct = {
          id: prodId,
          name: prodName,
          outputUnit,
          unitSize,
          baseUnit,
          sellingPricePerUnit: 500,
          currentStockUnits: 0,
          bagWeightKg: unitSize,
          sellingPricePerBag: 500,
          currentStockBags: 0,
          description: `Custom manufactured product: ${prodName}`,
          isActive: true,
        };
        db.products.push(resolvedProduct);
      }

      // Resolve or automatically create custom ingredients
      const recipeItems = input.recipeItems.map((item) => {
        let ing = item.ingredientId
          ? db.ingredients.find((i) => i.id === item.ingredientId)
          : undefined;
        const ingName =
          item.ingredientName?.trim() ||
          (ing ? ing.name : 'Raw Ingredient');

        if (!ing) {
          ing = db.ingredients.find(
            (i) => i.name.toLowerCase() === ingName.toLowerCase()
          );
        }

        if (!ing) {
          const ingId = generateId('ing');
          const ingUnit = item.unit || 'kg';
          const ingCost = item.unitCost && item.unitCost > 0 ? item.unitCost : 20;
          ing = {
            id: ingId,
            name: ingName,
            category: 'raw_material',
            unit: ingUnit,
            unitCost: ingCost,
            currentStock: 1000,
            minThreshold: 100,
            isActive: true,
          };
          db.ingredients.push(ing);
        }

        return {
          ingredientId: ing.id,
          ingredientName: ing.name,
          targetQuantity: item.targetQuantity,
          unit: ing.unit,
        };
      });

      const outputUnit = input.outputUnit || resolvedProduct.outputUnit || 'units';
      const unitSize =
        input.unitSize ||
        input.bagWeightKg ||
        resolvedProduct.unitSize ||
        resolvedProduct.bagWeightKg ||
        20;
      const baseUnit = input.baseUnit || resolvedProduct.baseUnit || 'kg';
      const targetUnits = input.targetUnits || input.targetBags || 50;

      const newSetup: ProductionSetup = {
        id: generateId('setup'),
        name: input.name,
        productId: resolvedProduct.id,
        productName: resolvedProduct.name,
        outputUnit,
        unitSize,
        baseUnit,
        targetUnits,
        bagWeightKg: unitSize,
        targetBags: targetUnits,
        status: 'active',
        version: 1,
        effectiveDate: new Date().toISOString().split('T')[0],
        notes: input.notes,
        recipeItems,
      };

      db.setups.unshift(newSetup);
      return newSetup;
    });
  },

  // Update setup: creates a new version for future runs without rewriting previous runs!
  updateSetup: async (
    setupId: string,
    input: Partial<CreateSetupInput>
  ): Promise<ProductionSetup> => {
    return simulateNetwork(() => {
      const db = getDB();
      const index = db.setups.findIndex((s) => s.id === setupId);
      if (index === -1) throw new Error('Setup not found');

      const existing = db.setups[index];
      const product = input.productId
        ? db.products.find((p) => p.id === input.productId)
        : db.products.find((p) => p.id === existing.productId);

      const recipeItems = input.recipeItems
        ? input.recipeItems.map((item) => {
            const ing = item.ingredientId
              ? db.ingredients.find((i) => i.id === item.ingredientId)
              : undefined;
            return {
              ingredientId:
                item.ingredientId || (ing ? ing.id : generateId('ing')),
              ingredientName:
                item.ingredientName || (ing ? ing.name : 'Unknown Ingredient'),
              targetQuantity: item.targetQuantity,
              unit: item.unit || (ing ? ing.unit : 'kg'),
            };
          })
        : existing.recipeItems;

      const outputUnit = input.outputUnit || existing.outputUnit || 'bags';
      const unitSize = input.unitSize || input.bagWeightKg || existing.unitSize || existing.bagWeightKg || 20;
      const baseUnit = input.baseUnit || existing.baseUnit || 'kg';
      const targetUnits = input.targetUnits || input.targetBags || existing.targetUnits || existing.targetBags || 50;

      // Increment version
      const updatedSetup: ProductionSetup = {
        ...existing,
        name: input.name || existing.name,
        productId: product ? product.id : existing.productId,
        productName: product ? product.name : existing.productName,
        outputUnit,
        unitSize,
        baseUnit,
        targetUnits,
        bagWeightKg: unitSize,
        targetBags: targetUnits,
        version: existing.version + 1,
        recipeItems,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        effectiveDate: new Date().toISOString().split('T')[0],
      };

      db.setups[index] = updatedSetup;
      return updatedSetup;
    });
  },

  // Change setup lifecycle status: 'active' | 'paused' | 'archived'
  setSetupStatus: async (setupId: string, status: SetupStatus): Promise<ProductionSetup> => {
    return simulateNetwork(() => {
      const db = getDB();
      const setup = db.setups.find((s) => s.id === setupId);
      if (!setup) throw new Error('Setup not found');
      setup.status = status;
      return { ...setup };
    });
  },

  // Fetch production batches
  getBatches: async (): Promise<ProductionBatch[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.batches].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  },

  // Confirm production run: calculates direct batch cost and executes atomic inventory transactions
  createBatch: async (input: CreateBatchInput): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const setup = db.setups.find((s) => s.id === input.setupId);
      if (!setup) throw new Error('Selected production setup does not exist');

      const product = db.products.find((p) => p.id === setup.productId);
      if (!product) throw new Error('Associated finished feed product not found');

      const outputUnit = input.outputUnit || setup.outputUnit || product.outputUnit || 'bags';
      const unitsPacked = input.unitsPacked !== undefined ? input.unitsPacked : (input.bagsPacked || 50);
      const packagingUsedUnits = input.packagingUsedUnits !== undefined ? input.packagingUsedUnits : (input.packagingUsedBags || unitsPacked);
      const baseUnit = input.baseUnit || setup.baseUnit || product.baseUnit || 'kg';
      const unitSize = setup.unitSize || product.unitSize || product.bagWeightKg || 20;
      const actualFinishedQuantity = input.actualFinishedQuantity !== undefined
        ? input.actualFinishedQuantity
        : (input.actualFinishedWeightKg || unitsPacked * unitSize);
      const measurableWastage = input.measurableWastage !== undefined
        ? input.measurableWastage
        : (input.measurableWastageKg || 0);

      // Packaging units
      const bagItem = db.ingredients.find((i) => i.category === 'packaging');
      const packagingUnitCost = bagItem ? bagItem.unitCost : 20;
      const packagingCost = packagingUsedUnits * packagingUnitCost;

      // Process ingredients consumption with cost snapshot
      let totalIngredientCost = 0;
      const itemsConsumed: BatchIngredientConsumption[] = [];

      for (const itemInput of input.actualItems) {
        const ing = db.ingredients.find((i) => i.id === itemInput.ingredientId);
        if (!ing) throw new Error(`Ingredient ${itemInput.ingredientId} not found`);

        const plannedItem = setup.recipeItems.find((r) => r.ingredientId === itemInput.ingredientId);
        const plannedQty = plannedItem ? plannedItem.targetQuantity : itemInput.actualQuantity;

        const lineCost = itemInput.actualQuantity * ing.unitCost;
        totalIngredientCost += lineCost;

        itemsConsumed.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          plannedQuantity: plannedQty,
          actualQuantity: itemInput.actualQuantity,
          unit: ing.unit,
          unitCostSnapshot: ing.unitCost,
          lineCost,
        });

        // Deduct raw material stock
        ing.currentStock -= itemInput.actualQuantity;
      }

      // Deduct packaging units stock
      if (bagItem) {
        bagItem.currentStock -= packagingUsedUnits;
      }

      // Add finished product stock
      const prevStock = product.currentStockUnits !== undefined ? product.currentStockUnits : (product.currentStockBags || 0);
      product.currentStockUnits = prevStock + unitsPacked;
      product.currentStockBags = product.currentStockUnits;

      // Authoritative calculations (ISA-88 standard batch costing)
      const directBatchCost = totalIngredientCost + packagingCost;
      const directCostPerBaseUnit =
        actualFinishedQuantity > 0
          ? Number((directBatchCost / actualFinishedQuantity).toFixed(2))
          : 0;
      const directCostPerUnit =
        unitsPacked > 0
          ? Number((directBatchCost / unitsPacked).toFixed(2))
          : 0;

      const batchId = generateId('batch');
      const batchNumber = nextDocumentNumber('BAT', db.batches.map((b) => b.batchNumber));

      const newBatch: ProductionBatch = {
        id: batchId,
        batchNumber,
        date: input.date,
        setupId: setup.id,
        setupVersion: setup.version,
        productId: product.id,
        productName: product.name,
        outputUnit,
        unitsPacked,
        baseUnit,
        actualFinishedQuantity,
        itemsConsumed,
        packagingUsedUnits,
        packagingUnitCostSnapshot: packagingUnitCost,
        packagingCost,
        ingredientCost: totalIngredientCost,
        directBatchCost,
        measurableWastage,
        directCostPerUnit,
        directCostPerBaseUnit,
        status: 'confirmed',
        notes: input.notes,
        // Compatibility aliases
        packagingUsedBags: packagingUsedUnits,
        actualFinishedWeightKg: actualFinishedQuantity,
        bagsPacked: unitsPacked,
        measurableWastageKg: measurableWastage,
        directCostPerKg: directCostPerBaseUnit,
        directCostPerBag: directCostPerUnit,
      };

      db.batches.unshift(newBatch);

      // Record atomic inventory movements
      for (const item of itemsConsumed) {
        db.movements.unshift({
          id: generateId('mov'),
          date: input.date,
          itemId: item.ingredientId,
          itemName: item.ingredientName,
          itemType: 'raw_material',
          movementType: 'production_consumption',
          quantity: item.actualQuantity,
          unit: item.unit,
          direction: 'out',
          referenceType: 'batch',
          referenceId: batchId,
          notes: `Consumed for batch ${batchNumber}`,
        });
      }

      const packQty = input.packagingUsedUnits || input.packagingUsedBags || unitsPacked;
      if (bagItem) {
        db.movements.unshift({
          id: generateId('mov'),
          date: input.date,
          itemId: bagItem.id,
          itemName: bagItem.name,
          itemType: 'packaging',
          movementType: 'production_consumption',
          quantity: packQty,
          unit: 'pcs',
          direction: 'out',
          referenceType: 'batch',
          referenceId: batchId,
          notes: `Packaging used for batch ${batchNumber}`,
        });
      }

      db.movements.unshift({
        id: generateId('mov'),
        date: input.date,
        itemId: product.id,
        itemName: product.name,
        itemType: 'finished_feed',
        movementType: 'finished_production',
        quantity: unitsPacked,
        unit: (outputUnit || 'units') as any,
        direction: 'in',
        referenceType: 'batch',
        referenceId: batchId,
        notes: `Finished production from batch ${batchNumber}`,
      });

      return newBatch;
    });
  },

  // Controlled batch reversal: restores stock and logs compensating movement records
  reverseBatch: async (batchId: string, reason?: string): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const batch = db.batches.find((b) => b.id === batchId);
      if (!batch) throw new Error('Batch not found');
      if (batch.status === 'reversed') throw new Error('Batch has already been reversed.');

      const product = db.products.find((p) => p.id === batch.productId);
      const bagItem = db.ingredients.find((i) => i.category === 'packaging');

      // Compensating stock restoration: Return raw materials
      for (const item of batch.itemsConsumed) {
        const ing = db.ingredients.find((i) => i.id === item.ingredientId);
        if (ing) {
          ing.currentStock += item.actualQuantity;
        }
        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: item.ingredientId,
          itemName: item.ingredientName,
          itemType: 'raw_material',
          movementType: 'reversal',
          quantity: item.actualQuantity,
          unit: item.unit,
          direction: 'in',
          referenceType: 'batch',
          referenceId: batch.id,
          notes: `Batch reversal ${batch.batchNumber}: ${reason || 'Operator reversal'}`,
        });
      }

      // Return packaging
      if (bagItem) {
        const returnPackaging = batch.packagingUsedUnits || batch.packagingUsedBags || 0;
        bagItem.currentStock += returnPackaging;
        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: bagItem.id,
          itemName: bagItem.name,
          itemType: 'packaging',
          movementType: 'reversal',
          quantity: returnPackaging,
          unit: 'pcs',
          direction: 'in',
          referenceType: 'batch',
          referenceId: batch.id,
          notes: `Packaging reversal for ${batch.batchNumber}`,
        });
      }

      // Deduct finished goods stock
      if (product) {
        const units = batch.unitsPacked || batch.bagsPacked || 0;
        product.currentStockUnits = Math.max(0, (product.currentStockUnits || product.currentStockBags || 0) - units);
        product.currentStockBags = product.currentStockUnits;

        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: product.id,
          itemName: product.name,
          itemType: 'finished_goods',
          movementType: 'reversal',
          quantity: units,
          unit: (batch.outputUnit || 'units') as any,
          direction: 'out',
          referenceType: 'batch',
          referenceId: batch.id,
          notes: `Finished goods deduction on batch reversal ${batch.batchNumber}`,
        });
      }

      batch.status = 'reversed';
      batch.reversedAt = new Date().toISOString();
      if (reason) {
        batch.notes = (batch.notes ? batch.notes + ' | ' : '') + `Reversal Reason: ${reason}`;
      }

      return { ...batch };
    });
  },
};
