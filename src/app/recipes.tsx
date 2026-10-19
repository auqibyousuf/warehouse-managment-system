import React from 'react';
import { StackScreen } from '../components';
import { ProductionScreen } from '../modules/production/ProductionScreen';

export default function Route() {
  return (
    <StackScreen title="Recipes & Batches" subtitle="Formulas and production history">
      <ProductionScreen />
    </StackScreen>
  );
}
