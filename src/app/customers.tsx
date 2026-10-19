import React from 'react';
import { StackScreen } from '../components';
import { LedgerScreen } from '../modules/ledger/LedgerScreen';

export default function Route() {
  return (
    <StackScreen title="Customers & Payments" subtitle="Who owes what, and what was collected">
      <LedgerScreen tabs={['customers', 'payments']} />
    </StackScreen>
  );
}
