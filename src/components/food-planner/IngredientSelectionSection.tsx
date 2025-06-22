
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiCategoryIngredientSelector } from "./MultiCategoryIngredientSelector";

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

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/10 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-white">
          🧄 Opcionális alapanyag szűrő
        </CardTitle>
        <p className="text-white/80 text-sm">
          Válasszon alapanyagokat több kategóriából a pontosabb receptekért (opcionális)
        </p>
      </CardHeader>
      <CardContent>
        <MultiCategoryIngredientSelector
          selectedMealType={selectedMeals[0]}
          foodData={foodData}
          onGetMultipleCategoryRecipes={onGetMultipleCategoryRecipes}
          getFavoriteForIngredient={getFavoriteForIngredient}
        />
      </CardContent>
    </Card>
  );
}
