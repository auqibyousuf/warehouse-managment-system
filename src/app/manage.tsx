import React from 'react';
import { StackScreen } from '../components';
import { ManageScreen } from '../modules/manage/ManageScreen';

export default function Route() {
  return (
    <StackScreen title="Manage" subtitle="Everything beyond the daily tasks">
      <ManageScreen />
    </StackScreen>
  );
}
