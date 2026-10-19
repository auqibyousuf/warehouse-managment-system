import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { openSheet } from '../../../navigation/sheets';
import { theme } from '../../../theme';
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { batchRunSchema, BatchRunFormData, BatchRunFormInput } from '../../../validation/schemas';
import { useProductionSetups, useCreateProductionBatch } from '../../../hooks/api/useProduction';
import { useIngredients } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Box,
  Stack,
  Row,
  Typography,
  TextInput,
  Button,
  Badge,
  Card,
  Divider,
  StepIndicator,
} from '../../../components';

export interface StartRunModalProps {
  visible: boolean;
  onClose: () => void;
  preselectedSetupId?: string | null;
}

const COMMON_OUTPUT_UNITS = [
  'bags',
  'bottles',
  'drums',
  'cans',
  'cartons',
  'boxes',
  'pouches',
  'tins',
  'units',
];

const STEPS = ['Recipe', 'Output', 'Materials & cost'];
const STEP_FIELDS: (keyof BatchRunFormInput)[][] = [
  ['setupId', 'date'],
  ['unitsPacked', 'outputUnit', 'actualFinishedQuantity', 'baseUnit', 'measurableWastage'],
  [],
];

export const StartRunModal: React.FC<StartRunModalProps> = ({
  visible,
  onClose,
  preselectedSetupId,
}) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const createBatchMutation = useCreateProductionBatch();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const activeSetups = setups.filter((s) => s.status === 'active');
  const [step, setStep] = useState(0);
  const [selectedSetupId, setSelectedSetupId] = useState<string>('');

  const selectedSetup = setups.find((s) => s.id === selectedSetupId) || activeSetups[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<BatchRunFormInput, unknown, BatchRunFormData>({
    resolver: zodResolver(batchRunSchema),
    defaultValues: {
      setupId: '',
      date: new Date().toISOString().split('T')[0],
      unitsPacked: 50,
      outputUnit: 'bags',
      actualFinishedQuantity: 1000,
      baseUnit: 'kg',
      measurableWastage: 0,
      actualItems: [],
      notes: '',
    },
  });

  // When setup changes, populate ingredients and units
  useEffect(() => {
    const setupToUse = preselectedSetupId
      ? setups.find((s) => s.id === preselectedSetupId) || activeSetups[0]
      : activeSetups[0];

    if (setupToUse) {
      setSelectedSetupId(setupToUse.id);
      setValue('setupId', setupToUse.id);

      const unit = setupToUse.outputUnit || 'bags';
      const bUnit = setupToUse.baseUnit || 'kg';
      const targetUnits = setupToUse.targetUnits || setupToUse.targetBags || 50;
      const uSize = setupToUse.unitSize || setupToUse.bagWeightKg || 20;

      setValue('outputUnit', unit);
      setValue('baseUnit', bUnit);
      setValue('unitsPacked', targetUnits);
      setValue('actualFinishedQuantity', targetUnits * uSize);

      const items = setupToUse.recipeItems.map((item) => ({
        ingredientId: item.ingredientId,
        actualQuantity: item.targetQuantity,
      }));
      setValue('actualItems', items);
    }
  }, [preselectedSetupId, setups]);

  const watchedItems = watch('actualItems') || [];
  const watchedUnits = watch('unitsPacked') || 0;
  const watchedOutputUnit = watch('outputUnit') || 'units';
  const watchedFinishedQty = watch('actualFinishedQuantity') || 0;
  const watchedBaseUnit = watch('baseUnit') || 'kg';

  // Live Cost Preview
  const packagingItem = ingredients.find((i) => i.category === 'packaging');
  const packagingUnitCost = packagingItem ? packagingItem.unitCost : 20;
  const packagingCost = watchedUnits * packagingUnitCost;

  let ingredientCost = 0;
  for (const item of watchedItems) {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    if (ing) {
      ingredientCost += (item.actualQuantity || 0) * ing.unitCost;
    }
  }
  const estimatedBatchCost = ingredientCost + packagingCost;
  const estimatedCostPerUnit = watchedUnits > 0 ? estimatedBatchCost / watchedUnits : 0;
  const estimatedCostPerBaseUnit =
    watchedFinishedQty > 0 ? estimatedBatchCost / watchedFinishedQty : 0;

  const onSubmit = async (data: BatchRunFormData) => {
    try {
      await createBatchMutation.mutateAsync({
        setupId: data.setupId,
        date: data.date,
        actualItems: data.actualItems,
        unitsPacked: data.unitsPacked,
        outputUnit: data.outputUnit,
        actualFinishedQuantity: data.actualFinishedQuantity,
        baseUnit: data.baseUnit,
        packagingUsedUnits: data.unitsPacked,
        measurableWastage: data.measurableWastage,
        // Compatibility aliases
        bagsPacked: data.unitsPacked,
        packagingUsedBags: data.unitsPacked,
        actualFinishedWeightKg: data.actualFinishedQuantity,
        measurableWastageKg: data.measurableWastage,
        notes: data.notes,
      });

      setBannerAlert({
        title: 'Batch Confirmed',
        message: `Successfully produced ${data.unitsPacked} ${data.outputUnit}. Stock ledger and costs updated atomically.`,
        variant: 'success',
      });
      handleClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Production Error',
        message: err.message || 'Failed to confirm batch run',
        variant: 'danger',
      });
    }
  };

  const handleClose = () => {
    setStep(0);
    handleClose();
  };

  const handleNext = async () => {
    if (await trigger(STEP_FIELDS[step])) setStep(step + 1);
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title="Start Batch"
      subtitle={
        selectedSetup
          ? `Setup: ${selectedSetup.name} (v${selectedSetup.version})`
          : activeSetups.length === 0
            ? 'Setup Required'
            : 'Select Setup'
      }
      primaryAction={
        activeSetups.length === 0
          ? undefined
          : isLastStep
            ? {
                label: 'Confirm Batch & Update Stock',
                onPress: handleSubmit(onSubmit),
                loading: createBatchMutation.isPending,
                variant: 'primary',
              }
            : { label: 'Next', onPress: handleNext }
      }
      secondaryAction={
        activeSetups.length === 0
          ? { label: 'Close', onPress: handleClose }
          : step === 0
            ? { label: 'Cancel', onPress: handleClose }
            : { label: 'Back', onPress: () => setStep(step - 1) }
      }
    >
      <Stack gap="md">
        {activeSetups.length === 0 ? (
          <Card variant="accent" padding="normal">
            <Stack gap="md" align="center">
              <Typography variant="title" weight="bold" color="brandDeep" align="center">
                No Recipe Available
              </Typography>
              <Typography variant="bodySmall" color="secondary" align="center">
                You must configure a production setup first to define the product, packaging units,
                and custom recipe formulation.
              </Typography>
              <Button
                label="+ Create Recipe Now"
                variant="primary"
                leftIcon="construct-outline"
                onPress={() => {
                  openSheet('create_setup', {}, { replace: true });
                }}
              />
            </Stack>
          </Card>
        ) : (
          <>
            <StepIndicator steps={STEPS} current={step} />

            {step === 0 && (
              <>
                {/* Setup Selection Pills */}
                <Box>
                  <Typography
                    variant="label"
                    color="secondary"
                    style={{ marginBottom: theme.spacing.xsm }}
                  >
                    Select Active Setup
                  </Typography>
                  <Row gap="xs" wrap>
                    {activeSetups.map((setup) => {
                      const isSelected = setup.id === selectedSetupId;
                      return (
                        <Button
                          key={setup.id}
                          label={`${setup.name} (v${setup.version})`}
                          variant={isSelected ? 'primary' : 'subtle'}
                          size="sm"
                          onPress={() => {
                            setSelectedSetupId(setup.id);
                            setValue('setupId', setup.id);
                            const unit = setup.outputUnit || 'bags';
                            const bUnit = setup.baseUnit || 'kg';
                            const targetUnits = setup.targetUnits || setup.targetBags || 50;
                            const uSize = setup.unitSize || setup.bagWeightKg || 20;

                            setValue('outputUnit', unit);
                            setValue('baseUnit', bUnit);
                            setValue('unitsPacked', targetUnits);
                            setValue('actualFinishedQuantity', targetUnits * uSize);
                            setValue(
                              'actualItems',
                              setup.recipeItems.map((i) => ({
                                ingredientId: i.ingredientId,
                                actualQuantity: i.targetQuantity,
                              })),
                            );
                          }}
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
                      label="Production Date"
                      value={value}
                      onChangeText={onChange}
                      error={errors.date?.message}
                      leftIcon="calendar-outline"
                    />
                  )}
                />
              </>
            )}

            {step === 1 && (
              <>
                {/* Generalized Production Output Unit Configuration */}
                <Box>
                  <Typography
                    variant="label"
                    color="secondary"
                    style={{ marginBottom: theme.spacing.xs }}
                  >
                    Production Packaging / Output Unit
                  </Typography>
                  <Typography
                    variant="caption"
                    color="muted"
                    style={{ marginBottom: theme.spacing.sm }}
                  >
                    Choose a preset or type any custom unit (e.g. bags, bottles, drums, cans,
                    cartons, units)
                  </Typography>
                  <Row gap="xs" wrap style={{ marginBottom: theme.spacing.sm }}>
                    {COMMON_OUTPUT_UNITS.map((u) => (
                      <Button
                        key={u}
                        label={u}
                        variant={watchedOutputUnit.toLowerCase() === u ? 'secondary' : 'subtle'}
                        size="sm"
                        onPress={() => setValue('outputUnit', u)}
                      />
                    ))}
                  </Row>

                  <Controller
                    control={control}
                    name="outputUnit"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label="Production Unit Name (Type any custom unit)"
                        placeholder="e.g. bags, bottles, drums, cans, cartons, pouches, units"
                        value={value}
                        onChangeText={onChange}
                        error={errors.outputUnit?.message}
                        hint="Specify the container or packaged unit produced in this batch"
                      />
                    )}
                  />
                </Box>

                {/* Output Quantities (Generalized for any unit) */}
                <Row gap="md">
                  <Box flex={1}>
                    <Controller
                      control={control}
                      name="unitsPacked"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          label={`Actual ${watchedOutputUnit} Produced`}
                          value={value ? String(value) : ''}
                          onChangeText={(val) => {
                            const num = parseInt(val, 10) || 0;
                            onChange(num);
                            if (selectedSetup) {
                              const uSize =
                                selectedSetup.unitSize || selectedSetup.bagWeightKg || 20;
                              setValue('actualFinishedQuantity', num * uSize);
                            }
                          }}
                          keyboardType="numeric"
                          suffix={watchedOutputUnit}
                          error={errors.unitsPacked?.message}
                        />
                      )}
                    />
                  </Box>

                  <Box flex={1}>
                    <Controller
                      control={control}
                      name="actualFinishedQuantity"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          label={`Finished Total (${watchedBaseUnit})`}
                          value={value ? String(value) : ''}
                          onChangeText={(val) => onChange(parseFloat(val) || 0)}
                          keyboardType="numeric"
                          suffix={watchedBaseUnit}
                          error={errors.actualFinishedQuantity?.message}
                        />
                      )}
                    />
                  </Box>
                </Row>

                {/* Measurable Wastage */}
                <Controller
                  control={control}
                  name="measurableWastage"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      label={`Measurable Loss / Wastage (${watchedBaseUnit})`}
                      value={value ? String(value) : '0'}
                      onChangeText={(val) => onChange(parseFloat(val) || 0)}
                      keyboardType="numeric"
                      suffix={watchedBaseUnit}
                      hint="Recorded for batch loss and yield variance audit"
                    />
                  )}
                />
              </>
            )}

            {step === 2 && (
              <>
                {/* Actual Ingredient Consumption Inputs */}
                <Typography variant="label" color="secondary">
                  Actual Raw Materials Consumed (Edit if differed from standard)
                </Typography>

                {selectedSetup?.recipeItems.map((recipeItem, idx) => {
                  const currentIng = ingredients.find((i) => i.id === recipeItem.ingredientId);
                  return (
                    <Controller
                      key={recipeItem.ingredientId}
                      control={control}
                      name={`actualItems.${idx}.actualQuantity`}
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          label={`${recipeItem.ingredientName} (Target: ${recipeItem.targetQuantity} ${recipeItem.unit})`}
                          value={value !== undefined ? String(value) : ''}
                          onChangeText={(val) => onChange(parseFloat(val) || 0)}
                          keyboardType="numeric"
                          suffix={recipeItem.unit}
                          hint={
                            currentIng
                              ? `Unit cost snapshot: ${symbol}${currentIng.unitCost}/${recipeItem.unit}`
                              : undefined
                          }
                        />
                      )}
                    />
                  );
                })}

                {/* Live Cost Calculation Card */}
                <Card variant="accent" padding="compact">
                  <Typography
                    variant="label"
                    color="brandDeep"
                    style={{ marginBottom: theme.spacing.xs }}
                  >
                    AUTHORITATIVE BATCH COST PREVIEW
                  </Typography>
                  <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
                    <Typography variant="bodySmall" color="secondary">
                      Raw Ingredients Cost:
                    </Typography>
                    <Typography variant="bodySmall" weight="bold" color="primary">
                      {money(ingredientCost)}
                    </Typography>
                  </Row>
                  <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
                    <Typography variant="bodySmall" color="secondary">
                      Packaging Cost ({watchedUnits} {watchedOutputUnit} @{' '}
                      {money(packagingUnitCost)}):
                    </Typography>
                    <Typography variant="bodySmall" weight="bold" color="primary">
                      {money(packagingCost)}
                    </Typography>
                  </Row>
                  <Divider variant="brand" spacing="xxs" />
                  <Row justify="space-between" style={{ marginVertical: theme.spacing.xxs }}>
                    <Typography variant="bodyMedium" weight="bold" color="brandDeep">
                      Total Direct Batch Cost:
                    </Typography>
                    <Typography variant="bodyMedium" weight="bold" color="brandDeep">
                      {money(estimatedBatchCost)}
                    </Typography>
                  </Row>
                  <Row justify="space-between" style={{ marginTop: theme.spacing.xs }}>
                    <Badge
                      label={`${symbol}${estimatedCostPerUnit.toFixed(2)} / ${watchedOutputUnit}`}
                      variant="forest"
                      size="md"
                    />
                    <Badge
                      label={`${symbol}${estimatedCostPerBaseUnit.toFixed(2)} / ${watchedBaseUnit}`}
                      variant="neutral"
                      size="md"
                    />
                  </Row>
                </Card>

                {/* Operational Notes */}
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      label="Batch Notes (Optional)"
                      value={value || ''}
                      onChangeText={onChange}
                      placeholder="e.g. Line speeds, operator shift, moisture readings..."
                      multiline
                    />
                  )}
                />
              </>
            )}
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default StartRunModal;
