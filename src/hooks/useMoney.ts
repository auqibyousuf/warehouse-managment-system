import { useCallback } from 'react';
import { useFactorySettings } from './api/useDashboard';
import { DEFAULT_CURRENCY_SYMBOL, formatMoney } from '../utils/money';

/** The business currency symbol from the editable profile. */
export const useCurrencySymbol = (): string => {
  const { data } = useFactorySettings();
  return data?.currencySymbol?.trim() || DEFAULT_CURRENCY_SYMBOL;
};

/** Formatter bound to the business currency: `money(5400)` gives "₹5,400". */
export const useMoney = (): ((value: number) => string) => {
  const symbol = useCurrencySymbol();
  return useCallback((value: number) => formatMoney(value, symbol), [symbol]);
};
