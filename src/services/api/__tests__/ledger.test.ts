import { clearDatabase, exportDatabase, getDB, importDatabase, resetDB } from '../mockDatabase';
import { salesService } from '../salesService';
import { inventoryService } from '../inventoryService';
import { customerService } from '../customerService';
import { dashboardService } from '../dashboardService';
import { productionService } from '../productionService';

const today = new Date().toISOString().split('T')[0];
const product = () => getDB().products.find((p) => p.id === 'prod-1')!;
const ingredient = (id: string) => getDB().ingredients.find((i) => i.id === id)!;
const customer = () => getDB().customers.find((c) => c.id === 'cust-1')!;

beforeEach(() => resetDB());

describe('sales', () => {
  const sale = (quantity: number, amountPaidNow = 0) =>
    salesService.createInvoice({
      customerId: 'cust-1',
      productId: 'prod-1',
      quantity,
      unitPrice: 500,
      amountPaidNow,
      date: today,
    });

  it('deducts finished stock and books the unpaid balance to the customer', async () => {
    const stockBefore = product().currentStockUnits!;
    const dueBefore = customer().outstandingBalance;

    const invoice = await sale(10, 1000);

    expect(product().currentStockUnits).toBe(stockBefore - 10);
    expect(invoice.totalAmount).toBe(5000);
    expect(invoice.balanceDue).toBe(4000);
    expect(invoice.paymentStatus).toBe('partial');
    expect(customer().outstandingBalance).toBe(dueBefore + 4000);
  });

  it('rejects a sale larger than available stock and changes nothing', async () => {
    const stockBefore = product().currentStockUnits!;
    await expect(sale(stockBefore + 1)).rejects.toThrow(/Insufficient stock/);
    expect(product().currentStockUnits).toBe(stockBefore);
  });

  it('never reuses a document number after a cancellation', async () => {
    const first = await sale(1);
    await salesService.cancelInvoice(first.id);
    const second = await sale(1);
    const numbers = getDB().invoices.map((i) => i.invoiceNumber);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(second.invoiceNumber).not.toBe(first.invoiceNumber);
  });

  it('returns stock and reduces the customer balance when an invoice is cancelled', async () => {
    const stockBefore = product().currentStockUnits!;
    const dueBefore = customer().outstandingBalance;
    const invoice = await sale(5);
    await salesService.cancelInvoice(invoice.id);
    expect(product().currentStockUnits).toBe(stockBefore);
    expect(customer().outstandingBalance).toBe(dueBefore);
  });

  it('refuses to cancel an invoice twice', async () => {
    const invoice = await sale(1);
    await salesService.cancelInvoice(invoice.id);
    await expect(salesService.cancelInvoice(invoice.id)).rejects.toThrow(/already cancelled/);
  });
});

describe('purchases and adjustments', () => {
  it('adds stock and books the unpaid bill to the supplier', async () => {
    const stockBefore = ingredient('ing-1').currentStock;
    const supplier = getDB().suppliers[0];
    const dueBefore = supplier.balanceDue;

    await inventoryService.recordPurchase({
      supplierId: supplier.id,
      itemId: 'ing-1',
      quantity: 100,
      unitPrice: 10,
      amountPaid: 400,
      date: today,
    });

    expect(ingredient('ing-1').currentStock).toBe(stockBefore + 100);
    expect(supplier.balanceDue).toBe(dueBefore + 600);
  });

  it('records a ledger movement when stock is adjusted', async () => {
    const movementsBefore = getDB().movements.length;
    await inventoryService.adjustStock({
      itemId: 'ing-1',
      itemType: 'raw_material',
      newQuantity: 1000,
      reason: 'Physical count',
    });
    expect(ingredient('ing-1').currentStock).toBe(1000);
    expect(getDB().movements.length).toBe(movementsBefore + 1);
  });
});

describe('production', () => {
  const run = () =>
    productionService.createBatch({
      setupId: 'setup-1',
      date: today,
      unitsPacked: 20,
      actualFinishedQuantity: 400,
      actualItems: [
        { ingredientId: 'ing-1', actualQuantity: 300 },
        { ingredientId: 'ing-2', actualQuantity: 80 },
        { ingredientId: 'ing-3', actualQuantity: 20 },
      ],
    });

  it('consumes ingredients and adds finished goods; reversal restores both', async () => {
    const bran = ingredient('ing-1').currentStock;
    const finished = product().currentStockUnits!;

    const batch = await run();
    expect(ingredient('ing-1').currentStock).toBe(bran - 300);
    expect(product().currentStockUnits).toBe(finished + 20);

    await productionService.reverseBatch(batch.id, 'test');
    expect(ingredient('ing-1').currentStock).toBe(bran);
    expect(product().currentStockUnits).toBe(finished);
  });

  it('refuses to reverse a batch whose finished goods were already sold', async () => {
    const batch = await run();
    await salesService.createInvoice({
      customerId: 'cust-1',
      productId: 'prod-1',
      quantity: product().currentStockUnits!,
      unitPrice: 500,
      amountPaidNow: 0,
      date: today,
    });
    await expect(productionService.reverseBatch(batch.id)).rejects.toThrow();
  });
});

describe('running batches', () => {
  const stock = (id: string) => getDB().ingredients.find((i) => i.id === id)!.currentStock;
  const start = () =>
    productionService.startBatchRun({
      setupId: 'setup-1',
      date: '2026-01-01',
      actualItems: [{ ingredientId: 'ing-1', actualQuantity: 300 }],
    });

  it('takes inputs on start and books output on completion', async () => {
    const before = stock('ing-1');
    const finishedBefore = getDB().products.find((p) => p.id === 'prod-1')!.currentStockUnits!;
    const run = await start();
    expect(run.status).toBe('in_progress');
    expect(stock('ing-1')).toBe(before - 300);
    expect(getDB().products.find((p) => p.id === 'prod-1')!.currentStockUnits).toBe(finishedBefore);

    const done = await productionService.completeBatchRun(run.id, {
      unitsPacked: 10,
      unitSize: 20,
    });
    expect(done.status).toBe('confirmed');
    expect(done.actualFinishedQuantity).toBe(200);
    expect(getDB().products.find((p) => p.id === 'prod-1')!.currentStockUnits).toBe(
      finishedBefore + 10,
    );
  });

  it('returns the inputs when a run is cancelled', async () => {
    const before = stock('ing-1');
    const run = await start();
    await productionService.reverseBatch(run.id, 'test');
    expect(stock('ing-1')).toBe(before);
  });
});

describe('run time and rate', () => {
  it('records duration and rate on completion and can remember it on the recipe', async () => {
    const run = await productionService.startBatchRun({
      setupId: 'setup-1',
      date: '2026-01-01',
      actualItems: [{ ingredientId: 'ing-1', actualQuantity: 10 }],
      plannedHours: 4,
      expectedUnits: 100,
    });
    expect(run.startedAt).toBeDefined();
    expect(run.plannedHours).toBe(4);
    const done = await productionService.completeBatchRun(run.id, {
      unitsPacked: 120,
      unitSize: 20,
      durationMinutes: 240,
      rememberRate: true,
    });
    expect(done.durationMinutes).toBe(240);
    expect(done.outputPerHour).toBe(30);
    expect(getDB().setups.find((s) => s.id === 'setup-1')!.outputPerHour).toBe(30);
  });
});

describe('editing and deleting batches', () => {
  const stock = (id: string) => getDB().ingredients.find((i) => i.id === id)!.currentStock;
  const finishedUnits = () => getDB().products.find((p) => p.id === 'prod-1')!.currentStockUnits!;
  const finishedBatch = async () => {
    const run = await productionService.startBatchRun({
      setupId: 'setup-1',
      date: '2026-01-01',
      actualItems: [{ ingredientId: 'ing-1', actualQuantity: 100 }],
    });
    return productionService.completeBatchRun(run.id, { unitsPacked: 10, unitSize: 20 });
  };

  it('moves finished stock when the output is edited', async () => {
    const batch = await finishedBatch();
    const before = finishedUnits();
    const edited = await productionService.updateBatch(batch.id, {
      unitsPacked: 12,
      notes: 'fixed',
    });
    expect(edited.unitsPacked).toBe(12);
    expect(edited.actualFinishedQuantity).toBe(240);
    expect(edited.notes).toBe('fixed');
    expect(finishedUnits()).toBe(before + 2);
  });

  it('refuses to lower output below what is still in stock', async () => {
    const batch = await finishedBatch();
    await salesService.createInvoice({
      customerId: 'cust-1',
      productId: 'prod-1',
      quantity: finishedUnits(),
      unitPrice: 100,
      amountPaidNow: 0,
      date: today,
    });
    await expect(productionService.updateBatch(batch.id, { unitsPacked: 1 })).rejects.toThrow();
  });

  it('deleting puts stock back and removes the ledger entries', async () => {
    const bran = stock('ing-1');
    const finished = finishedUnits();
    const batch = await finishedBatch();
    await productionService.deleteBatch(batch.id);
    expect(stock('ing-1')).toBe(bran);
    expect(finishedUnits()).toBe(finished);
    expect(getDB().batches.some((b) => b.id === batch.id)).toBe(false);
    expect(getDB().movements.some((m) => m.referenceId === batch.id)).toBe(false);
  });

  it('deletes a running batch and returns its inputs', async () => {
    const bran = stock('ing-1');
    const run = await productionService.startBatchRun({
      setupId: 'setup-1',
      date: '2026-01-01',
      actualItems: [{ ingredientId: 'ing-1', actualQuantity: 50 }],
    });
    await productionService.deleteBatch(run.id);
    expect(stock('ing-1')).toBe(bran);
  });
});

describe('deleting a recipe', () => {
  it('removes an unused recipe and archives one with batch history', async () => {
    const created = await productionService.createSetup({
      name: 'Temp mix',
      productName: 'Temp product',
      recipeItems: [{ ingredientId: 'ing-1', targetQuantity: 5 }],
    });
    expect(await productionService.deleteSetup(created.id)).toBe('deleted');
    expect((await productionService.getSetups()).some((s) => s.id === created.id)).toBe(false);

    await productionService.createBatch({
      setupId: 'setup-1',
      date: '2026-01-01',
      unitsPacked: 1,
      actualFinishedQuantity: 20,
      actualItems: [{ ingredientId: 'ing-1', actualQuantity: 1 }],
    });
    expect(await productionService.deleteSetup('setup-1')).toBe('archived');
  });
});

describe('payment terms', () => {
  it('sets a due date only for credit invoices', async () => {
    const base = {
      customerId: 'cust-1',
      productId: 'prod-1',
      quantity: 1,
      unitPrice: 100,
      date: '2026-01-30',
      paymentTermDays: 15,
    };
    const credit = await salesService.createInvoice({
      ...base,
      amountPaidNow: 0,
    });
    expect(credit.dueDate).toBe('2026-02-14');
    const paid = await salesService.createInvoice({
      ...base,
      amountPaidNow: 100,
    });
    expect(paid.dueDate).toBeUndefined();
  });
});

describe('editing master data', () => {
  it('updates a customer without touching the money balances', async () => {
    const before = { ...customer() };
    await customerService.updateCustomer('cust-1', {
      name: 'Renamed Traders',
      phone: '99999',
      address: 'New address',
    });
    expect(customer().name).toBe('Renamed Traders');
    expect(customer().outstandingBalance).toBe(before.outstandingBalance);
    expect(customer().totalPurchases).toBe(before.totalPurchases);
  });

  it('keeps issued invoices as they were when a customer is renamed', async () => {
    const invoiceName = getDB().invoices[0].customerName;
    await customerService.updateCustomer('cust-1', {
      name: 'Renamed',
      phone: '1',
      address: 'x',
    });
    expect(getDB().invoices[0].customerName).toBe(invoiceName);
  });

  it('updates a supplier and a product price', async () => {
    const supplier = getDB().suppliers[0];
    await inventoryService.updateSupplier(supplier.id, {
      name: 'New Vendor',
      phone: '123',
    });
    expect(getDB().suppliers[0].name).toBe('New Vendor');

    await inventoryService.updateProduct('prod-1', {
      name: 'Renamed Product',
      sellingPricePerUnit: 650,
    });
    expect(product().name).toBe('Renamed Product');
    expect(product().sellingPricePerUnit).toBe(650);
  });

  it('rejects edits to records that do not exist', async () => {
    await expect(
      inventoryService.updateProduct('nope', {
        name: 'x',
        sellingPricePerUnit: 1,
      }),
    ).rejects.toThrow(/not found/);
  });
});

describe('business settings', () => {
  it('saves currency and unit preferences without touching other settings', async () => {
    const before = { ...getDB().settings };
    await dashboardService.updateFactorySettings({
      currencySymbol: '$',
      defaultUnitName: 'drums',
      lowUnitsThreshold: 12,
    });
    expect(getDB().settings.currencySymbol).toBe('$');
    expect(getDB().settings.defaultUnitName).toBe('drums');
    expect(getDB().settings.lowUnitsThreshold).toBe(12);
    expect(getDB().settings.factoryName).toBe(before.factoryName);
  });
});

describe('using stock outside a batch', () => {
  it('reduces raw material stock and records an out movement', async () => {
    const before = ingredient('ing-1').currentStock;
    const movements = getDB().movements.length;
    await inventoryService.recordUsage({
      itemId: 'ing-1',
      quantity: 25,
      kind: 'waste',
      note: 'Spilled',
    });
    expect(ingredient('ing-1').currentStock).toBe(before - 25);
    const last = getDB().movements[0];
    expect(getDB().movements.length).toBe(movements + 1);
    expect(last).toMatchObject({
      movementType: 'stock_waste',
      direction: 'out',
      quantity: 25,
    });
  });

  it('refuses to use more than is in stock, or zero', async () => {
    const before = ingredient('ing-1').currentStock;
    await expect(
      inventoryService.recordUsage({
        itemId: 'ing-1',
        quantity: before + 1,
        kind: 'usage',
      }),
    ).rejects.toThrow(/Only/);
    await expect(
      inventoryService.recordUsage({
        itemId: 'ing-1',
        quantity: 0,
        kind: 'usage',
      }),
    ).rejects.toThrow(/above 0/);
    expect(ingredient('ing-1').currentStock).toBe(before);
  });

  it('does not allow finished goods to be used this way', async () => {
    await expect(
      inventoryService.recordUsage({
        itemId: 'prod-1',
        quantity: 1,
        kind: 'usage',
      }),
    ).rejects.toThrow(/raw materials/);
  });
});

describe('backup and restore', () => {
  it('round-trips everything through an export', () => {
    const file = exportDatabase();
    const customers = getDB().customers.length;
    clearDatabase();
    expect(getDB().customers).toHaveLength(0);
    importDatabase(file);
    expect(getDB().customers).toHaveLength(customers);
  });

  it('keeps business settings when clearing', () => {
    const name = getDB().settings.factoryName;
    clearDatabase();
    expect(getDB().settings.factoryName).toBe(name);
    expect(getDB().invoices).toHaveLength(0);
  });

  it('rejects files that are not backups', () => {
    expect(() => importDatabase('nope')).toThrow('not a BatchIQ backup');
    expect(() => importDatabase(JSON.stringify({ app: 'other', data: {} }))).toThrow();
    expect(() =>
      importDatabase(JSON.stringify({ app: 'batchiq', version: 1, data: { settings: {} } })),
    ).toThrow('incomplete');
  });
});
