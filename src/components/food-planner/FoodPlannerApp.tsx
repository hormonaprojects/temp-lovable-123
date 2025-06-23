import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { Navigation } from './Navigation';
import { SingleRecipeApp } from './SingleRecipeApp';
import { MealPlanGenerator } from './MealPlanGenerator';
import { MultiDayMealPlanGenerator } from './MultiDayMealPlanGenerator';

interface FoodPlannerAppProps {
  user: any;
}

export function FoodPlannerApp({ user }: FoodPlannerAppProps) {
  const [currentPage, setCurrentPage] = useState<'single-recipe' | 'meal-planner' | 'multi-day-planner'>('single-recipe');

  useEffect(() => {
    const storedPage = localStorage.getItem('currentPage') as 'single-recipe' | 'meal-planner' | 'multi-day-planner' | null;
    if (storedPage) {
      setCurrentPage(storedPage);
    }
  }, []);

  const handlePageChange = (page: 'single-recipe' | 'meal-planner' | 'multi-day-planner') => {
    setCurrentPage(page);
    localStorage.setItem('currentPage', page);
  };

  // Add the onGenerateSimilar function
  const handleGenerateSimilar = (recipe: any, mealType: string) => {
    console.log('Generating similar recipe for:', recipe.név, 'meal type:', mealType);
    // TODO: Implement similar recipe generation logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />

      <main className="container mx-auto px-4 py-8">
        {currentPage === 'single-recipe' && (
          <SingleRecipeApp 
            user={user} 
            onGenerateSimilar={handleGenerateSimilar}
          />
        )}
        
        {currentPage === 'meal-planner' && (
          <MealPlanGenerator 
            user={user}
            onGenerateSimilar={handleGenerateSimilar}
          />
        )}
        
        {currentPage === 'multi-day-planner' && (
          <MultiDayMealPlanGenerator user={user} />
        )}
      </main>
    </div>
  );
}
