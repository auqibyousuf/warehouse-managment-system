import React from 'react';
import { StackScreen } from '../components';
import { FinancialLedgerScreen } from '../modules/finance/FinancialLedgerScreen';

export default function Route() {
  return (
    <StackScreen title="Financial Ledger" subtitle="What you are owed and what you owe">
      <FinancialLedgerScreen />
    </StackScreen>
  );
}
