
import { useState, useEffect } from "react";
import { PreferencesCategorySelector } from "./PreferencesCategorySelector";
import { CategoryIngredientSelector } from "./CategoryIngredientSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, ArrowLeft, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PreferenceSetupProps {
  user: any;
  onComplete: () => void;
  onBack: () => void;
}

export function PreferenceSetup({ user, onComplete, onBack }: PreferenceSetupProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [preferences, setPreferences] = useState<Record<string, Record<string, 'like' | 'dislike' | 'neutral'>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Húsfélék',
    'Halak',
    'Zöldségek / Vegetáriánus',
    'Gyümölcsök',
    'Tejtermékek',
    'Gabonák és Tészták',
    'Olajok és Magvak'
  ];

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePreferenceChange = (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    setPreferences(prev => ({
      ...prev,
      [selectedCategory]: {
        ...prev[selectedCategory],
        [ingredient]: preference
      }
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save preferences logic would go here
      toast({
        title: "Beállítások mentve! ✅",
        description: "Az ételpreferenciáid sikeresen elmentve!",
      });
      onComplete();
    } catch (error) {
      console.error('Preferenciák mentési hiba:', error);
      toast({
        title: "Mentési hiba",
        description: "Nem sikerült elmenteni a preferenciákat. Próbáld újra!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ételpreferenciák beállítása
            </CardTitle>
            <p className="text-gray-600">
              Jelöld meg, hogy mely alapanyagokat szereted vagy nem szereted
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!selectedCategory ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center text-gray-800 mb-4">
                  Válassz egy kategóriát:
                </h3>
                <PreferencesCategorySelector
                  categories={categories}
                  onCategorySelect={handleCategorySelect}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCategory("")}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Vissza a kategóriákhoz
                  </Button>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedCategory}
                  </h3>
                  <div className="w-24"></div>
                </div>

                <CategoryIngredientSelector
                  category={selectedCategory}
                  selectedPreferences={preferences[selectedCategory] || {}}
                  onPreferenceChange={handlePreferenceChange}
                />
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Vissza
              </Button>
              
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                {isLoading ? "Mentés..." : "Beállítások mentése"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
