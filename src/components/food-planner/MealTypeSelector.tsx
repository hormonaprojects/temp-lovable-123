
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelectMealType: (mealType: string) => void;
  foodData: any;
}

const mealTypeNames: { [key: string]: string } = {
  'reggeli': 'Reggeli',
  'tízórai': 'Tízórai',
  'ebéd': 'Ebéd',
  'leves': 'Leves',
  'uzsonna': 'Uzsonna',
  'vacsora': 'Vacsora'
};

const mealTypeIcons: { [key: string]: string } = {
  'reggeli': '🌅',
  'tízórai': '☕',
  'ebéd': '🍽️',
  'leves': '🍲',
  'uzsonna': '🥪',
  'vacsora': '🌙'
};

export function MealTypeSelector({ selectedMealType, onSelectMealType, foodData }: MealTypeSelectorProps) {
  // Csak azokat az étkezési típusokat jelenítjük meg, amelyekhez van adat
  const availableMealTypes = foodData?.mealTypes ? Object.keys(foodData.mealTypes) : [];
  
  console.log('🍽️ Elérhető étkezési típusok:', availableMealTypes);
  console.log('🍽️ MealTypes adatok:', foodData?.mealTypes);

  if (availableMealTypes.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          🍽️ Étkezési típusok betöltése...
        </h2>
        <div className="text-center text-white/70">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          Kérjük várjon...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🍽️ Válassz étkezés típust
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {availableMealTypes.map((mealType) => {
          const displayName = mealTypeNames[mealType] || mealType;
          const icon = mealTypeIcons[mealType] || '🍽️';
          const recipeCount = foodData.mealTypes[mealType]?.length || 0;
          
          console.log(`🍽️ ${mealType} receptek száma:`, recipeCount);
          
          return (
            <Button
              key={mealType}
              onClick={() => onSelectMealType(mealType)}
              className={cn(
                "meal-type-btn py-8 text-lg font-semibold rounded-xl transition-all duration-300 min-h-[120px] flex flex-col items-center justify-center",
                selectedMealType === mealType
                  ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30 hover:scale-102"
              )}
              data-meal={mealType}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">
                  {icon}
                </div>
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs opacity-75 mt-1">
                  {recipeCount} recept
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
