
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface DailyMealHeaderProps {
  onToggleSingleRecipe: () => void;
}

export function DailyMealHeader({ onToggleSingleRecipe }: DailyMealHeaderProps) {
  return (
    <div className="text-center space-y-2 sm:space-y-4">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Button
          onClick={onToggleSingleRecipe}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 h-8 sm:h-auto"
        >
          <Home className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">Vissza a főmenübe</span>
          <span className="sm:hidden">Vissza</span>
        </Button>
      </div>
      <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
        Napi Étrend Tervező
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto text-xs sm:text-base leading-relaxed px-2">
        Válassza ki az étkezési típusokat és opcionálisan alapanyagokat, majd generáljon egy teljes napi étrendet.
      </p>
    </div>
  );
}
