import {
  batchBreakdown,
  formatDuration,
  hoursForOutput,
  outputForHours,
  profitEstimate,
  ratesFor,
} from '../batchEstimates';

describe('batch estimates', () => {
  it('works out output from hours and hours from output', () => {
    expect(outputForHours(25, 4)).toBe(100);
    expect(hoursForOutput(25, 100)).toBe(4);
    expect(outputForHours(0, 4)).toBe(0);
    expect(hoursForOutput(25, 0)).toBe(0);
  });

  it('gives rates per hour, minute and pack', () => {
    expect(ratesFor(120, 240)).toEqual({ perHour: 30, perMinute: 0.5, minutesPerUnit: 2 });
    expect(ratesFor(0, 60)).toBeNull();
  });

  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(135)).toBe('2 h 15 min');
  });

  it('estimates profit and margin, or nothing without a price', () => {
    const e = profitEstimate(100, 50, 3000)!;
    expect(e.revenue).toBe(5000);
    expect(e.profit).toBe(2000);
    expect(e.marginPct).toBe(40);
    expect(e.profitPerUnit).toBe(20);
    expect(profitEstimate(100, 0, 3000)).toBeNull();
  });
});

describe('batch breakdown', () => {
  const input = {
    lines: [
      { name: 'Bran', quantity: 300, unit: 'kg', rate: 10 },
      { name: 'Salt', quantity: 20, unit: 'kg', rate: 5 },
    ],
    packagingCost: 200,
    units: 20,
    packSize: 20,
    price: 300,
  };

  it('splits cost, value added and gain', () => {
    const b = batchBreakdown(input);
    expect(b.materialsCost).toBe(3100);
    expect(b.totalCost).toBe(3300);
    expect(b.totalQuantity).toBe(400);
    expect(b.costPerUnit).toBe(165);
    expect(b.costPerBaseUnit).toBe(8.25);
    expect(b.sales?.salesValue).toBe(6000);
    expect(b.sales?.valueAdded).toBe(2900);
    expect(b.sales?.gain).toBe(2700);
    expect(b.sales?.marginPct).toBe(45);
    expect(b.sales?.gainPerUnit).toBe(135);
    expect(b.lines[0].sharePct).toBeCloseTo(96.8, 1);
  });

  it('has no sales figures without a price, and no per-unit figures without output', () => {
    expect(batchBreakdown({ ...input, price: 0 }).sales).toBeNull();
    const none = batchBreakdown({ ...input, units: 0 });
    expect(none.costPerUnit).toBe(0);
    expect(none.sales).toBeNull();
  });
});
