
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompactIngredientSelector } from "./CompactIngredientSelector";

interface SelectedIngredient {
  category: string;
  ingredient: string;
}

interface IngredientSelectionSectionProps {
  showIngredientSelection: boolean;
  selectedMeals: string[];
  foodData: any;
  onGetMultipleCategoryRecipes: (ingredients: SelectedIngredient[]) => Promise<void>;
  getFavoriteForIngredient: (ingredient: string) => boolean;
}

export function IngredientSelectionSection({
  showIngredientSelection,
  selectedMeals,
  foodData,
  onGetMultipleCategoryRecipes,
  getFavoriteForIngredient
}: IngredientSelectionSectionProps) {
  if (!showIngredientSelection || selectedMeals.length === 0) {
    return null;
  }

  const handleIngredientsChange = async (ingredients: SelectedIngredient[]) => {
    // Automatikusan triggerelünk generálást, ha vannak kiválasztott alapanyagok
    if (ingredients.length > 0) {
      await onGetMultipleCategoryRecipes(ingredients);
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white">
          🎯 Speciális alapanyag szűrő ({selectedMeals.length} étkezés)
        </CardTitle>
        <p className="text-white/80 text-sm">
          Válasszon alapanyagokat a pontosabb receptekért. Automatikusan frissül a kiválasztás után.
        </p>
      </CardHeader>
      <CardContent>
        <CompactIngredientSelector
          categories={foodData.categories}
          getFilteredIngredients={foodData.getFilteredIngredients}
          onIngredientsChange={handleIngredientsChange}
          getFavoriteForIngredient={(ingredient: string, category: string) => 
            getFavoriteForIngredient(ingredient)
          }
        />
      </CardContent>
    </Card>
  );
}
