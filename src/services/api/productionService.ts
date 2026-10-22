/**
 * BatchIQ - Production API Service
 * Authoritative batch costing, recipe setups, versioning, and atomic inventory transactions.
 */

import { getDB, DatabaseState } from './mockDatabase';
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
  outputPerHour?: number;
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

export interface StartBatchRunInput {
  setupId: string;
  date: string;
  actualItems: { ingredientId: string; actualQuantity: number }[];
  plannedHours?: number;
  expectedUnits?: number;
  notes?: string;
}

export interface UpdateBatchInput {
  /** Finished batches only: the output actually made. Moves finished stock and packaging. */
  unitsPacked?: number;
  unitSize?: number;
  durationMinutes?: number;
  measurableWastage?: number;
  notes?: string;
  date?: string;
  /** Running batches only. */
  plannedHours?: number;
  expectedUnits?: number;
}

export interface CompleteBatchRunInput {
  unitsPacked: number;
  outputUnit?: string;
  baseUnit?: string;
  unitSize?: number;
  actualFinishedQuantity?: number;
  packagingUsedUnits?: number;
  measurableWastage?: number;
  /** Actual run time; defaults to the time since the run started. */
  durationMinutes?: number;
  /** Save the measured rate on the recipe for future estimates. */
  rememberRate?: boolean;
  date?: string;
  notes?: string;
}

/** Undo a batch in the stock ledger. Throws if its output was already sold. Callers check the status first. */
const reverseInDb = (db: DatabaseState, batch: ProductionBatch, reason?: string): void => {
  const running = batch.status === 'in_progress';

  const product = db.products.find((p) => p.id === batch.productId);
  const bagItem = db.ingredients.find((i) => i.category === 'packaging');

  // Guard first: never reverse if the batch output has already left the warehouse,
  // otherwise raw materials would be restored while the sold goods stay unaccounted for.
  if (product && !running) {
    const units = batch.unitsPacked || batch.bagsPacked || 0;
    const onHand = product.currentStockUnits ?? product.currentStockBags ?? 0;
    if (onHand < units) {
      throw new Error(
        `Cannot reverse ${batch.batchNumber}: only ${onHand} of ${units} ${batch.outputUnit || 'units'} are still in stock. Cancel the related sales first.`,
      );
    }
  }

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
  if (bagItem && !running) {
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
  if (product && !running) {
    const units = batch.unitsPacked || batch.bagsPacked || 0;
    product.currentStockUnits =
      (product.currentStockUnits ?? product.currentStockBags ?? 0) - units;
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
};

export const productionService = {
  // Fetch all persistent setups
  getSetups: async (): Promise<ProductionSetup[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return JSON.parse(JSON.stringify(db.setups)) as ProductionSetup[];
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
      const prodName = input.productName?.trim() || input.name;

      const foundProduct = input.productId
        ? db.products.find((p) => p.id === input.productId)
        : db.products.find((p) => p.name.toLowerCase() === prodName.toLowerCase());

      if (foundProduct) {
        resolvedProduct = foundProduct;
      } else {
        const prodId = generateId('prod');
        const outputUnit = input.outputUnit || 'units';
        const unitSize = input.unitSize || input.bagWeightKg || 1;
        const baseUnit = input.baseUnit || 'kg';
        resolvedProduct = {
          id: prodId,
          name: prodName,
          outputUnit,
          unitSize,
          baseUnit,
          sellingPricePerUnit: 0,
          currentStockUnits: 0,
          bagWeightKg: unitSize,
          sellingPricePerBag: 0,
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
        const ingName = item.ingredientName?.trim() || (ing ? ing.name : 'Raw Ingredient');

        if (!ing) {
          ing = db.ingredients.find((i) => i.name.toLowerCase() === ingName.toLowerCase());
        }

        if (!ing) {
          const ingId = generateId('ing');
          const ingUnit = item.unit || 'kg';
          const ingCost = item.unitCost && item.unitCost > 0 ? item.unitCost : 0;
          ing = {
            id: ingId,
            name: ingName,
            category: 'raw_material',
            unit: ingUnit,
            unitCost: ingCost,
            currentStock: 0,
            minThreshold: 0,
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
        1;
      const baseUnit = input.baseUnit || resolvedProduct.baseUnit || 'kg';
      const targetUnits = input.targetUnits || input.targetBags || 0;

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
        outputPerHour: input.outputPerHour,
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
    input: Partial<CreateSetupInput>,
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
              ingredientId: item.ingredientId || (ing ? ing.id : generateId('ing')),
              ingredientName: item.ingredientName || (ing ? ing.name : 'Unknown Ingredient'),
              targetQuantity: item.targetQuantity,
              unit: item.unit || (ing ? ing.unit : 'kg'),
            };
          })
        : existing.recipeItems;

      const outputUnit = input.outputUnit || existing.outputUnit || 'bags';
      const unitSize =
        input.unitSize || input.bagWeightKg || existing.unitSize || existing.bagWeightKg || 1;
      const baseUnit = input.baseUnit || existing.baseUnit || 'kg';
      const targetUnits =
        input.targetUnits || input.targetBags || existing.targetUnits || existing.targetBags || 0;

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
        outputPerHour:
          input.outputPerHour !== undefined ? input.outputPerHour : existing.outputPerHour,
        version: existing.version + 1,
        recipeItems,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        effectiveDate: new Date().toISOString().split('T')[0],
      };

      db.setups[index] = updatedSetup;
      return updatedSetup;
    });
  },

  // Delete a recipe nobody has used; one with batch history is archived so past runs stay intact.
  deleteSetup: async (setupId: string): Promise<'deleted' | 'archived'> => {
    return simulateNetwork(() => {
      const db = getDB();
      const index = db.setups.findIndex((s) => s.id === setupId);
      if (index === -1) throw new Error('Setup not found');
      if (db.batches.some((b) => b.setupId === setupId)) {
        db.setups[index].status = 'archived';
        return 'archived';
      }
      db.setups.splice(index, 1);
      return 'deleted';
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
      // Copies, not the live records: batches change in place, and React Query only notices a
      // change when the data it is handed is different from what it already holds.
      return (JSON.parse(JSON.stringify(db.batches)) as ProductionBatch[]).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
      const unitsPacked =
        input.unitsPacked !== undefined ? input.unitsPacked : input.bagsPacked || 50;
      const packagingUsedUnits =
        input.packagingUsedUnits !== undefined
          ? input.packagingUsedUnits
          : input.packagingUsedBags || unitsPacked;
      const baseUnit = input.baseUnit || setup.baseUnit || product.baseUnit || 'kg';
      const unitSize = setup.unitSize || product.unitSize || product.bagWeightKg || 20;
      const actualFinishedQuantity =
        input.actualFinishedQuantity !== undefined
          ? input.actualFinishedQuantity
          : input.actualFinishedWeightKg || unitsPacked * unitSize;
      const measurableWastage =
        input.measurableWastage !== undefined
          ? input.measurableWastage
          : input.measurableWastageKg || 0;

      // Packaging units
      const bagItem = db.ingredients.find((i) => i.category === 'packaging');
      const packagingUnitCost = bagItem ? bagItem.unitCost : 0;
      const packagingCost = packagingUsedUnits * packagingUnitCost;

      // Process ingredients consumption with cost snapshot
      let totalIngredientCost = 0;
      const itemsConsumed: BatchIngredientConsumption[] = [];

      for (const itemInput of input.actualItems) {
        const ing = db.ingredients.find((i) => i.id === itemInput.ingredientId);
        if (!ing) throw new Error(`Ingredient ${itemInput.ingredientId} not found`);

        const plannedItem = setup.recipeItems.find(
          (r) => r.ingredientId === itemInput.ingredientId,
        );
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
      const prevStock =
        product.currentStockUnits !== undefined
          ? product.currentStockUnits
          : product.currentStockBags || 0;
      product.currentStockUnits = prevStock + unitsPacked;
      product.currentStockBags = product.currentStockUnits;

      // Authoritative calculations (ISA-88 standard batch costing)
      const directBatchCost = totalIngredientCost + packagingCost;
      const directCostPerBaseUnit =
        actualFinishedQuantity > 0
          ? Number((directBatchCost / actualFinishedQuantity).toFixed(2))
          : 0;
      const directCostPerUnit =
        unitsPacked > 0 ? Number((directBatchCost / unitsPacked).toFixed(2)) : 0;

      const batchId = generateId('batch');
      const batchNumber = nextDocumentNumber(
        'BAT',
        db.batches.map((b) => b.batchNumber),
      );

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

  // Start a run: the inputs go into the mixer now, the output is entered when it finishes.
  startBatchRun: async (input: StartBatchRunInput): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const setup = db.setups.find((s) => s.id === input.setupId);
      if (!setup) throw new Error('Selected production setup does not exist');
      const product = db.products.find((p) => p.id === setup.productId);
      if (!product) throw new Error('Associated product not found');

      let ingredientCost = 0;
      const itemsConsumed: BatchIngredientConsumption[] = [];
      for (const line of input.actualItems) {
        const ing = db.ingredients.find((i) => i.id === line.ingredientId);
        if (!ing) throw new Error(`Ingredient ${line.ingredientId} not found`);
        if (ing.currentStock < line.actualQuantity) {
          throw new Error(
            `Not enough ${ing.name}: ${ing.currentStock} ${ing.unit} on hand, ${line.actualQuantity} needed.`,
          );
        }
      }
      for (const line of input.actualItems) {
        const ing = db.ingredients.find((i) => i.id === line.ingredientId)!;
        const planned = setup.recipeItems.find((r) => r.ingredientId === line.ingredientId);
        const lineCost = line.actualQuantity * ing.unitCost;
        ingredientCost += lineCost;
        itemsConsumed.push({
          ingredientId: ing.id,
          ingredientName: ing.name,
          plannedQuantity: planned ? planned.targetQuantity : line.actualQuantity,
          actualQuantity: line.actualQuantity,
          unit: ing.unit,
          unitCostSnapshot: ing.unitCost,
          lineCost,
        });
        ing.currentStock -= line.actualQuantity;
      }

      const batchId = generateId('batch');
      const batchNumber = nextDocumentNumber(
        'BAT',
        db.batches.map((b) => b.batchNumber),
      );
      const outputUnit = setup.outputUnit || product.outputUnit || 'units';
      const baseUnit = setup.baseUnit || product.baseUnit || 'kg';
      const batch: ProductionBatch = {
        id: batchId,
        batchNumber,
        date: input.date,
        setupId: setup.id,
        setupVersion: setup.version,
        productId: product.id,
        productName: product.name,
        outputUnit,
        unitsPacked: 0,
        baseUnit,
        actualFinishedQuantity: 0,
        itemsConsumed,
        packagingUsedUnits: 0,
        packagingUnitCostSnapshot: 0,
        packagingCost: 0,
        ingredientCost,
        directBatchCost: ingredientCost,
        measurableWastage: 0,
        directCostPerUnit: 0,
        directCostPerBaseUnit: 0,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        plannedHours: input.plannedHours,
        expectedUnits: input.expectedUnits,
        notes: input.notes,
      };
      db.batches.unshift(batch);

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
          notes: `Loaded into batch ${batchNumber}`,
        });
      }
      return { ...batch };
    });
  },

  // Finish a run: record what it made; finished stock, packaging and final cost are booked now.
  completeBatchRun: async (
    batchId: string,
    input: CompleteBatchRunInput,
  ): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const batch = db.batches.find((b) => b.id === batchId);
      if (!batch) throw new Error('Batch not found');
      if (batch.status !== 'in_progress') throw new Error('This batch is not running.');
      if (!(input.unitsPacked > 0)) throw new Error('Enter how much the batch made.');
      const product = db.products.find((p) => p.id === batch.productId);
      if (!product) throw new Error('Associated product not found');

      const today = input.date ?? new Date().toISOString().split('T')[0];
      const outputUnit = input.outputUnit || batch.outputUnit || 'units';
      const baseUnit = input.baseUnit || batch.baseUnit || 'kg';
      const finished = input.actualFinishedQuantity ?? input.unitsPacked * (input.unitSize ?? 0);
      const packagingItem = db.ingredients.find((i) => i.category === 'packaging');
      const packUsed = packagingItem ? (input.packagingUsedUnits ?? input.unitsPacked) : 0;
      const packUnitCost = packagingItem ? packagingItem.unitCost : 0;
      const packagingCost = packUsed * packUnitCost;

      if (packagingItem && packagingItem.currentStock < packUsed) {
        throw new Error(
          `Not enough ${packagingItem.name}: ${packagingItem.currentStock} on hand, ${packUsed} needed.`,
        );
      }
      if (packagingItem) packagingItem.currentStock -= packUsed;

      const prev = product.currentStockUnits ?? product.currentStockBags ?? 0;
      product.currentStockUnits = prev + input.unitsPacked;
      product.currentStockBags = product.currentStockUnits;
      if (input.unitSize) {
        product.unitSize = input.unitSize;
        product.bagWeightKg = input.unitSize;
      }
      product.outputUnit = outputUnit;

      const directBatchCost = batch.ingredientCost + packagingCost;
      const finishedAt = new Date();
      const minutes =
        input.durationMinutes ??
        (batch.startedAt
          ? Math.max(1, Math.round((finishedAt.getTime() - Date.parse(batch.startedAt)) / 60000))
          : undefined);
      const perHour =
        minutes && minutes > 0
          ? Number(((input.unitsPacked * 60) / minutes).toFixed(2))
          : undefined;
      if (input.rememberRate && perHour) {
        const recipe = db.setups.find((r) => r.id === batch.setupId);
        if (recipe) recipe.outputPerHour = perHour;
      }
      Object.assign(batch, {
        completedAt: finishedAt.toISOString(),
        durationMinutes: minutes,
        outputPerHour: perHour,
        date: today,
        outputUnit,
        baseUnit,
        unitsPacked: input.unitsPacked,
        actualFinishedQuantity: finished,
        packagingUsedUnits: packUsed,
        packagingUnitCostSnapshot: packUnitCost,
        packagingCost,
        directBatchCost,
        measurableWastage: input.measurableWastage ?? 0,
        directCostPerUnit: Number((directBatchCost / input.unitsPacked).toFixed(2)),
        directCostPerBaseUnit: finished > 0 ? Number((directBatchCost / finished).toFixed(2)) : 0,
        status: 'confirmed' as const,
        notes: input.notes ?? batch.notes,
        bagsPacked: input.unitsPacked,
        packagingUsedBags: packUsed,
        actualFinishedWeightKg: finished,
      });

      if (packagingItem) {
        db.movements.unshift({
          id: generateId('mov'),
          date: today,
          itemId: packagingItem.id,
          itemName: packagingItem.name,
          itemType: 'packaging',
          movementType: 'production_consumption',
          quantity: packUsed,
          unit: 'pcs',
          direction: 'out',
          referenceType: 'batch',
          referenceId: batch.id,
          notes: `Packaging used for batch ${batch.batchNumber}`,
        });
      }
      db.movements.unshift({
        id: generateId('mov'),
        date: today,
        itemId: product.id,
        itemName: product.name,
        itemType: 'finished_feed',
        movementType: 'finished_production',
        quantity: input.unitsPacked,
        unit: outputUnit as any,
        direction: 'in',
        referenceType: 'batch',
        referenceId: batch.id,
        notes: `Finished production from batch ${batch.batchNumber}`,
      });
      return { ...batch };
    });
  },

  // Controlled batch reversal: restores stock and logs compensating movement records
  reverseBatch: async (batchId: string, reason?: string): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const batch = db.batches.find((b) => b.id === batchId);
      if (!batch) throw new Error('Batch not found');
      if (batch.status === 'reversed') throw new Error('Batch has already been reversed.');
      reverseInDb(db, batch, reason);
      return { ...batch };
    });
  },

  // Edit what can safely change after the fact. Output changes move finished stock and packaging.
  updateBatch: async (batchId: string, input: UpdateBatchInput): Promise<ProductionBatch> => {
    return simulateNetwork(() => {
      const db = getDB();
      const batch = db.batches.find((b) => b.id === batchId);
      if (!batch) throw new Error('Batch not found');
      if (batch.status === 'reversed') throw new Error('A cancelled batch cannot be edited.');

      if (batch.status === 'confirmed' && input.unitsPacked !== undefined) {
        if (!(input.unitsPacked > 0)) throw new Error('Output must be above 0.');
        const delta = input.unitsPacked - batch.unitsPacked;
        const product = db.products.find((p) => p.id === batch.productId);
        const packaging = db.ingredients.find((i) => i.category === 'packaging');
        if (delta !== 0 && product) {
          const onHand = product.currentStockUnits ?? product.currentStockBags ?? 0;
          if (onHand + delta < 0) {
            throw new Error(
              `Only ${onHand} ${batch.outputUnit} of this are still in stock, so the output cannot be lowered by ${-delta}.`,
            );
          }
          if (packaging && delta > 0 && packaging.currentStock < delta) {
            throw new Error(`Not enough ${packaging.name} for ${delta} more.`);
          }
          product.currentStockUnits = onHand + delta;
          product.currentStockBags = product.currentStockUnits;
          if (packaging) packaging.currentStock -= delta;
          const date = new Date().toISOString().split('T')[0];
          db.movements.unshift({
            id: generateId('mov'),
            date,
            itemId: product.id,
            itemName: product.name,
            itemType: 'finished_feed',
            movementType: 'adjustment',
            quantity: Math.abs(delta),
            unit: (batch.outputUnit || 'units') as any,
            direction: delta > 0 ? 'in' : 'out',
            referenceType: 'batch',
            referenceId: batch.id,
            notes: `Output of ${batch.batchNumber} edited from ${batch.unitsPacked} to ${input.unitsPacked}`,
          });
        }
        const packUsed = packaging ? input.unitsPacked : 0;
        const packagingCost = packUsed * (batch.packagingUnitCostSnapshot || 0);
        const size =
          input.unitSize ??
          (batch.unitsPacked > 0 ? batch.actualFinishedQuantity / batch.unitsPacked : 0);
        const finished = input.unitsPacked * size;
        const directBatchCost = batch.ingredientCost + packagingCost;
        Object.assign(batch, {
          unitsPacked: input.unitsPacked,
          bagsPacked: input.unitsPacked,
          packagingUsedUnits: packUsed,
          packagingUsedBags: packUsed,
          packagingCost,
          actualFinishedQuantity: finished,
          actualFinishedWeightKg: finished,
          directBatchCost,
          directCostPerUnit: Number((directBatchCost / input.unitsPacked).toFixed(2)),
          directCostPerBaseUnit: finished > 0 ? Number((directBatchCost / finished).toFixed(2)) : 0,
        });
        const minutes = input.durationMinutes ?? batch.durationMinutes;
        if (minutes) {
          batch.durationMinutes = minutes;
          batch.outputPerHour = Number(((input.unitsPacked * 60) / minutes).toFixed(2));
        }
      } else if (input.durationMinutes !== undefined && batch.status === 'confirmed') {
        batch.durationMinutes = input.durationMinutes;
        if (input.durationMinutes > 0 && batch.unitsPacked > 0) {
          batch.outputPerHour = Number(
            ((batch.unitsPacked * 60) / input.durationMinutes).toFixed(2),
          );
        }
      }

      if (input.measurableWastage !== undefined) {
        batch.measurableWastage = input.measurableWastage;
        batch.measurableWastageKg = input.measurableWastage;
      }
      if (input.notes !== undefined) batch.notes = input.notes;
      if (input.date) batch.date = input.date;
      if (batch.status === 'in_progress') {
        if (input.plannedHours !== undefined) batch.plannedHours = input.plannedHours;
        if (input.expectedUnits !== undefined) batch.expectedUnits = input.expectedUnits;
      }
      return { ...batch };
    });
  },

  // Remove a batch as if it never happened: stock is put back and its ledger entries are removed.
  deleteBatch: async (batchId: string): Promise<void> => {
    return simulateNetwork(() => {
      const db = getDB();
      const index = db.batches.findIndex((b) => b.id === batchId);
      if (index === -1) throw new Error('Batch not found');
      const batch = db.batches[index];
      if (batch.status !== 'reversed') reverseInDb(db, batch, 'Batch deleted');
      db.movements = db.movements.filter(
        (m) => !(m.referenceType === 'batch' && m.referenceId === batchId),
      );
      db.batches.splice(index, 1);
    });
  },
};
