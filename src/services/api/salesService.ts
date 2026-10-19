/**
 * BatchIQ - Sales & Payments API Service
 * Invoicing, cash/credit sales, payment allocations, and customer ledger management.
 */

import { getDB } from './mockDatabase';
import { simulateNetwork, generateId } from './apiClient';
import { SaleInvoice, CustomerPayment, InvoiceStatus } from '../../types';

export interface CreateSaleInput {
  customerId: string;
  productId: string;
  quantity?: number;
  outputUnit?: string;
  bagQuantity?: number;
  unitPrice: number;
  discount?: number;
  amountPaidNow: number;
  paymentMethod?: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  date: string;
  notes?: string;
}

export interface RecordCustomerPaymentInput {
  customerId: string;
  invoiceId?: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  date: string;
  notes?: string;
}

export const salesService = {
  // Get all sales invoices
  getInvoices: async (): Promise<SaleInvoice[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.invoices].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  },

  // Get payments history
  getPayments: async (): Promise<CustomerPayment[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.payments].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  },

  // Create sales invoice: validates stock, calculates totals, reduces finished goods stock, records cash vs credit
  createInvoice: async (input: CreateSaleInput): Promise<SaleInvoice> => {
    return simulateNetwork(() => {
      const db = getDB();
      const customer = db.customers.find((c) => c.id === input.customerId);
      if (!customer) throw new Error('Customer not found');

      const product = db.products.find((p) => p.id === input.productId);
      if (!product) throw new Error('Product not found');

      const qty = input.quantity || input.bagQuantity || 1;
      const unit = input.outputUnit || product.outputUnit || 'units';
      const available =
        product.currentStockUnits !== undefined
          ? product.currentStockUnits
          : (product.currentStockBags ?? 0);

      if (available < qty) {
        throw new Error(
          `Insufficient stock. Available: ${available} ${unit}, Requested: ${qty} ${unit}.`
        );
      }

      const subtotal = qty * input.unitPrice;
      const discount = input.discount || 0;
      const totalAmount = Math.max(0, subtotal - discount);
      const amountPaid = Math.min(totalAmount, input.amountPaidNow || 0);
      const balanceDue = totalAmount - amountPaid;
      const isCredit = balanceDue > 0;

      let paymentStatus: InvoiceStatus = 'unpaid';
      if (amountPaid >= totalAmount) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partial';
      }

      // Deduct finished stock
      if (product.currentStockUnits !== undefined) {
        product.currentStockUnits -= qty;
      }
      if (product.currentStockBags !== undefined) {
        product.currentStockBags -= qty;
      }

      // Update customer ledger
      customer.totalPurchases += totalAmount;
      customer.totalPaid += amountPaid;
      customer.outstandingBalance += balanceDue;

      const invoiceId = generateId('inv');
      const invoiceNumber = `INV-2026-${(db.invoices.length + 1).toString().padStart(3, '0')}`;

      const newInvoice: SaleInvoice = {
        id: invoiceId,
        invoiceNumber,
        date: input.date,
        customerId: customer.id,
        customerName: customer.name,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        outputUnit: unit,
        bagQuantity: qty,
        unitPrice: input.unitPrice,
        subtotal,
        discount,
        totalAmount,
        amountPaid,
        balanceDue,
        paymentStatus,
        isCredit,
      };

      db.invoices.unshift(newInvoice);

      // Record dispatch movement
      db.movements.unshift({
        id: generateId('mov'),
        date: input.date,
        itemId: product.id,
        itemName: product.name,
        itemType: 'finished_feed',
        movementType: 'sale_dispatch',
        quantity: qty,
        unit,
        direction: 'out',
        referenceType: 'sale',
        referenceId: invoiceId,
        notes: `Dispatch to ${customer.name} for invoice ${invoiceNumber}`,
      });

      // If immediate payment received, create payment record
      if (amountPaid > 0) {
        db.payments.unshift({
          id: generateId('pay'),
          paymentNumber: `REC-2026-${(db.payments.length + 1).toString().padStart(3, '0')}`,
          date: input.date,
          customerId: customer.id,
          customerName: customer.name,
          invoiceId,
          amount: amountPaid,
          paymentMethod: input.paymentMethod || 'cash',
          notes: `Immediate payment on invoice ${invoiceNumber}`,
        });
      }

      return newInvoice;
    });
  },

  // Record customer payment and allocate to invoice/dues
  recordPayment: async (input: RecordCustomerPaymentInput): Promise<CustomerPayment> => {
    return simulateNetwork(() => {
      const db = getDB();
      const customer = db.customers.find((c) => c.id === input.customerId);
      if (!customer) throw new Error('Customer not found');

      // Update invoice if specified
      if (input.invoiceId) {
        const invoice = db.invoices.find((i) => i.id === input.invoiceId);
        if (invoice) {
          invoice.amountPaid += input.amount;
          invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);
          invoice.paymentStatus =
            invoice.balanceDue === 0 ? 'paid' : invoice.amountPaid > 0 ? 'partial' : 'unpaid';
        }
      }

      // Update customer running balance
      customer.totalPaid += input.amount;
      customer.outstandingBalance = Math.max(0, customer.outstandingBalance - input.amount);

      const paymentId = generateId('pay');
      const paymentNumber = `REC-2026-${(db.payments.length + 1).toString().padStart(3, '0')}`;

      const newPayment: CustomerPayment = {
        id: paymentId,
        paymentNumber,
        date: input.date,
        customerId: customer.id,
        customerName: customer.name,
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      };

      db.payments.unshift(newPayment);
      return newPayment;
    });
  },

  // Controlled cancellation of an invoice
  cancelInvoice: async (invoiceId: string, reason?: string): Promise<SaleInvoice> => {
    return simulateNetwork(() => {
      const db = getDB();
      const invoice = db.invoices.find((i) => i.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.paymentStatus === 'cancelled') throw new Error('Invoice is already cancelled.');

      const product = db.products.find((p) => p.id === invoice.productId);
      const customer = db.customers.find((c) => c.id === invoice.customerId);

      // Return finished goods stock
      if (product) {
        const returnQty = invoice.quantity || invoice.bagQuantity || 0;
        const returnUnit = invoice.outputUnit || product.outputUnit || 'units';
        if (product.currentStockUnits !== undefined) {
          product.currentStockUnits += returnQty;
        }
        if (product.currentStockBags !== undefined) {
          product.currentStockBags += returnQty;
        }
        db.movements.unshift({
          id: generateId('mov'),
          date: new Date().toISOString().split('T')[0],
          itemId: product.id,
          itemName: product.name,
          itemType: 'finished_feed',
          movementType: 'reversal',
          quantity: returnQty,
          unit: returnUnit,
          direction: 'in',
          referenceType: 'sale',
          referenceId: invoice.id,
          notes: `Stock return on cancelled invoice ${invoice.invoiceNumber}`,
        });
      }

      // Reverse customer balance adjustments
      if (customer) {
        customer.totalPurchases = Math.max(0, customer.totalPurchases - invoice.totalAmount);
        customer.totalPaid = Math.max(0, customer.totalPaid - invoice.amountPaid);
        customer.outstandingBalance = Math.max(0, customer.outstandingBalance - invoice.balanceDue);
      }

      invoice.paymentStatus = 'cancelled';
      invoice.cancelledAt = new Date().toISOString();

      return { ...invoice };
    });
  },
};
