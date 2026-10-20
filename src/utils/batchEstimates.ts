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
