import React, { useState } from 'react';
import { useMoney, useCurrencySymbol } from '../../../hooks/useMoney';
import {
  useCreateProductionSetup,
  useProductionSetups,
  useUpdateProductionSetup,
} from '../../../hooks/api/useProduction';
import { useIngredients, useProducts } from '../../../hooks/api/useInventory';
import { useFactorySettings } from '../../../hooks/api/useDashboard';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Badge,
  Box,
  Button,
  Card,
  ChipPicker,
  EmptyState,
  FlowHeaderCard,
  FlowPage,
  FlowSection,
  Row,
  Stack,
  StepIndicator,
  TextInput,
  Typography,
} from '../../../components';
import { CreateIngredientModal } from '../../inventory/components/CreateIngredientModal';

export interface RecipePageProps {
  onClose: () => void;
  /** Present when editing an existing recipe. */
  setupId?: string | null;
}

interface Line {
  ingredientId: string;
  quantity: string;
}

const STEPS = ['Basics', 'Output', 'Ingredients', 'Review'];
const OUTPUT_UNITS = ['bags', 'bottles', 'drums', 'cans', 'cartons', 'boxes', 'pouches', 'units'];
const BASE_UNITS = ['kg', 'L', 'g', 'ml', 'tons', 'pcs'];

/** Recipe builder: what you make, how much per batch, and which stock items go into it. */
export const RecipePage: React.FC<RecipePageProps> = ({ onClose, setupId }) => {
  const money = useMoney();
  const symbol = useCurrencySymbol();
  const { data: setups = [] } = useProductionSetups();
  const { data: ingredients = [] } = useIngredients();
  const { data: products = [] } = useProducts();
  const { data: settings } = useFactorySettings();
  const create = useCreateProductionSetup();
  const update = useUpdateProductionSetup();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);

  const existing = setupId ? setups.find((s) => s.id === setupId) : undefined;
  const [seededFor, setSeededFor] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [productName, setProductName] = useState('');
  const [notes, setNotes] = useState('');
  const [outputUnit, setOutputUnit] = useState(settings?.defaultUnitName ?? 'bags');
  const [baseUnit, setBaseUnit] = useState(settings?.defaultBaseUnit ?? 'kg');
  const [unitSize, setUnitSize] = useState(
    settings?.defaultUnitSize ? String(settings.defaultUnitSize) : '',
  );
  const [targetUnits, setTargetUnits] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [adding, setAdding] = useState(true);
  const [newMaterial, setNewMaterial] = useState(false);
  const [error, setError] = useState('');

  // Seed the form once when editing (state adjusted during render, not in an effect).
  if (existing && seededFor !== existing.id) {
    setSeededFor(existing.id);
    setName(existing.name);
    setProductName(existing.productName);
    setNotes(existing.notes ?? '');
    setOutputUnit(existing.outputUnit || 'bags');
    setBaseUnit(existing.baseUnit || 'kg');
    setUnitSize(String(existing.unitSize || existing.bagWeightKg || ''));
    setTargetUnits(String(existing.targetUnits || existing.targetBags || ''));
    setLines(
      existing.recipeItems.map((i) => ({
        ingredientId: i.ingredientId,
        quantity: String(i.targetQuantity),
      })),
    );
  }

  const usable = ingredients.filter((i) => i.isActive !== false);
  const view = lines.map((l) => {
    const ing = ingredients.find((i) => i.id === l.ingredientId);
    const qty = Number(l.quantity) || 0;
    return { line: l, ing, qty, cost: qty * (ing?.unitCost ?? 0) };
  });
  const batchCost = view.reduce((sum, v) => sum + v.cost, 0);
  const units = Number(targetUnits) || 0;
  const size = Number(unitSize) || 0;

  const setQty = (id: string, quantity: string) =>
    setLines((prev) => prev.map((l) => (l.ingredientId === id ? { ...l, quantity } : l)));

  const validate = (forStep: number): string => {
    if (forStep === 0) {
      if (name.trim().length < 2) return 'Give the recipe a name';
      if (productName.trim().length < 2) return 'Say what product this makes';
    }
    if (forStep === 1) {
      if (!outputUnit.trim()) return 'Choose how it is packed';
      if (!(units > 0)) return 'Enter how many you make per batch';
      if (!(size > 0)) return 'Enter the size of one pack';
    }
    if (forStep === 2) {
      if (lines.length === 0) return 'Add at least one item from stock';
      if (view.some((v) => !(v.qty > 0))) return 'Every item needs a quantity above 0';
    }
    return '';
  };

  const next = () => {
    const problem = validate(step);
    if (problem) return setError(problem);
    setError('');
    setStep(step + 1);
  };

  const save = async () => {
    const problem = [0, 1, 2].map(validate).find(Boolean);
    if (problem) return setError(problem);
    const match = products.find((p) => p.name.toLowerCase() === productName.trim().toLowerCase());
    const input = {
      name: name.trim(),
      productId: match?.id,
      productName: productName.trim(),
      outputUnit: outputUnit.trim(),
      unitSize: size,
      baseUnit: baseUnit.trim(),
      targetUnits: units,
      recipeItems: view.map((v) => ({
        ingredientId: v.line.ingredientId,
        ingredientName: v.ing?.name,
        targetQuantity: v.qty,
        unit: v.ing?.unit,
        unitCost: v.ing?.unitCost,
      })),
      notes: notes.trim(),
    };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, input });
      else await create.mutateAsync(input);
      setBannerAlert({
        title: existing ? 'Recipe updated' : 'Recipe saved',
        message: existing
          ? `${input.name} is now v${existing.version + 1}. Past batches keep their old version.`
          : `${input.name} is ready. You can start a batch from it.`,
        variant: 'success',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not save this recipe');
    }
  };

  const last = step === STEPS.length - 1;

  return (
    <FlowPage title={existing ? 'Edit Recipe' : 'New Recipe'} onClose={onClose}>
      <FlowHeaderCard
        icon="flask-outline"
        title={existing ? `Edit ${existing.name}` : 'Create Recipe'}
        description="A recipe is the mix of your stock items that makes one batch"
        chip={`Step ${step + 1} of ${STEPS.length}`}
      />
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <>
          <FlowSection label="Recipe name">
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Cattle feed standard mix"
            />
          </FlowSection>
          <FlowSection label="Product it makes">
            <TextInput
              label="Product"
              value={productName}
              onChangeText={setProductName}
              placeholder="e.g. High-yield feed 20kg"
            />
            {products.length > 0 && (
              <ChipPicker
                options={products.map((p) => ({ value: p.name, label: p.name }))}
                selected={productName}
                onSelect={(v) => {
                  const p = products.find((x) => x.name === v);
                  setProductName(String(v));
                  if (p) {
                    setOutputUnit(p.outputUnit || outputUnit);
                    setBaseUnit(p.baseUnit || baseUnit);
                    if (p.unitSize) setUnitSize(String(p.unitSize));
                  }
                }}
              />
            )}
          </FlowSection>
          <FlowSection label="Instructions" hint="Optional">
            <TextInput
              label="Mixing notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. mix dry items first, then molasses"
              multiline
            />
          </FlowSection>
        </>
      )}

      {step === 1 && (
        <>
          <FlowSection label="Packed as">
            <ChipPicker
              options={OUTPUT_UNITS.map((u) => ({ value: u, label: u }))}
              selected={outputUnit}
              onSelect={(v) => setOutputUnit(String(v))}
            />
            <TextInput label="Or type your own" value={outputUnit} onChangeText={setOutputUnit} />
          </FlowSection>
          <FlowSection label="Size of one pack">
            <Row gap="sm">
              <Box flex={1}>
                <TextInput
                  label="Size"
                  value={unitSize}
                  onChangeText={setUnitSize}
                  keyboardType="numeric"
                />
              </Box>
              <Box flex={1}>
                <TextInput label="Measured in" value={baseUnit} onChangeText={setBaseUnit} />
              </Box>
            </Row>
            <ChipPicker
              options={BASE_UNITS.map((u) => ({ value: u, label: u }))}
              selected={baseUnit}
              onSelect={(v) => setBaseUnit(String(v))}
            />
          </FlowSection>
          <FlowSection label="Standard batch">
            <TextInput
              label={`${outputUnit || 'Packs'} per batch`}
              value={targetUnits}
              onChangeText={setTargetUnits}
              keyboardType="numeric"
              suffix={outputUnit}
            />
            {units > 0 && size > 0 && (
              <Typography variant="bodySmall" color="secondary">
                One batch makes {(units * size).toLocaleString('en-IN')} {baseUnit}
              </Typography>
            )}
          </FlowSection>
        </>
      )}

      {step === 2 && (
        <>
          <FlowSection
            label="Items in this recipe"
            hint={`For one batch of ${units || '…'} ${outputUnit}`}
            action={{
              label: adding ? 'Done' : 'Add from stock',
              icon: 'add',
              onPress: () => setAdding((v) => !v),
            }}
          >
            {view.length === 0 && (
              <EmptyState
                title="No items yet"
                description="Pick every material that goes into the mixer from your stock below."
              />
            )}
            <Stack gap="sm">
              {view.map((v) => (
                <Card key={v.line.ingredientId} tone="info" padding="compact">
                  <Row justify="space-between" align="center" gap="sm">
                    <Box flex={1}>
                      <Typography variant="title" numberOfLines={1}>
                        {v.ing?.name ?? 'Removed item'}
                      </Typography>
                      <Typography variant="caption" color="muted">
                        {symbol}
                        {v.ing?.unitCost ?? 0}/{v.ing?.unit} · {money(v.cost)}
                      </Typography>
                    </Box>
                    <Box style={{ width: 110 }}>
                      <TextInput
                        label={`Qty (${v.ing?.unit ?? ''})`}
                        value={v.line.quantity}
                        onChangeText={(t) => setQty(v.line.ingredientId, t)}
                        keyboardType="numeric"
                      />
                    </Box>
                    <Button
                      label="Remove"
                      variant="ghost"
                      size="sm"
                      leftIcon="close"
                      onPress={() =>
                        setLines((prev) =>
                          prev.filter((l) => l.ingredientId !== v.line.ingredientId),
                        )
                      }
                    />
                  </Row>
                </Card>
              ))}
            </Stack>
            {adding && (
              <>
                <Typography variant="label" color="muted">
                  Tap each item to add it. Add as many as the mixer uses.
                </Typography>
                <ChipPicker
                  options={usable
                    .filter((i) => !lines.some((l) => l.ingredientId === i.id))
                    .map((i) => ({
                      value: i.id,
                      label: `${i.name} (${i.currentStock} ${i.unit})`,
                    }))}
                  selected=""
                  onSelect={(v) => {
                    setLines((prev) => [...prev, { ingredientId: String(v), quantity: '' }]);
                    setError('');
                  }}
                />
                <Button
                  label="Item not in stock? Add a new material"
                  variant="ghost"
                  size="sm"
                  leftIcon="add-circle-outline"
                  onPress={() => setNewMaterial(true)}
                />
              </>
            )}
          </FlowSection>
          <Typography variant="bodySmall" color="secondary">
            Batch cost so far: {money(batchCost)}
          </Typography>
        </>
      )}

      {step === 3 && (
        <>
          <FlowSection label="Summary">
            <Typography variant="title">{name}</Typography>
            <Typography variant="bodySmall" color="secondary">
              Makes {productName} · {units} {outputUnit} of {size} {baseUnit} per batch
            </Typography>
            <Stack gap="xs">
              {view.map((v) => (
                <Row key={v.line.ingredientId} justify="space-between">
                  <Typography variant="bodyMedium">{v.ing?.name}</Typography>
                  <Typography variant="dataMedium" tabular>
                    {v.qty} {v.ing?.unit}
                  </Typography>
                </Row>
              ))}
            </Stack>
          </FlowSection>
          <FlowSection label="Standard cost">
            <Row justify="space-between" align="center">
              <Typography variant="title">Per batch</Typography>
              <Typography variant="dataLarge" tabular>
                {money(batchCost)}
              </Typography>
            </Row>
            {units > 0 && (
              <Badge
                label={`${money(batchCost / units)} / ${outputUnit}`}
                variant="neutral"
                size="sm"
              />
            )}
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
          label={last ? (existing ? 'Save Changes' : 'Save Recipe') : 'Next'}
          size="lg"
          fullWidth
          loading={create.isPending || update.isPending}
          onPress={last ? save : next}
        />
        <Button
          label={step === 0 ? 'Cancel' : 'Back'}
          variant="ghost"
          fullWidth
          onPress={step === 0 ? onClose : () => setStep(step - 1)}
        />
      </Stack>

      <CreateIngredientModal
        visible={newMaterial}
        onClose={() => setNewMaterial(false)}
        onCreated={(created) => {
          setLines((prev) => [...prev, { ingredientId: created.id, quantity: '' }]);
          setNewMaterial(false);
        }}
      />
    </FlowPage>
  );
};

export default RecipePage;
