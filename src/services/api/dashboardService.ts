/**
 * BatchIQ - Dashboard API Service
 * Comprehensive aggregation metrics, period filtering, and authoritative profit estimations.
 */

import { getDB } from './mockDatabase';
import { simulateNetwork } from './apiClient';
import { DashboardMetrics, FactorySettings } from '../../types';

export const dashboardService = {
  getMetrics: async (
    period: 'today' | 'this_week' | 'this_month' | 'all_time' = 'this_month'
  ): Promise<DashboardMetrics> => {
    return simulateNetwork(() => {
      const db = getDB();

      // Date filtering helper
      const now = new Date();
      const toDateKey = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // week starts Monday
      const startOfDay = toDateKey(now);
      const startOfWeek = toDateKey(weekStart);
      const startOfMonth = toDateKey(new Date(now.getFullYear(), now.getMonth(), 1));

      const isDateInPeriod = (dateStr: string): boolean => {
        if (period === 'all_time') return true;
        if (period === 'today') return dateStr >= startOfDay;
        if (period === 'this_week') return dateStr >= startOfWeek;
        if (period === 'this_month') return dateStr >= startOfMonth;
        return true;
      };

      // 1. Production metrics
      const periodBatches = db.batches.filter(
        (b) => b.status === 'confirmed' && isDateInPeriod(b.date)
      );
      const totalUnitsProduced = periodBatches.reduce((acc, b) => acc + (b.unitsPacked || b.bagsPacked || 0), 0);
      const totalBaseQuantity = periodBatches.reduce((acc, b) => acc + (b.actualFinishedQuantity || b.actualFinishedWeightKg || 0), 0);
      const productionCost = periodBatches.reduce((acc, b) => acc + b.directBatchCost, 0);
      const totalBatches = periodBatches.length;

      // Average production cost per unit
      const avgCostPerUnit =
        totalUnitsProduced > 0
          ? productionCost / totalUnitsProduced
          : db.batches.length > 0
          ? (db.batches[0].directCostPerUnit || db.batches[0].directCostPerBag || 0)
          : 0;

      // 2. Sales metrics
      const periodInvoices = db.invoices.filter(
        (inv) => inv.paymentStatus !== 'cancelled' && isDateInPeriod(inv.date)
      );
      const totalUnitsSold = periodInvoices.reduce((acc, inv) => acc + (inv.quantity || inv.bagQuantity || 0), 0);
      const salesRevenue = periodInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

      // 3. Cash Collections
      const periodPayments = db.payments.filter((p) => isDateInPeriod(p.date));
      const cashCollected = periodPayments.reduce((acc, p) => acc + p.amount, 0);

      // Outstanding customer dues across all active customers
      const outstandingDues = db.customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

      // 4. Inventory metrics
      const rawMaterialsCount = db.ingredients.length;
      const finishedUnitsCount = db.products.reduce((acc, p) => acc + (p.currentStockUnits !== undefined ? p.currentStockUnits : (p.currentStockBags || 0)), 0);
      const lowIngredientsCount = db.ingredients.filter(
        (i) => i.currentStock <= i.minThreshold
      ).length;
      const lowProductsCount = db.products.filter(
        (p) => (p.currentStockUnits !== undefined ? p.currentStockUnits : (p.currentStockBags || 0)) <= (db.settings.lowUnitsThreshold || db.settings.lowBagsThreshold || 100)
      ).length;
      const lowStockCount = lowIngredientsCount + lowProductsCount;

      // 5. Financial & Profit Reporting (PRD Section 3.4 & 5.4)
      // Cost of Goods Sold = units actually sold * unit cost
      const costOfGoodsSold = Math.round(totalUnitsSold * avgCostPerUnit);

      // Operating Expenses
      const periodExpenses = db.expenses.filter((e) => isDateInPeriod(e.date));
      const operatingExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);

      // Estimated Operating Profit = Sales Revenue - Cost of Goods Sold - Operating Expenses
      const estimatedOperatingProfit = salesRevenue - costOfGoodsSold - operatingExpenses;

      const defaultUnit = db.settings.defaultUnitName || 'bags';
      const baseUnit = db.settings.defaultBaseUnit || 'kg';

      return {
        period,
        production: {
          totalUnitsProduced,
          totalBaseQuantity,
          totalBatches,
          productionCost,
          defaultUnitName: defaultUnit,
          baseUnit,
          totalBagsProduced: totalUnitsProduced,
          totalWeightKg: totalBaseQuantity,
        },
        sales: {
          totalUnitsSold,
          salesRevenue,
          cashCollected,
          outstandingDues,
          defaultUnitName: defaultUnit,
          totalBagsSold: totalUnitsSold,
        },
        inventory: {
          rawMaterialsCount,
          finishedUnitsCount,
          lowStockCount,
          finishedFeedBags: finishedUnitsCount,
        },
        financial: {
          salesRevenue,
          cashCollected,
          costOfGoodsSold,
          productionCost,
          operatingExpenses,
          estimatedOperatingProfit,
        },
      };
    });
  },

  getFactorySettings: async () => {
    return simulateNetwork(() => {
      const db = getDB();
      return { ...db.settings };
    });
  },

  updateFactorySettings: async (newSettings: Partial<FactorySettings>) => {
    return simulateNetwork(() => {
      const db = getDB();
      db.settings = {
        ...db.settings,
        ...newSettings,
      };
      return { ...db.settings };
    });
  },
};
