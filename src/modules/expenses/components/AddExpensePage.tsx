import React, { useState } from 'react';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { useCreateExpense } from '../../../hooks/api/useExpenses';
import { useAppStore } from '../../../stores/useAppStore';
import { ExpenseCategory } from '../../../types';
import {
  Button,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  OptionGrid,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface AddExpensePageProps {
  onClose: () => void;
}

const CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  icon:
    | 'flash-outline'
    | 'people-outline'
    | 'car-outline'
    | 'construct-outline'
    | 'archive-outline'
    | 'ellipsis-horizontal-circle-outline';
}[] = [
  { value: 'electricity', label: 'Electricity', icon: 'flash-outline' },
  { value: 'labour', label: 'Labour / Wages', icon: 'people-outline' },
  { value: 'transport', label: 'Transport / Diesel', icon: 'car-outline' },
  { value: 'maintenance', label: 'Repairs', icon: 'construct-outline' },
  { value: 'packaging', label: 'Packaging', icon: 'archive-outline' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

/** Add Expense: log an operating cost so it counts in profit. */
export const AddExpensePage: React.FC<AddExpensePageProps> = ({ onClose }) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const create = useCreateExpense();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'paid' | 'unpaid'>('paid');
  const [error, setError] = useState('');

  const value = Number(amount) || 0;

  const submit = async () => {
    if (!category) return setError('Choose a category');
    if (!(value > 0)) return setError('Enter an amount above 0');
    if (description.trim().length < 3) return setError('Add a short description');
    try {
      await create.mutateAsync({
        category,
        amount: value,
        description: description.trim(),
        date: new Date().toISOString().split('T')[0],
        paymentStatus: status,
      });
      setBannerAlert({
        title: 'Expense recorded',
        message: `${money(value)} logged. It now counts in profit.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not record this expense');
    }
  };

  return (
    <FlowPage title="Add Expense" onClose={onClose}>
      <FlowHeaderCard
        icon="card-outline"
        tone="warning"
        title="Record Expense"
        description="Electricity, wages, repairs, transport"
        chip="Expense"
      />

      <FlowSection label="Category" hint="Required">
        <OptionGrid
          tone="warning"
          options={CATEGORIES}
          selected={category}
          onSelect={(v) => {
            setCategory(v);
            setError('');
          }}
        />
      </FlowSection>

      <FlowSection label="Amount">
        <TextInput
          label="Amount"
          value={amount}
          onChangeText={(t) => {
            setAmount(t);
            setError('');
          }}
          keyboardType="numeric"
          prefix={symbol}
        />
        <ChipPicker
          options={[
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Pay later' },
          ]}
          selected={status}
          onSelect={(v) => setStatus(v as 'paid' | 'unpaid')}
          variant="segmented"
        />
      </FlowSection>

      <FlowSection label="Details">
        <TextInput
          label="Description"
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setError('');
          }}
          placeholder="e.g. October electricity bill"
          multiline
        />
      </FlowSection>

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label={value > 0 ? `Save ${money(value)} expense` : 'Save expense'}
          variant="warning"
          size="lg"
          leftIcon="checkmark-circle-outline"
          fullWidth
          loading={create.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default AddExpensePage;
