import React, { useState } from 'react';
import { useColors } from '../../../theme';
import { openSheet } from '../../../navigation/sheets';
import {
  useProductionBatches,
  useProductionSetups,
  useStartBatchRun,
} from '../../../hooks/api/useProduction';
import { useIngredients, useProducts } from '../../../hooks/api/useInventory';
import {
  formatDuration,
  hoursForOutput,
  outputForHours,
  batchBreakdown,
} from '../../../utils/batchEstimates';
import { BatchBreakdownView } from './BatchBreakdownView';
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
  /** Pre-fill from an earlier batch: same recipe, amounts, hours and output. */
  rerunBatchId?: string | null;
}

/** Start Batch: pick a recipe, set the target, check stock, confirm. Full-page flow from the Stitch Lite design. */
export const StartBatchPage: React.FC<StartBatchPageProps> = ({
  onClose,
  preselectedSetupId,
  rerunBatchId,
}) => {
  const colors = useColors();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const { data: products = [] } = useProducts();
  const { data: batches = [] } = useProductionBatches();
  const startRun = useStartBatchRun();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const activeSetups = setups.filter((s) => s.status === 'active');
  const [setupId, setSetupId] = useState(preselectedSetupId ?? '');
  const [picking, setPicking] = useState(false);
  const setup = activeSetups.find((s) => s.id === setupId) ?? activeSetups[0] ?? null;

  const expectedUnits = setup ? setup.targetUnits || setup.targetBags || 0 : 0;
  const [loads, setLoads] = useState(1);
  const [adjusting, setAdjusting] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const scale = loads;
  // The page opening is the closest thing to "now" that stays stable between renders.
  const [openedAt] = useState(() => Date.now());

  // Run time and output: give either one and the other follows from the recipe's rate.
  const rate = setup?.outputPerHour ?? 0;
  const [hoursText, setHoursText] = useState<string | null>(null);
  const [outText, setOutText] = useState<string | null>(null);
  // Run again: copy the earlier batch's recipe, amounts, hours and output once (state set during render).
  const rerun = rerunBatchId ? batches.find((b) => b.id === rerunBatchId) : undefined;
  const [seededRerun, setSeededRerun] = useState<string | null>(null);
  if (rerun && seededRerun !== rerun.id) {
    setSeededRerun(rerun.id);
    setSetupId(rerun.setupId);
    setOverrides(
      Object.fromEntries(
        rerun.itemsConsumed.map((i) => [i.ingredientId, String(i.actualQuantity)]),
      ),
    );
    setAdjusting(true);
    const out = rerun.status === 'confirmed' ? rerun.unitsPacked : rerun.expectedUnits;
    if (out) setOutText(String(out));
    const hours = rerun.durationMinutes
      ? Math.round((rerun.durationMinutes / 60) * 100) / 100
      : rerun.plannedHours;
    if (hours && !out) setHoursText(String(hours));
  }
  const rerunRecipe = rerun ? setups.find((x) => x.id === rerun.setupId) : undefined;
  const rerunBlocked = !!rerun && rerunRecipe?.status !== 'active';
  const outUnit = setup?.outputUnit || 'packs';
  const usual = expectedUnits * loads;
  const expected =
    outText !== null
      ? Number(outText) || 0
      : hoursText !== null && rate > 0
        ? outputForHours(rate, Number(hoursText) || 0)
        : usual;
  const plannedHours =
    hoursText !== null ? Number(hoursText) || 0 : rate > 0 ? hoursForOutput(rate, expected) : 0;
  const finishAt =
    plannedHours > 0
      ? new Date(openedAt + plannedHours * 3600000).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

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
  const packagingEstimate = packaging ? expected * packaging.unitCost : 0;
  const product = products.find((p) => p.id === setup?.productId);
  const price = product?.sellingPricePerUnit ?? product?.sellingPricePerBag ?? 0;
  const breakdown = batchBreakdown({
    lines: rows.map((r) => ({
      name: r.ri.ingredientName,
      quantity: r.required,
      unit: r.ri.unit,
      rate: r.ing?.unitCost ?? 0,
    })),
    packagingCost: packagingEstimate,
    units: expected,
    packSize: setup ? setup.unitSize || setup.bagWeightKg || 0 : 0,
    price,
  });

  const pickSetup = (id: string) => {
    setSetupId(id);
    setLoads(1);
    setHoursText(null);
    setOutText(null);
    setOverrides({});
    setPicking(false);
    setError('');
  };

  const submit = async () => {
    if (!setup) return setError('Choose a recipe');
    if (short.length > 0) return setError('Some items are short. Add stock or lower the amounts.');
    try {
      await startRun.mutateAsync({
        setupId: setup.id,
        date: new Date().toISOString().split('T')[0],
        actualItems: rows.map((r) => ({
          ingredientId: r.ri.ingredientId,
          actualQuantity: r.required,
        })),
        plannedHours: plannedHours || undefined,
        expectedUnits: expected || undefined,
        notes: notes.trim(),
      });
      setBannerAlert({
        title: 'Batch running',
        message: `${setup.name} is in the mixer. Complete it from Batches once you know the output.`,
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
        description="Load the mixer now. You enter the output when it finishes."
        chip="Production"
      />

      {rerun && !rerunBlocked && (
        <Card tone="info" padding="compact">
          <Typography variant="bodySmall" color="secondary">
            Same as {rerun.batchNumber}: recipe, amounts, hours and output are copied. Change
            anything before you start.
          </Typography>
        </Card>
      )}
      {rerunBlocked && (
        <Card tone="warning" padding="compact">
          <Typography variant="bodySmall" color="secondary">
            The recipe for {rerun?.batchNumber} is paused or archived, so it cannot be run again.
            Activate it on the Recipes tab, or pick another recipe below.
          </Typography>
        </Card>
      )}

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
          <FlowSection label="Mixer loads" hint="Amounts below are for one mix">
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
            label="Run time"
            hint={rate > 0 ? `Recipe speed: ${rate} ${outUnit}/hour` : 'Optional'}
          >
            <Row gap="sm">
              <Box flex={1}>
                <TextInput
                  label="Hours it will run"
                  value={hoursText ?? (plannedHours ? String(plannedHours) : '')}
                  onChangeText={(t) => {
                    setHoursText(t);
                    setOutText(null);
                  }}
                  keyboardType="numeric"
                  suffix="h"
                />
              </Box>
              <Box flex={1}>
                <TextInput
                  label={`Expected ${outUnit}`}
                  value={outText ?? (expected ? String(expected) : '')}
                  onChangeText={(t) => {
                    setOutText(t);
                    setHoursText(null);
                  }}
                  keyboardType="numeric"
                />
              </Box>
            </Row>
            {rate > 0 ? (
              <Typography variant="bodySmall" color="secondary">
                Change either box and the other updates from {rate} {outUnit} per hour.
                {finishAt ? ` Ready about ${finishAt} (${formatDuration(plannedHours * 60)}).` : ''}
              </Typography>
            ) : (
              <Typography variant="bodySmall" color="secondary">
                No speed saved for this recipe yet. Complete a batch and BatchIQ will learn it, or
                set it in the recipe.
              </Typography>
            )}
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

          <FlowSection label="Estimate for this batch" hint="Based on the expected output">
            <BatchBreakdownView
              breakdown={breakdown}
              outputUnit={outUnit}
              baseUnit={setup?.baseUnit || 'kg'}
              price={price}
              estimate
              onAddPrice={() => openSheet('set_price', { productId: setup?.productId })}
            />
          </FlowSection>

          <FlowSection label="Notes" hint="Optional">
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
          disabled={!setup || short.length > 0}
          loading={startRun.isPending}
          onPress={submit}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </Stack>
    </FlowPage>
  );
};

export default StartBatchPage;
