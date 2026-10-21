import React from 'react';
import { ProductionScreen } from './ProductionScreen';

/** Recipes tab: every recipe, with New Recipe and Start Batch one tap away. */
export const RecipesScreen: React.FC = () => <ProductionScreen only="setups" />;

export default RecipesScreen;
