
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface DailyMealHeaderProps {
  onToggleSingleRecipe: () => void;
}

export function DailyMealHeader({ onToggleSingleRecipe }: DailyMealHeaderProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={onToggleSingleRecipe}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          Vissza a főmenübe
        </Button>
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Napi Étrend Tervező
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Válassza ki az étkezési típusokat és opcionálisan alapanyagokat, majd generáljon egy teljes napi étrendet.
      </p>
    </div>
  );
}
