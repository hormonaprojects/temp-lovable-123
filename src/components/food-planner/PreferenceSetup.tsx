
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { saveUserPreferences } from "@/services/foodPreferencesQueries";
import { addUserFavorite } from "@/services/userFavorites";
import { PreferenceInfoModal } from "./PreferenceInfoModal";
import { PreferenceHeader } from "./PreferenceHeader";
import { IngredientsGrid } from "./IngredientsGrid";
import { PreferenceNavigation } from "./PreferenceNavigation";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface PreferenceSetupProps {
  user: User;
  onComplete: () => void;
}

interface PreferenceState {
  [key: string]: 'like' | 'dislike' | 'neutral';
}

interface FavoriteState {
  [key: string]: boolean;
}

export function PreferenceSetup({ user, onComplete }: PreferenceSetupProps) {
  const [preferencesData, setPreferencesData] = useState<any[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [preferences, setPreferences] = useState<PreferenceState>({});
  const [favorites, setFavorites] = useState<FavoriteState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(true);
  const { toast } = useToast();

  const categoryNames = [
    'Húsfélék',
    'Halak', 
    'Zöldségek / Vegetáriánus',
    'Tejtermékek',
    'Gyümölcsök',
    'Gabonák és Tészták',
    'Olajok és Magvak'
  ];

  useEffect(() => {
    const loadPreferencesData = async () => {
      try {
        console.log('🔄 ÚJ preferencia adatok betöltése elelmiszer_kategoriak és elelmiszer_kep táblákból...');
        
        // ÚJ: Kategóriák és élelmiszerek betöltése az új táblákból
        const [categoriesData, ingredientsData] = await Promise.all([
          supabase.from('elelmiszer_kategoriak').select('*').order('Kategoriak'),
          supabase.from('elelmiszer_kep').select('*').order('Elelmiszer_nev')
        ]);
        
        console.log('📊 Kategóriák lekérdezés eredménye:', { data: categoriesData.data, error: categoriesData.error });
        console.log('📊 Élelmiszerek lekérdezés eredménye:', { data: ingredientsData.data, error: ingredientsData.error });

        if (categoriesData.error) {
          console.error('❌ Kategóriák lekérdezési hiba:', categoriesData.error);
          throw categoriesData.error;
        }
        
        if (ingredientsData.error) {
          console.error('❌ Élelmiszerek lekérdezési hiba:', ingredientsData.error);
          throw ingredientsData.error;
        }
        
        // ÚJ: Adatok feldolgozása kategória szerint
        const processedData: any[] = [];
        const categories = categoriesData.data || [];
        const ingredients = ingredientsData.data || [];
        
        categories.forEach(category => {
          const categoryIngredients = ingredients.filter(ing => 
            ing.Kategoria_ID === category.Kategoria_ID
          );
          
          if (categoryIngredients.length > 0) {
            processedData.push({
              category_id: category.Kategoria_ID,
              category_name: category.Kategoriak,
              ingredients: categoryIngredients
            });
          }
        });
        
        console.log('✅ ÚJ adatok sikeresen feldolgozva:', processedData.length, 'kategória');
        setPreferencesData(processedData);
        
      } catch (error) {
        console.error('💥 Adatok betöltési hiba:', error);
        toast({
          title: "Hiba történt",
          description: "Nem sikerült betölteni az alapanyagokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferencesData();
  }, [toast]);

  const getCurrentCategoryIngredients = () => {
    console.log('🔍 ÚJ getCurrentCategoryIngredients meghívva');
    console.log('🔍 preferencesData.length:', preferencesData.length);
    console.log('🔍 currentCategoryIndex:', currentCategoryIndex);
    
    if (!preferencesData.length || currentCategoryIndex >= categoryNames.length) {
      console.log('❌ Nincs adat vagy érvénytelen kategória index');
      return [];
    }
    
    const categoryName = categoryNames[currentCategoryIndex];
    console.log('🔍 Kategória keresése:', categoryName);
    
    // ÚJ: Megkeressük a kategóriát a feldolgozott adatokban
    const categoryData = preferencesData.find(data => 
      data.category_name === categoryName
    );
    
    if (!categoryData) {
      console.log('❌ Kategória nem található:', categoryName);
      return [];
    }
    
    // ÚJ: Élelmiszer nevek kinyerése
    const ingredients = categoryData.ingredients?.map((ing: any) => ing.Elelmiszer_nev) || [];
    
    console.log(`🎯 ÚJ módszer - Összegyűjtött alapanyagok (${categoryName}):`, ingredients);
    return ingredients;
  };

  const handlePreferenceChange = (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    
    setPreferences(prev => ({
      ...prev,
      [key]: preference
    }));
  };

  const handleFavoriteChange = (ingredient: string, isFavorite: boolean) => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    
    setFavorites(prev => ({
      ...prev,
      [key]: isFavorite
    }));
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    return preferences[key] || 'neutral';
  };

  const getFavoriteForIngredient = (ingredient: string): boolean => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    return favorites[key] || false;
  };

  const handleNext = () => {
    if (currentCategoryIndex < categoryNames.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    console.log('🎯 Preferencia setup befejezése...');
    
    // Ellenőrizzük, hogy van-e legalább egy beállított preferencia
    const hasAnyPreference = Object.values(preferences).some(pref => pref !== 'neutral');
    
    if (!hasAnyPreference) {
      toast({
        title: "Preferencia szükséges! ⚠️",
        description: "Kérlek, legalább egy ételpreferenciát jelölj be valamelyik kategóriában a folytatáshoz.",
        variant: "destructive"
      });
      return; // Ne folytassuk a mentést, maradjunk ezen az oldalon
    }

    setSaving(true);
    try {
      // Csak azokat a preferenciákat mentjük el, amelyek nem neutral-ak
      const preferencesToSave = Object.entries(preferences)
        .filter(([key, preference]) => preference !== 'neutral')
        .map(([key, preference]) => {
          const [category, ingredient] = key.split('-', 2);
          const favoriteKey = `${category}-${ingredient}`;
          return {
            category,
            ingredient,
            preference,
            favorite: favorites[favoriteKey] || false
          };
        });

      console.log('💾 Mentendő preferenciák:', preferencesToSave);

      // Mentjük a preferenciákat
      await saveUserPreferences(user.id, preferencesToSave);
      console.log('✅ Preferenciák sikeresen elmentve');

      // Külön mentjük a kedvenceket az user_favorites táblába
      const favoritesToSave = Object.entries(favorites)
        .filter(([key, isFavorite]) => isFavorite)
        .map(([key]) => {
          const [category, ingredient] = key.split('-', 2);
          return { category, ingredient };
        });

      console.log('💾 Mentendő kedvencek:', favoritesToSave);

      // Kedvencek mentése egyenként
      for (const favorite of favoritesToSave) {
        const success = await addUserFavorite(user.id, favorite.category, favorite.ingredient);
        if (success) {
          console.log(`✅ Kedvenc mentve: ${favorite.ingredient} (${favorite.category})`);
        } else {
          console.log(`❌ Kedvenc mentése sikertelen: ${favorite.ingredient} (${favorite.category})`);
        }
      }
      
      toast({
        title: "Preferenciák és kedvencek mentve! ✅",
        description: `${preferencesToSave.length} preferencia és ${favoritesToSave.length} kedvenc sikeresen elmentve!`,
      });
      
      // KRITIKUS: Mindig befejezzük a setup-ot és jelöljük befejezettnek
      console.log('🚀 Setup befejezése és átirányítás...');
      onComplete();
      
    } catch (error) {
      console.error('❌ Preferenciák mentési hiba:', error);
      toast({
        title: "Hiba történt",
        description: "Nem sikerült menteni a preferenciákat. Próbáld újra!",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  const currentIngredients = getCurrentCategoryIngredients();
  const isLastCategory = currentCategoryIndex === categoryNames.length - 1;

  console.log('🎯 Aktuális kategória:', categoryNames[currentCategoryIndex]);
  console.log('🍽️ Aktuális alapanyagok:', currentIngredients);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800">
      {/* Info Modal */}
      <PreferenceInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
      />

      {/* Header */}
      <PreferenceHeader
        currentCategoryIndex={currentCategoryIndex}
        totalCategories={categoryNames.length}
        onShowInfo={() => setShowInfoModal(true)}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-6">
          {/* Category Title */}
          <div className="text-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {categoryNames[currentCategoryIndex]}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Jelöld meg, hogy mely alapanyagokat szereted! Használd a szív gombot a kedvencekhez.
            </p>
          </div>

          {/* Ingredients Grid - FONTOS: hideDisliked={false} */}
          <IngredientsGrid
            ingredients={currentIngredients}
            categoryName={categoryNames[currentCategoryIndex]}
            getPreferenceForIngredient={getPreferenceForIngredient}
            getFavoriteForIngredient={getFavoriteForIngredient}
            onPreferenceChange={handlePreferenceChange}
            onFavoriteChange={handleFavoriteChange}
            hideDisliked={false}
          />

          {/* Navigation */}
          <PreferenceNavigation
            currentCategoryIndex={currentCategoryIndex}
            totalCategories={categoryNames.length}
            isLastCategory={isLastCategory}
            saving={saving}
            onPrev={handlePrev}
            onNext={handleNext}
            onFinish={handleFinish}
          />
        </div>
      </div>
    </div>
  );
}
