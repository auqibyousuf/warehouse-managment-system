import React from 'react';
import { StackScreen } from '../components';
import { LedgerScreen } from '../modules/ledger/LedgerScreen';

export default function Route() {
  return (
    <StackScreen title="Expenses" subtitle="Operating costs">
      <LedgerScreen tabs={['expenses']} />
    </StackScreen>
  );
}
