import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema, ExpenseFormData } from '../../../validation/schemas';
import { useCreateExpense } from '../../../hooks/api/useExpenses';
import { useAppStore } from '../../../stores/useAppStore';
import { ExpenseCategory } from '../../../types';
import {
  Modal,
  Box,
  Stack,
  Row,
  Typography,
  TextInput,
  Button,
} from '../../../components';

export interface RecordExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'electricity', label: 'Electricity' },
  { id: 'labour', label: 'Labour / Wages' },
  { id: 'transport', label: 'Transport / Diesel' },
  { id: 'maintenance', label: 'Machine Repairs' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'other', label: 'Other Operating' },
];

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  visible,
  onClose,
}) => {
  const createExpenseMutation = useCreateExpense();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: 'electricity',
      amount: 5000,
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentStatus: 'paid',
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await createExpenseMutation.mutateAsync({
        category: data.category,
        amount: data.amount,
        description: data.description,
        date: data.date,
        paymentStatus: data.paymentStatus,
      });

      setBannerAlert({
        title: 'Expense Recorded',
        message: `Logged ₹${data.amount.toLocaleString('en-IN')} under ${data.category}. Included in period profit calculations.`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Error',
        message: err.message || 'Failed to record expense',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Record Operating Expense"
      subtitle="Electricity, labour wages, repairs, and transport"
      primaryAction={{
        label: 'Save Expense',
        onPress: handleSubmit(onSubmit),
        loading: createExpenseMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Category Picker */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: 6 }}>
            Expense Category
          </Typography>
          <Row gap="xs" wrap>
            {CATEGORIES.map((cat) => {
              const isSelected = cat.id === selectedCategory;
              return (
                <Button
                  key={cat.id}
                  label={cat.label}
                  variant={isSelected ? 'primary' : 'subtle'}
                  size="sm"
                  onPress={() => setValue('category', cat.id)}
                />
              );
            })}
          </Row>
        </Box>

        {/* Date Field */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Expense Date"
              value={value}
              onChangeText={onChange}
              leftIcon="calendar-outline"
              error={errors.date?.message}
            />
          )}
        />

        {/* Amount */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Expense Amount"
              value={value !== undefined ? String(value) : ''}
              onChangeText={(val) => onChange(parseFloat(val) || 0)}
              keyboardType="numeric"
              prefix="₹"
              error={errors.amount?.message}
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Description / Bill Details"
              placeholder="e.g. Electricity bill for October, hammer mill spare blades..."
              value={value}
              onChangeText={onChange}
              multiline
              error={errors.description?.message}
            />
          )}
        />
      </Stack>
    </Modal>
  );
};

export default RecordExpenseModal;
