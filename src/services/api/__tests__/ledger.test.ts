import { getDB, resetDB } from '../mockDatabase';
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
    await customerService.updateCustomer('cust-1', { name: 'Renamed', phone: '1', address: 'x' });
    expect(getDB().invoices[0].customerName).toBe(invoiceName);
  });

  it('updates a supplier and a product price', async () => {
    const supplier = getDB().suppliers[0];
    await inventoryService.updateSupplier(supplier.id, { name: 'New Vendor', phone: '123' });
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
      inventoryService.updateProduct('nope', { name: 'x', sellingPricePerUnit: 1 }),
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
