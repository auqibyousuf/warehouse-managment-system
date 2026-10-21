import React, { useState } from 'react';
import { View } from 'react-native';
import { useCurrencySymbol } from '../../hooks/useMoney';
import { formatNumber } from '../../utils/money';
import { Typography } from '../primitives/Typography';
import { TextInput } from '../primitives/TextInput';
import { ChipPicker } from '../composite/ChipPicker';
import { Row } from '../primitives/Row';
import { Box } from '../primitives/Box';

export interface PriceBasisInputProps {
  label: string;
  /** Unit the stock is counted in, e.g. kg or L. */
  unit: string;
  /** Cost of one unit to start from, as text. */
  initialPerUnit?: string;
  /** Called with the cost of ONE unit (price divided by the pack size), as text. */
  onChangePerUnit: (perUnit: string) => void;
}

const PRESETS = ['1', '2', '5', '10', '15', '25', '50'];

/**
 * Enter a price for any quantity ("₹300 for 15 kg") and get the cost per single unit.
 * The app always stores cost per one unit; this only makes typing what is on the bill easy.
 */
export const PriceBasisInput: React.FC<PriceBasisInputProps> = ({
  label,
  unit,
  initialPerUnit = '',
  onChangePerUnit,
}) => {
  const symbol = useCurrencySymbol();
  const [price, setPrice] = useState(initialPerUnit);
  const [basis, setBasis] = useState('1');

  const emit = (nextPrice: string, nextBasis: string) => {
    const p = Number(nextPrice);
    const b = Number(nextBasis);
    if (!(p > 0) || !(b > 0)) return onChangePerUnit('');
    onChangePerUnit(String(Math.round((p / b) * 10000) / 10000));
  };

  const perUnit = Number(price) > 0 && Number(basis) > 0 ? Number(price) / Number(basis) : 0;

  return (
    <View style={{ gap: 8 }}>
      <Row gap="sm" align="flex-end">
        <Box flex={1}>
          <TextInput
            label={label}
            value={price}
            onChangeText={(t) => {
              setPrice(t);
              emit(t, basis);
            }}
            keyboardType="numeric"
            prefix={symbol}
          />
        </Box>
        <Box style={{ width: 120 }}>
          <TextInput
            label={`For how many ${unit}`}
            value={basis}
            onChangeText={(t) => {
              setBasis(t);
              emit(price, t);
            }}
            keyboardType="numeric"
            suffix={unit}
          />
        </Box>
      </Row>
      <ChipPicker
        options={PRESETS.map((p) => ({ value: p, label: `${p} ${unit}` }))}
        selected={basis}
        onSelect={(v) => {
          setBasis(String(v));
          emit(price, String(v));
        }}
      />
      <Typography variant="bodySmall" color="secondary">
        {perUnit > 0
          ? `= ${symbol}${formatNumber(perUnit, symbol)} per 1 ${unit}`
          : `Type the price on the bill and how many ${unit} it covers.`}
      </Typography>
    </View>
  );
};
