
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactIngredientSelector } from "./CompactIngredientSelector";

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface MealIngredients {
  [mealType: string]: SelectedIngredient[];
}

interface IngredientSelectionSectionProps {
  showIngredientSelection: boolean;
  selectedMeals: string[];
  foodData: any;
  onGetMultipleCategoryRecipes: (mealIngredients: MealIngredients) => Promise<void>;
  getFavoriteForIngredient: (ingredient: string) => boolean;
  getPreferenceForIngredient?: (ingredient: string, category: string) => 'like' | 'dislike' | 'neutral';
}

const mealTypes = [
  { key: 'reggeli', label: 'Reggeli', emoji: '🍳' },
  { key: 'tízórai', label: 'Tízórai', emoji: '🥪' },
  { key: 'ebéd', label: 'Ebéd', emoji: '🍽️' },
  { key: 'uzsonna', label: 'Uzsonna', emoji: '🧁' },
  { key: 'vacsora', label: 'Vacsora', emoji: '🌮' }
];

export function IngredientSelectionSection({
  showIngredientSelection,
  selectedMeals,
  foodData,
  onGetMultipleCategoryRecipes,
  getFavoriteForIngredient,
  getPreferenceForIngredient
}: IngredientSelectionSectionProps) {
  const [mealIngredients, setMealIngredients] = useState<MealIngredients>({});

  if (!showIngredientSelection || selectedMeals.length === 0) {
    return null;
  }

  const handleIngredientsChange = async (mealType: string, ingredients: SelectedIngredient[]) => {
    const newMealIngredients = {
      ...mealIngredients,
      [mealType]: ingredients
    };
    setMealIngredients(newMealIngredients);
    
    // Automatikusan triggerelünk generálást, ha van legalább egy étkezéshez alapanyag
    const hasAnyIngredients = Object.values(newMealIngredients).some(ingredients => ingredients.length > 0);
    if (hasAnyIngredients) {
      await onGetMultipleCategoryRecipes(newMealIngredients);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white">
          🎯 Étkezésenkénti alapanyag szűrő ({selectedMeals.length} étkezés)
        </CardTitle>
        <p className="text-white/80 text-sm">
          Válasszon alapanyagokat minden étkezéshez külön-külön. Automatikusan frissül a kiválasztás után.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedMeals.map((mealKey) => {
          const mealType = mealTypes.find(m => m.key === mealKey);
          if (!mealType) return null;

          return (
            <div key={mealKey} className="bg-white/5 rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{mealType.emoji}</span>
                <h3 className="text-lg font-semibold text-white">{mealType.label}</h3>
              </div>
              
              <CompactIngredientSelector
                categories={foodData.categories}
                getFilteredIngredients={foodData.getFilteredIngredients}
                onIngredientsChange={(ingredients) => handleIngredientsChange(mealKey, ingredients)}
                getFavoriteForIngredient={(ingredient: string, category: string) => 
                  getFavoriteForIngredient(ingredient)
                }
                getPreferenceForIngredient={getPreferenceForIngredient}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
