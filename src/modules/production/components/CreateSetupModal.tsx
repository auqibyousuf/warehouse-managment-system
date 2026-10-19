import { theme } from '../../../theme';
import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { setupSchema, SetupFormData, SetupFormInput } from '../../../validation/schemas';
import { useCreateProductionSetup } from '../../../hooks/api/useProduction';
import { useProducts, useIngredients } from '../../../hooks/api/useInventory';
import { useAppStore } from '../../../stores/useAppStore';
import {
  Modal,
  Box,
  Stack,
  Row,
  Typography,
  TextInput,
  Button,
  Card,
  Divider,
} from '../../../components';
import { CreateIngredientModal } from '../../inventory/components/CreateIngredientModal';

export interface CreateSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

const COMMON_OUTPUT_UNITS = [
  'units',
  'bottles',
  'drums',
  'cans',
  'cartons',
  'boxes',
  'bags',
  'pouches',
  'tins',
];

const COMMON_BASE_UNITS = ['kg', 'L', 'g', 'ml', 'tons', 'pcs'];

export const CreateSetupModal: React.FC<CreateSetupModalProps> = ({ visible, onClose }) => {
  const { data: products = [] } = useProducts();
  const { data: ingredients = [] } = useIngredients();
  const createSetupMutation = useCreateProductionSetup();
  const setBannerAlert = useAppStore((s) => s.setBannerAlert);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);


  const initialProd = products[0];

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SetupFormInput, unknown, SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      name: '',
      productName: initialProd?.name || '',
      productId: initialProd?.id || '',
      outputUnit: initialProd?.outputUnit || 'units',
      targetUnits: 50,
      unitSize: initialProd?.unitSize || 20,
      baseUnit: initialProd?.baseUnit || 'kg',
      recipeItems: [
        {
          ingredientName: ingredients[0]?.name || 'Raw Material 1',
          targetQuantity: 100,
          unit: ingredients[0]?.unit || 'kg',
          unitCost: ingredients[0]?.unitCost || 20,
        },
        {
          ingredientName: ingredients[1]?.name || 'Raw Material 2',
          targetQuantity: 50,
          unit: ingredients[1]?.unit || 'kg',
          unitCost: ingredients[1]?.unitCost || 30,
        },
      ],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'recipeItems',
  });

  const watchedProductName = watch('productName');
  const watchedOutputUnit = watch('outputUnit') || 'units';
  const watchedUnitSize = watch('unitSize') || 0;
  const watchedBaseUnit = watch('baseUnit') || 'kg';
  const watchedTargetUnits = watch('targetUnits') || 0;
  const watchedRecipeItems = watch('recipeItems') || [];

  // Live Recipe Formulation Metrics
  const totalInputQty = watchedRecipeItems.reduce(
    (sum, item) => sum + (Number(item?.targetQuantity) || 0),
    0
  );
  const targetOutputQty = watchedTargetUnits * watchedUnitSize;
  const estimatedIngredientCost = watchedRecipeItems.reduce(
    (sum, item) =>
      sum + (Number(item?.targetQuantity) || 0) * (Number(item?.unitCost) || 0),
    0
  );

  const onSubmit = async (data: SetupFormData) => {
    try {
      await createSetupMutation.mutateAsync({
        name: data.name,
        productId: data.productId,
        productName: data.productName,
        outputUnit: data.outputUnit,
        targetUnits: data.targetUnits,
        unitSize: data.unitSize,
        baseUnit: data.baseUnit,
        recipeItems: data.recipeItems.map((item) => ({
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          targetQuantity: Number(item.targetQuantity),
          unit: item.unit || data.baseUnit,
          unitCost: Number(item.unitCost) || 0,
        })),
        notes: data.notes,
      });

      setBannerAlert({
        title: 'Recipe Created',
        message: `Recipe "${data.name}" configured for ${data.targetUnits} ${data.outputUnit} (${data.unitSize} ${data.baseUnit} each) with ${data.recipeItems.length} custom ingredients.`,
        variant: 'success',
      });
      reset();
      onClose();
    } catch (err: any) {
      setBannerAlert({
        title: 'Recipe Error',
        message: err.message || 'Failed to create recipe',
        variant: 'danger',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Recipe"
      subtitle="Define ingredients, quantities & output units"
      primaryAction={{
        label: 'Save & Activate Recipe',
        onPress: handleSubmit(onSubmit),
        loading: createSetupMutation.isPending,
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
      }}
    >
      <Stack gap="md">
        {/* Setup Name */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Recipe Name"
              placeholder="e.g. Daily Standard Mix, Batch 500L, Pack Line 1"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        {/* Product Manufactured */}
        <Box>
          <Controller
            control={control}
            name="productName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Product Manufactured"
                placeholder="Type product name (e.g. Fresh Milk 1L, High-Protein Cattle Feed, Engine Oil 5L)"
                value={value}
                onChangeText={(val) => {
                  onChange(val);
                  setValue('productId', ''); // clear id if custom name typed
                }}
                error={errors.productName?.message}
                hint="Type any custom product name or pick an existing product below"
              />
            )}
          />

          {products.length > 0 && (
            <Box marginTop="xs">
              <Typography variant="caption" color="muted" style={{ marginBottom: theme.spacing.xs }}>
                Or pick an existing product template:
              </Typography>
              <Row gap="xs" wrap>
                {products.map((prod) => {
                  const isSelected =
                    watchedProductName?.toLowerCase() === prod.name.toLowerCase();
                  return (
                    <Button
                      key={prod.id}
                      label={prod.name}
                      variant={isSelected ? 'secondary' : 'subtle'}
                      size="sm"
                      onPress={() => {
                        setValue('productId', prod.id);
                        setValue('productName', prod.name);
                        if (prod.outputUnit) setValue('outputUnit', prod.outputUnit);
                        if (prod.unitSize) setValue('unitSize', prod.unitSize);
                        if (prod.baseUnit) setValue('baseUnit', prod.baseUnit);
                      }}
                    />
                  );
                })}
              </Row>
            </Box>
          )}
        </Box>

        <Divider variant="subtle" spacing="xs" />

        {/* Production Packaging / Output Unit Configuration */}
        <Box>
          <Typography variant="label" color="secondary" style={{ marginBottom: theme.spacing.xs }}>
            Production Packaging / Output Unit
          </Typography>
          <Typography variant="caption" color="muted" style={{ marginBottom: theme.spacing.sm }}>
            Choose a preset or type any custom unit (e.g. bottles, drums, cans, cartons, boxes, bags, units)
          </Typography>

          <Row gap="xs" wrap style={{ marginBottom: theme.spacing.sm }}>
            {COMMON_OUTPUT_UNITS.map((unit) => {
              const isSelected = watchedOutputUnit.toLowerCase() === unit;
              return (
                <Button
                  key={unit}
                  label={unit}
                  variant={isSelected ? 'secondary' : 'subtle'}
                  size="sm"
                  onPress={() => setValue('outputUnit', unit)}
                />
              );
            })}
          </Row>

          <Controller
            control={control}
            name="outputUnit"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Production Unit Name (Type any custom unit)"
                placeholder="e.g. bottles, drums, cans, cartons, boxes, bags, units"
                value={value}
                onChangeText={onChange}
                error={errors.outputUnit?.message}
                hint="Define what packaging container or unit is outputted by this recipe"
              />
            )}
          />
        </Box>

        {/* Package Unit Size & Base Measurement */}
        <Row gap="md">
          <Box flex={1}>
            <Controller
              control={control}
              name="unitSize"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label={`Package Size (per ${watchedOutputUnit})`}
                  placeholder="e.g. 1, 20, 200, 500"
                  value={value ? String(value) : ''}
                  onChangeText={(val) => onChange(parseFloat(val) || 0)}
                  keyboardType="numeric"
                  suffix={watchedBaseUnit}
                  error={errors.unitSize?.message}
                />
              )}
            />
          </Box>

          <Box flex={1}>
            <Controller
              control={control}
              name="baseUnit"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Measurement Unit"
                  placeholder="kg, L, g, ml, pcs"
                  value={value}
                  onChangeText={onChange}
                  error={errors.baseUnit?.message}
                />
              )}
            />
          </Box>
        </Row>

        {/* Quick Base Unit Presets */}
        <Row gap="xs" wrap>
          {COMMON_BASE_UNITS.map((bUnit) => (
            <Button
              key={bUnit}
              label={bUnit}
              variant={watchedBaseUnit === bUnit ? 'primary' : 'subtle'}
              size="sm"
              onPress={() => setValue('baseUnit', bUnit)}
            />
          ))}
        </Row>

        {/* Target Batch Units */}
        <Controller
          control={control}
          name="targetUnits"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label={`Standard Target Output Quantity (${watchedOutputUnit})`}
              value={value ? String(value) : ''}
              onChangeText={(val) => onChange(parseInt(val, 10) || 0)}
              keyboardType="numeric"
              suffix={watchedOutputUnit}
              hint={`Total Batch Yield: ${(watchedTargetUnits * watchedUnitSize).toLocaleString('en-IN')} ${watchedBaseUnit}`}
              error={errors.targetUnits?.message}
            />
          )}
        />

        <Divider variant="brand" spacing="xs" />

        {/* DYNAMIC RECIPE INGREDIENTS LIST */}
        <Box>
          <Row justify="space-between" align="center" style={{ marginBottom: theme.spacing.xsm }}>
            <Box flex={1}>
              <Typography variant="label" color="primary">
                RECIPE INGREDIENTS FORMULATION
              </Typography>
              <Typography variant="caption" color="muted">
                Add, remove, and configure raw materials for one full batch
              </Typography>
            </Box>
            <Row gap="xs">
              <Button
                label="+ New Raw Material"
                variant="subtle"
                size="sm"
                leftIcon="cube-outline"
                onPress={() => setShowAddIngredientModal(true)}
              />
              <Button
                label="+ Add to Recipe"
                variant="secondary"
                size="sm"
                leftIcon="add-outline"
                onPress={() =>
                  append({
                    ingredientName: '',
                    targetQuantity: 10,
                    unit: watchedBaseUnit || 'kg',
                    unitCost: 20,
                  })
                }
              />
            </Row>
          </Row>

          <Stack gap="sm">
            {fields.map((fieldItem, idx) => (
              <Card key={fieldItem.id} variant="accent" padding="compact">
                <Stack gap="xs">
                  <Row justify="space-between" align="center">
                    <Typography variant="label" weight="bold" color="brandDeep">
                      Ingredient #{idx + 1}
                    </Typography>
                    {fields.length > 1 && (
                      <Button
                        label="Remove"
                        variant="ghost"
                        size="sm"
                        leftIcon="trash-outline"
                        onPress={() => remove(idx)}
                      />
                    )}
                  </Row>

                  <Controller
                    control={control}
                    name={`recipeItems.${idx}.ingredientName`}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label="Ingredient Name"
                        placeholder="e.g. Raw Material A, Cane Molasses, Mineral Premix, Water"
                        value={value}
                        onChangeText={onChange}
                      />
                    )}
                  />

                  {/* Suggestion Chips from inventory */}
                  {ingredients.length > 0 && (
                    <Row gap="xxs" wrap>
                      {ingredients
                        .filter((i) => i.category === 'raw_material')
                        .map((ing) => (
                          <Button
                            key={ing.id}
                            label={ing.name}
                            variant="subtle"
                            size="sm"
                            onPress={() => {
                              setValue(`recipeItems.${idx}.ingredientName`, ing.name);
                              setValue(`recipeItems.${idx}.ingredientId`, ing.id);
                              setValue(`recipeItems.${idx}.unit`, ing.unit);
                              setValue(`recipeItems.${idx}.unitCost`, ing.unitCost);
                            }}
                          />
                        ))}
                    </Row>
                  )}

                  <Row gap="sm">
                    <Box flex={1.2}>
                      <Controller
                        control={control}
                        name={`recipeItems.${idx}.targetQuantity`}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Target Quantity"
                            placeholder="e.g. 50"
                            value={value !== undefined ? String(value) : ''}
                            onChangeText={(val) => onChange(parseFloat(val) || 0)}
                            keyboardType="numeric"
                          />
                        )}
                      />
                    </Box>

                    <Box flex={0.8}>
                      <Controller
                        control={control}
                        name={`recipeItems.${idx}.unit`}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Unit"
                            placeholder="kg, L, g"
                            value={value || watchedBaseUnit}
                            onChangeText={onChange}
                          />
                        )}
                      />
                    </Box>

                    <Box flex={1}>
                      <Controller
                        control={control}
                        name={`recipeItems.${idx}.unitCost`}
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            label="Cost / Unit"
                            placeholder="₹"
                            value={value !== undefined ? String(value) : ''}
                            onChangeText={(val) => onChange(parseFloat(val) || 0)}
                            keyboardType="numeric"
                            prefix="₹"
                          />
                        )}
                      />
                    </Box>
                  </Row>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Live Formulation Balance Summary */}
        <Card variant="flat" padding="compact">
          <Typography variant="label" color="muted" style={{ marginBottom: theme.spacing.xs }}>
            BATCH FORMULATION BALANCE
          </Typography>
          <Row justify="space-between">
            <Typography variant="bodySmall" color="secondary">
              Total Recipe Input Ingredients:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="primary">
              {totalInputQty.toLocaleString('en-IN')} {watchedBaseUnit}
            </Typography>
          </Row>
          <Row justify="space-between">
            <Typography variant="bodySmall" color="secondary">
              Target Output Finished Product:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="primary">
              {targetOutputQty.toLocaleString('en-IN')} {watchedBaseUnit} ({watchedTargetUnits} {watchedOutputUnit})
            </Typography>
          </Row>
          <Row justify="space-between">
            <Typography variant="bodySmall" color="secondary">
              Estimated Ingredient Batch Cost:
            </Typography>
            <Typography variant="bodySmall" weight="bold" color="brandDeep">
              ₹{estimatedIngredientCost.toLocaleString('en-IN')}
            </Typography>
          </Row>
        </Card>

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Production Instructions & Line Notes (Optional)"
              value={value || ''}
              onChangeText={onChange}
              placeholder="e.g. Mixing sequence, heating temperature, bottling pressure..."
              multiline
            />
          )}
        />
      </Stack>

      <CreateIngredientModal
        visible={showAddIngredientModal}
        onClose={() => setShowAddIngredientModal(false)}
        onCreated={(newIng) => {
          append({
            ingredientId: newIng.id,
            ingredientName: newIng.name,
            targetQuantity: 10,
            unit: newIng.unit,
            unitCost: newIng.unitCost,
          });
        }}
      />
    </Modal>
  );
};

export default CreateSetupModal;

