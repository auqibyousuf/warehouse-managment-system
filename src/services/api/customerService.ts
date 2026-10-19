/**
 * BatchIQ - Customers API Service
 */

import { getDB } from './mockDatabase';
import { simulateNetwork, generateId } from './apiClient';
import { Customer } from '../../types';

export interface CreateCustomerInput {
  name: string;
  phone: string;
  address: string;
  email?: string;
  gstin?: string;
  creditLimit?: number;
  notes?: string;
}

export const customerService = {
  getCustomers: async (): Promise<Customer[]> => {
    return simulateNetwork(() => {
      const db = getDB();
      return [...db.customers];
    });
  },

  getCustomerById: async (id: string): Promise<Customer | undefined> => {
    return simulateNetwork(() => {
      const db = getDB();
      return db.customers.find((c) => c.id === id);
    });
  },

  createCustomer: async (input: CreateCustomerInput): Promise<Customer> => {
    return simulateNetwork(() => {
      const db = getDB();
      const newCustomer: Customer = {
        id: generateId('cust'),
        name: input.name,
        phone: input.phone,
        address: input.address,
        email: input.email,
        gstin: input.gstin,
        creditLimit: input.creditLimit || 0,
        notes: input.notes,
        totalPurchases: 0,
        totalPaid: 0,
        outstandingBalance: 0,
      };

      db.customers.unshift(newCustomer);
      return newCustomer;
    });
  },

  /** Edits contact details only; balances are owned by invoices and payments. */
  updateCustomer: async (id: string, input: CreateCustomerInput): Promise<Customer> => {
    return simulateNetwork(() => {
      const customer = getDB().customers.find((c) => c.id === id);
      if (!customer) throw new Error('Customer not found');
      customer.name = input.name;
      customer.phone = input.phone;
      customer.address = input.address;
      customer.email = input.email;
      customer.gstin = input.gstin;
      customer.creditLimit = input.creditLimit ?? customer.creditLimit;
      customer.notes = input.notes;
      return { ...customer };
    });
  },
};
