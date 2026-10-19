import { formatMoney, formatNumber } from '../money';

describe('money formatting', () => {
  it('uses lakh grouping for the rupee', () => {
    expect(formatMoney(1234567, '₹')).toBe('₹12,34,567');
  });

  it('uses thousands grouping for other currencies', () => {
    expect(formatMoney(1234567, '$')).toBe('$1,234,567');
    expect(formatMoney(1234567, 'AED ')).toBe('AED 1,234,567');
  });

  it('keeps up to two decimals', () => {
    expect(formatMoney(346, '₹')).toBe('₹346');
    expect(formatMoney(18.2, '₹')).toBe('₹18.2');
    expect(formatMoney(18.256, '₹')).toBe('₹18.26');
  });

  it('never prints NaN', () => {
    expect(formatNumber(Number.NaN, '₹')).toBe('0');
    expect(formatMoney(Number.POSITIVE_INFINITY, '₹')).toBe('₹0');
  });
});
