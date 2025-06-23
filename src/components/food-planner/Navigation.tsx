
import { Button } from "@/components/ui/button";
import { ChefHat } from "lucide-react";

interface NavigationProps {
  currentPage: 'single-recipe' | 'meal-planner' | 'multi-day-planner';
  onPageChange: (page: 'single-recipe' | 'meal-planner' | 'multi-day-planner') => void;
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className="bg-black/20 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-bold text-white">Recept Generátor</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={currentPage === 'single-recipe' ? 'default' : 'ghost'}
              onClick={() => onPageChange('single-recipe')}
              className="text-white"
            >
              Egy Recept
            </Button>
            <Button
              variant={currentPage === 'meal-planner' ? 'default' : 'ghost'}
              onClick={() => onPageChange('meal-planner')}
              className="text-white"
            >
              Napi Étrend
            </Button>
            <Button
              variant={currentPage === 'multi-day-planner' ? 'default' : 'ghost'}
              onClick={() => onPageChange('multi-day-planner')}
              className="text-white"
            >
              Többnapos Étrend
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
