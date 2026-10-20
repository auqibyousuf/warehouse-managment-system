import type { BatchStatus } from '../types';

export interface BatchStatusView {
  label: string;
  badge: 'info' | 'success' | 'danger';
  icon: 'sync' | 'checkmark' | 'refresh';
  tone: 'info' | 'success' | 'danger';
}

/** How a batch status is shown everywhere: Running, Done or Cancelled. */
export const batchStatusView = (status: BatchStatus): BatchStatusView =>
  status === 'in_progress'
    ? { label: 'Running', badge: 'info', icon: 'sync', tone: 'info' }
    : status === 'reversed'
      ? { label: 'Cancelled', badge: 'danger', icon: 'refresh', tone: 'danger' }
      : { label: 'Done', badge: 'success', icon: 'checkmark', tone: 'success' };
