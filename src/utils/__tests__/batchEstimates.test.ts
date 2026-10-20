import {
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
