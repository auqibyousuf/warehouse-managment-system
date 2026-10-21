/** Pure helpers for run time, production rate and the cost/profit estimate of a batch. */

/** Packs made in `hours` at `outputPerHour`. */
export const outputForHours = (outputPerHour: number, hours: number): number =>
  outputPerHour > 0 && hours > 0 ? Math.round(outputPerHour * hours * 100) / 100 : 0;

/** Hours needed to make `units` at `outputPerHour`. */
export const hoursForOutput = (outputPerHour: number, units: number): number =>
  outputPerHour > 0 && units > 0 ? Math.round((units / outputPerHour) * 100) / 100 : 0;

export interface Rates {
  perHour: number;
  perMinute: number;
  /** Minutes to make one pack. */
  minutesPerUnit: number;
}

export const ratesFor = (units: number, minutes: number): Rates | null =>
  units > 0 && minutes > 0
    ? {
        perHour: Math.round(((units * 60) / minutes) * 100) / 100,
        perMinute: Math.round((units / minutes) * 100) / 100,
        minutesPerUnit: Math.round((minutes / units) * 100) / 100,
      }
    : null;

/** "2 h 15 min", "45 min", "3 h". */
export const formatDuration = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export interface ProfitEstimate {
  revenue: number;
  profit: number;
  /** Profit as a share of revenue, 0 to 100 (can be negative). */
  marginPct: number;
  costPerUnit: number;
  profitPerUnit: number;
}

/** Null when there is no output or no selling price to estimate from. */
export const profitEstimate = (
  units: number,
  sellingPrice: number,
  totalCost: number,
): ProfitEstimate | null => {
  if (!(units > 0) || !(sellingPrice > 0)) return null;
  const revenue = units * sellingPrice;
  const profit = revenue - totalCost;
  return {
    revenue,
    profit,
    marginPct: Math.round((profit / revenue) * 1000) / 10,
    costPerUnit: totalCost / units,
    profitPerUnit: profit / units,
  };
};

export interface BreakdownLine {
  name: string;
  quantity: number;
  unit: string;
  /** Cost of one unit. */
  rate: number;
}

export interface BatchBreakdownInput {
  lines: BreakdownLine[];
  packagingCost: number;
  /** Packs made (expected or actual). */
  units: number;
  /** Size of one pack in `baseUnit`; 0 when unknown. */
  packSize: number;
  /** Selling price of one pack; 0 when not set. */
  price: number;
}

export interface BatchBreakdown {
  lines: (BreakdownLine & { cost: number; sharePct: number })[];
  materialsCost: number;
  packagingCost: number;
  totalCost: number;
  units: number;
  /** Total made in the base unit (packs × pack size), 0 when pack size unknown. */
  totalQuantity: number;
  costPerUnit: number;
  costPerBaseUnit: number;
  /** Null when no selling price is set. */
  sales: null | {
    salesValue: number;
    /** What the batch added on top of the materials it used: sales value − materials. */
    valueAdded: number;
    /** What is left after materials and packaging: sales value − total cost. */
    gain: number;
    marginPct: number;
    gainPerUnit: number;
    gainPerBaseUnit: number;
  };
}

/** Everything the batch screens show about cost, value added and gain, from one set of inputs. */
export const batchBreakdown = (input: BatchBreakdownInput): BatchBreakdown => {
  const costed = input.lines.map((l) => ({ ...l, cost: l.quantity * l.rate }));
  const materialsCost = costed.reduce((sum, l) => sum + l.cost, 0);
  const totalCost = materialsCost + input.packagingCost;
  const units = input.units > 0 ? input.units : 0;
  const totalQuantity = units * (input.packSize > 0 ? input.packSize : 0);
  const salesValue = units * input.price;
  return {
    lines: costed.map((l) => ({
      ...l,
      sharePct: materialsCost > 0 ? Math.round((l.cost / materialsCost) * 1000) / 10 : 0,
    })),
    materialsCost,
    packagingCost: input.packagingCost,
    totalCost,
    units,
    totalQuantity,
    costPerUnit: units > 0 ? totalCost / units : 0,
    costPerBaseUnit: totalQuantity > 0 ? totalCost / totalQuantity : 0,
    sales:
      units > 0 && input.price > 0
        ? {
            salesValue,
            valueAdded: salesValue - materialsCost,
            gain: salesValue - totalCost,
            marginPct: Math.round(((salesValue - totalCost) / salesValue) * 1000) / 10,
            gainPerUnit: (salesValue - totalCost) / units,
            gainPerBaseUnit: totalQuantity > 0 ? (salesValue - totalCost) / totalQuantity : 0,
          }
        : null,
  };
};
