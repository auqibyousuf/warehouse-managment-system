import { useCurrencySymbol } from '../../../hooks/useMoney';
import { theme } from '../../../theme';
import React, { useState } from 'react';
import { useCreateIngredient } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import { Modal, Box, Stack, Row, Typography, TextInput, Button } from '../../../components';

export interface CreateIngredientModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated?: (ing: any) => void;
}

const COMMON_RAW_UNITS = ['kg', 'L', 'g', 'ml', 'tons', 'bags', 'drums', 'pcs'];

export const CreateIngredientModal: React.FC<CreateIngredientModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const symbol = useCurrencySymbol();
  const createIngredientMutation = useCreateIngredient();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'raw_material' | 'packaging'>('raw_material');
  const [unit, setUnit] = useState('kg');
  const [unitCost, setUnitCost] = useState('20');
  const [initialStock, setInitialStock] = useState('0');
  const [minThreshold, setMinThreshold] = useState('100');
  const [error, setError] = useState('');

  const handleReset = () => {
    setName('');
    setCategory('raw_material');
    setUnit('kg');
    setUnitCost('20');
    setInitialStock('0');
    setMinThreshold('100');
    setError('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Material / ingredient name is required');
      return;
    }
    if (!unit.trim()) {
      setError('Measurement unit is required');
      return;
    }

    try {
      const created = await createIngredientMutation.mutateAsync({
        name: name.trim(),
        category,
        unit: unit.trim(),
        unitCost: parseFloat(unitCost) || 0,
        initialStock: parseFloat(initialStock) || 0,
        minThreshold: parseFloat(minThreshold) || 100,
      });

      setBannerAlert({
        title: 'Raw Material Created',
        message: `${created.name} (${created.unit}) added to inventory. Ready for recipes!`,
        variant: 'success',
      });

      if (onCreated) {
        onCreated(created);
      }
      handleReset();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create raw material');
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Add New Raw Material / Item"
      primaryAction={{
        label: createIngredientMutation.isPending ? 'Saving...' : 'Save Material',
        onPress: handleSubmit,
        loading: createIngredientMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: () => {
          handleReset();
          onClose();
        },
      }}
    >
      <Stack gap="md">
        <Typography variant="caption" color="muted">
          Define the raw material, base unit of measurement, and initial stock level before using it
          in production recipes or batches.
        </Typography>

        {/* Category Toggle */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.xsm }}>
            Item Category
          </Typography>
          <Row gap="xs">
            <Button
              label="Raw Material"
              variant={category === 'raw_material' ? 'primary' : 'subtle'}
              size="sm"
              onPress={() => setCategory('raw_material')}
            />
            <Button
              label="Packaging Unit"
              variant={category === 'packaging' ? 'primary' : 'subtle'}
              size="sm"
              onPress={() => setCategory('packaging')}
            />
          </Row>
        </Box>

        {/* Material Name */}
        <TextInput
          label="Material / Item Name"
          placeholder="e.g. Rice Bran, Cane Molasses, Mineral Premix, Water"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError('');
          }}
          error={error}
        />

        {/* Unit Selector & Custom Input */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
            Unit of Measurement
          </Typography>
          <Row gap="xs" wrap style={{ marginBottom: theme.spacing.sm }}>
            {COMMON_RAW_UNITS.map((u) => (
              <Button
                key={u}
                label={u}
                variant={unit === u ? 'secondary' : 'subtle'}
                size="sm"
                onPress={() => setUnit(u)}
              />
            ))}
          </Row>
          <TextInput
            label="Or Custom Unit"
            placeholder="Type any unit: kg, L, bags, drums, pcs, etc."
            value={unit}
            onChangeText={setUnit}
          />
        </Box>

        {/* Unit Cost & Initial Stock */}
        <Row gap="md">
          <Box flex={1}>
            <TextInput
              label={`Standard Cost / ${unit}`}
              value={unitCost}
              onChangeText={setUnitCost}
              keyboardType="numeric"
              prefix={symbol}
            />
          </Box>
          <Box flex={1}>
            <TextInput
              label={`Initial Stock (${unit})`}
              value={initialStock}
              onChangeText={setInitialStock}
              keyboardType="numeric"
              suffix={unit}
            />
          </Box>
        </Row>

        {/* Alert Threshold */}
        <TextInput
          label={`Low Stock Alert Threshold (${unit})`}
          value={minThreshold}
          onChangeText={setMinThreshold}
          keyboardType="numeric"
          suffix={unit}
          hint="Warning triggers when inventory falls below this amount"
        />
      </Stack>
    </Modal>
  );
};
