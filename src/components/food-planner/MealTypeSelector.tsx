
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MealTypeSelectorProps {
  selectedMealType: string;
  onSelectMealType: (mealType: string) => void;
  foodData: any;
}

const mealTypeNames: { [key: string]: string } = {
  'reggeli': 'Reggeli',
  'tizórai': 'Tízórai',
  'ebéd': 'Ebéd',
  'uzsonna': 'Uzsonna',
  'vacsora': 'Vacsora'
};

export function MealTypeSelector({ selectedMealType, onSelectMealType, foodData }: MealTypeSelectorProps) {
  const mealTypes = foodData?.mealTypes ? Object.keys(foodData.mealTypes) : [];

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        🍽️ Válassz étkezés típust
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {mealTypes.map((mealType) => (
          <Button
            key={mealType}
            onClick={() => onSelectMealType(mealType)}
            className={cn(
              "meal-type-btn py-8 text-lg font-semibold rounded-xl transition-all duration-300",
              selectedMealType === mealType
                ? "bg-yellow-400 text-black hover:bg-yellow-300 shadow-lg scale-105"
                : "bg-white/20 text-white hover:bg-white/30 hover:scale-102"
            )}
            data-meal={mealType}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">
                {mealType === 'reggeli' && '🌅'}
                {mealType === 'tizórai' && '☕'}
                {mealType === 'ebéd' && '🍽️'}
                {mealType === 'uzsonna' && '🥪'}
                {mealType === 'vacsora' && '🌙'}
              </div>
              <div>{mealTypeNames[mealType]}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
