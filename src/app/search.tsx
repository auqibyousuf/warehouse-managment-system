import React from 'react';
import { StackScreen } from '../components';
import { SearchScreen } from '../modules/search/SearchScreen';

export default function Route() {
  return (
    <StackScreen title="Search" subtitle="Customers, invoices, stock, recipes and more">
      <SearchScreen />
    </StackScreen>
  );
}
