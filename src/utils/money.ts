/** Default shown until the profile loads; the real symbol is the editable `currencySymbol` setting. */
export const DEFAULT_CURRENCY_SYMBOL = '₹';

/** Digit grouping follows the currency: lakh/crore grouping for the rupee, thousands elsewhere. */
const localeFor = (symbol: string) => (symbol.trim() === '₹' ? 'en-IN' : 'en-US');

export const formatNumber = (value: number, symbol: string = DEFAULT_CURRENCY_SYMBOL): string =>
  (Number.isFinite(value) ? value : 0).toLocaleString(localeFor(symbol), {
    maximumFractionDigits: 2,
  });

/** Amount with the currency symbol in front, e.g. ₹1,00,000 or $100,000. */
export const formatMoney = (value: number, symbol: string = DEFAULT_CURRENCY_SYMBOL): string =>
  `${symbol}${formatNumber(value, symbol)}`;
