
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PreferencesCategorySelectorProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
}

export function PreferencesCategorySelector({ 
  categories, 
  onCategorySelect 
}: PreferencesCategorySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categories.map((category) => (
        <Card 
          key={category}
          className="bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer"
          onClick={() => onCategorySelect(category)}
        >
          <CardContent className="p-6 text-center">
            <Button
              variant="ghost"
              className="w-full h-auto p-0 text-white hover:text-white hover:bg-transparent"
              onClick={() => onCategorySelect(category)}
            >
              <div className="space-y-2">
                <div className="text-4xl">
                  {category === 'Húsfélék' && '🥩'}
                  {category === 'Halak' && '🐟'}
                  {category === 'Zöldségek / Vegetáriánus' && '🥬'}
                  {category === 'Gyümölcsök' && '🍎'}
                  {category === 'Tejtermékek' && '🥛'}
                  {category === 'Gabonák és Tészták' && '🌾'}
                  {category === 'Olajok és Magvak' && '🌰'}
                </div>
                <div className="text-lg font-medium">{category}</div>
              </div>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
