import React, { useState } from 'react';
import { useColors } from '../../../theme';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import { openSheet } from '../../../navigation/sheets';
import { useProductionSetups, useCreateProductionBatch } from '../../../hooks/api/useProduction';
import { useIngredients } from '../../../hooks/api/useInventory';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  ProgressBar,
  QuantityStepper,
  Row,
  SelectedCard,
  Stack,
  TextInput,
  Typography,
} from '../../../components';

export interface StartBatchPageProps {
  onClose: () => void;
  preselectedSetupId?: string | null;
}

/** Start Batch: pick a recipe, set the target, check stock, confirm. Full-page flow from the Stitch Lite design. */
export const StartBatchPage: React.FC<StartBatchPageProps> = ({ onClose, preselectedSetupId }) => {
  const colors = useColors();
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const createBatch = useCreateProductionBatch();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const activeSetups = setups.filter((s) => s.status === 'active');
  const [setupId, setSetupId] = useState(preselectedSetupId ?? '');
  const [picking, setPicking] = useState(false);
  const setup = activeSetups.find((s) => s.id === setupId) ?? activeSetups[0] ?? null;

  const { data: settings } = useFactorySettings();
  // A recipe may not know its output yet (0 = not set); then it is entered after mixing.
  const expectedUnits = setup ? setup.targetUnits || setup.targetBags || 0 : 0;
  const [loads, setLoads] = useState(1);
  const [units, setUnits] = useState<number | null>(null);
  const [sizeInput, setSizeInput] = useState<string | null>(null);
  const [unitInput, setUnitInput] = useState<string | null>(null);
  const unitSize =
    sizeInput !== null
      ? Number(sizeInput) || 0
      : setup
        ? setup.unitSize || setup.bagWeightKg || settings?.defaultUnitSize || 0
        : 0;
  const outputUnit = unitInput ?? (setup?.outputUnit || settings?.defaultUnitName || 'units');
  const baseUnit = setup?.baseUnit || settings?.defaultBaseUnit || 'kg';
  const [adjusting, setAdjusting] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [wastage, setWastage] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const target = units ?? expectedUnits * loads;
  const scale = loads;

  const rows = (setup?.recipeItems ?? []).map((ri) => {
    const ing = ingredients.find((i) => i.id === ri.ingredientId);
    const scaled = Math.round(ri.targetQuantity * scale * 100) / 100;
    const override = overrides[ri.ingredientId];
    const required = override !== undefined && override !== '' ? Number(override) || 0 : scaled;
    const available = ing?.currentStock ?? 0;
    return { ri, ing, required, available, ok: available >= required };
  });

  const short = rows.filter((r) => !r.ok);

  const packaging = ingredients.find((i) => i.category === 'packaging');
  const packagingCost = packaging ? target * packaging.unitCost : 0;
  const ingredientCost = rows.reduce((sum, r) => sum + r.required * (r.ing?.unitCost ?? 0), 0);
  const totalCost = ingredientCost + packagingCost;
  const finished = target * unitSize;

  const pickSetup = (id: string) => {
    setSetupId(id);
    setUnits(null);
    setLoads(1);
    setSizeInput(null);
    setUnitInput(null);
    setOverrides({});
    setPicking(false);
    setError('');
  };

  const submit = async () => {
    if (!setup) return setError('Choose a recipe');
    if (!(target > 0)) return setError('Enter how much it made, once you know the output');
    try {
      const wasteQty = Number(wastage) || 0;
      await createBatch.mutateAsync({
        setupId: setup.id,
        date: new Date().toISOString().split('T')[0],
        actualItems: rows.map((r) => ({
          ingredientId: r.ri.ingredientId,
          actualQuantity: r.required,
        })),
        unitsPacked: target,
        outputUnit,
        actualFinishedQuantity: finished,
        baseUnit,
        packagingUsedUnits: target,
        measurableWastage: wasteQty,
        bagsPacked: target,
        packagingUsedBags: target,
        actualFinishedWeightKg: finished,
        measurableWastageKg: wasteQty,
        notes: notes.trim(),
      });
      setBannerAlert({
        title: 'Batch started',
        message: `${target} ${outputUnit} of ${setup.name} recorded. Stock and costs updated.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not start this batch');
    }
  };

  if (activeSetups.length === 0) {
    return (
      <FlowPage title="Start Batch" onClose={onClose}>
        <Card padding="normal">
          <Stack gap="md" align="center">
            <Typography variant="title" align="center">
              No recipe yet
            </Typography>
            <Typography variant="bodySmall" color="secondary" align="center">
              Create a recipe first so BatchIQ knows what goes into each batch.
            </Typography>
            <Button
              label="Create recipe"
              leftIcon="construct-outline"
              onPress={() => openSheet('create_setup', {}, { replace: true })}
            />
          </Stack>
        </Card>
      </FlowPage>
    );
  }

  return (
    <FlowPage title="Start Batch" onClose={onClose}>
      <FlowHeaderCard
        icon="flask-outline"
        title="Start New Batch Run"
        description="Pick a recipe, set the target and confirm stock"
        chip="Production"
      />

      <FlowSection
        label="Recipe"
        action={
          setup
            ? {
                label: picking ? 'Done' : 'Change',
                icon: 'swap-horizontal',
                onPress: () => setPicking((v) => !v),
              }
            : undefined
        }
      >
        {setup && (
          <SelectedCard
            icon="flask-outline"
            title={setup.name}
            subtitle={`v${setup.version} · ${setup.recipeItems.length} items${expectedUnits ? ` · usually ${expectedUnits} ${setup.outputUnit}` : ''}`}
          />
        )}
        {picking && (
          <ChipPicker
            options={activeSetups.map((s) => ({ value: s.id, label: s.name }))}
            selected={setup?.id ?? ''}
            onSelect={(v) => pickSetup(String(v))}
          />
        )}
      </FlowSection>

      {setup && (
        <>
          <FlowSection label="Mixer loads" hint="Quantities below are for one mix">
            <QuantityStepper
              value={loads}
              onChange={(v) => {
                setLoads(v);
                setOverrides({});
              }}
              unit={loads === 1 ? 'mix' : 'mixes'}
              min={1}
            />
          </FlowSection>

          <FlowSection
            label="Stock availability"
            action={{
              label: adjusting ? 'Use recipe amounts' : 'Edit amounts used',
              icon: 'create-outline',
              onPress: () => {
                setAdjusting((v) => !v);
                setOverrides({});
              },
            }}
          >
            <Row justify="space-between" align="center">
              <Typography variant="bodySmall" color={short.length ? 'error' : 'success'}>
                {short.length
                  ? `${short.length} short. Add stock or lower the target.`
                  : 'Everything needed is in stock.'}
              </Typography>
              <Badge
                label={`${rows.length - short.length}/${rows.length} ready`}
                variant={short.length ? 'danger' : 'success'}
                size="sm"
              />
            </Row>
            <Stack gap="sm">
              {rows.map((r) => (
                <Box key={r.ri.ingredientId}>
                  <Row justify="space-between" align="center">
                    <Typography variant="bodyMedium">{r.ri.ingredientName}</Typography>
                    <Badge
                      label={
                        r.ok
                          ? r.available - r.required <= (r.ing?.minThreshold ?? 0)
                            ? 'Just enough'
                            : 'Ready'
                          : `Short ${(r.required - r.available).toLocaleString('en-IN')}`
                      }
                      variant={r.ok ? 'success' : 'danger'}
                      size="sm"
                    />
                  </Row>
                  <ProgressBar
                    value={r.available > 0 ? r.required / r.available : 1}
                    color={r.ok ? colors.brand.primary : colors.accent.error}
                    height={6}
                  />
                  <Row justify="space-between">
                    <Typography variant="caption" color="muted">
                      Needs {r.required.toLocaleString('en-IN')} {r.ri.unit}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Have {r.available.toLocaleString('en-IN')} {r.ri.unit}
                    </Typography>
                  </Row>
                  {adjusting && (
                    <TextInput
                      label={`Actual ${r.ri.ingredientName} used`}
                      value={overrides[r.ri.ingredientId] ?? String(r.required)}
                      onChangeText={(val) =>
                        setOverrides((o) => ({
                          ...o,
                          [r.ri.ingredientId]: val,
                        }))
                      }
                      keyboardType="numeric"
                      suffix={r.ri.unit}
                    />
                  )}
                </Box>
              ))}
            </Stack>
          </FlowSection>

          <FlowSection
            label="What did it make?"
            hint={target > 0 ? undefined : 'Fill this in when you know the output'}
          >
            <QuantityStepper
              value={target}
              onChange={(v) => {
                setUnits(v);
                setError('');
              }}
              unit={outputUnit}
              step={target >= 100 ? 10 : 1}
            />
            <Row gap="sm">
              <Box flex={1}>
                <TextInput
                  label="Pack size"
                  value={sizeInput ?? (unitSize ? String(unitSize) : '')}
                  onChangeText={setSizeInput}
                  keyboardType="numeric"
                  suffix={baseUnit}
                />
              </Box>
              <Box flex={1}>
                <TextInput label="Packed as" value={outputUnit} onChangeText={setUnitInput} />
              </Box>
            </Row>
            {target > 0 && unitSize > 0 && (
              <Typography variant="bodySmall" color="secondary">
                {finished.toLocaleString('en-IN')} {baseUnit} in total
              </Typography>
            )}
          </FlowSection>

          <FlowSection label="Cost preview">
            <Row justify="space-between">
              <Typography variant="bodySmall" color="secondary">
                Materials
              </Typography>
              <Typography variant="dataMedium" tabular>
                {money(ingredientCost)}
              </Typography>
            </Row>
            {packaging && (
              <Row justify="space-between">
                <Typography variant="bodySmall" color="secondary">
                  Packaging ({target} × {money(packaging.unitCost)})
                </Typography>
                <Typography variant="dataMedium" tabular>
                  {money(packagingCost)}
                </Typography>
              </Row>
            )}
            <Row justify="space-between" align="center">
              <Typography variant="title">Total batch cost</Typography>
              <Typography variant="dataLarge" tabular>
                {money(totalCost)}
              </Typography>
            </Row>
            <Badge
              label={`${symbol}${(target > 0 ? totalCost / target : 0).toFixed(2)} / ${outputUnit}`}
              variant="neutral"
              size="sm"
            />
          </FlowSection>

          <FlowSection label="Notes & loss" hint="Optional">
            <TextInput
              label={`Wastage (${baseUnit})`}
              value={wastage}
              onChangeText={setWastage}
              keyboardType="numeric"
              suffix={baseUnit}
            />
            <TextInput
              label="Batch notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. shift, operator, line speed"
              multiline
            />
          </FlowSection>
        </>
      )}

      {error ? (
        <Typography variant="bodySmall" color="error">
          {error}
        </Typography>
      ) : null}

      <Stack gap="xs">
        <Button
          label="Start Batch Run"
          size="lg"
          leftIcon="play-circle-outline"
          fullWidth
          disabled={!setup}
          loading={createBatch.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default StartBatchPage;
