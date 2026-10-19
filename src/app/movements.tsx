import React from 'react';
import { StackScreen } from '../components';
import { MovementsScreen } from '../modules/stock/MovementsScreen';

export default function Route() {
  return (
    <StackScreen title="Stock Movements" subtitle="Every change to stock, with its source">
      <MovementsScreen />
    </StackScreen>
  );
}
