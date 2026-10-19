import React from 'react';
import { StackScreen } from '../components';
import { ProcureScreen } from '../modules/procure/ProcureScreen';

export default function Route() {
  return (
    <StackScreen title="Suppliers & Bills" subtitle="Vendors and purchase bills">
      <ProcureScreen />
    </StackScreen>
  );
}
