
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { saveUserPreferences } from "@/services/foodPreferencesQueries";
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

export function PreferenceSetup({ user, onComplete }: PreferenceSetupProps) {
  const [preferencesData, setPreferencesData] = useState<any[]>([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [preferences, setPreferences] = useState<PreferenceState>({});
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
        console.log('🔄 Preferencia adatok betöltése az új táblából...');
        
        const { data, error } = await supabase
          .from('Ételkategóriák_Új')
          .select('*');
        
        console.log('📊 Ételkategóriák_Új lekérdezés eredménye:', { data, error });

        if (error) {
          console.error('❌ Ételkategóriák_Új lekérdezési hiba:', error);
          throw error;
        }
        
        console.log('✅ Ételkategóriák_Új adatok sikeresen betöltve:', data?.length || 0);
        setPreferencesData(data || []);
        
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
    console.log('🔍 getCurrentCategoryIngredients meghívva');
    console.log('🔍 preferencesData.length:', preferencesData.length);
    console.log('🔍 currentCategoryIndex:', currentCategoryIndex);
    
    if (!preferencesData.length || currentCategoryIndex >= categoryNames.length) {
      console.log('❌ Nincs adat vagy érvénytelen kategória index');
      return [];
    }
    
    const categoryName = categoryNames[currentCategoryIndex];
    console.log('🔍 Kategória keresése:', categoryName);
    
    const ingredients: string[] = [];
    
    // Végigmegyünk az összes soron
    preferencesData.forEach((row, rowIndex) => {
      console.log(`🔍 Sor ${rowIndex + 1} feldolgozása:`, row);
      
      // Megkeressük a kategória oszlopot
      const categoryValue = row[categoryName];
      console.log(`📝 ${categoryName} értéke a ${rowIndex + 1}. sorban:`, categoryValue);
      
      if (categoryValue && typeof categoryValue === 'string' && categoryValue.trim() !== '' && categoryValue !== 'EMPTY') {
        // Az alapanyag közvetlenül a cella értéke
        const ingredient = categoryValue.trim();
        if (ingredient && !ingredients.includes(ingredient)) {
          ingredients.push(ingredient);
          console.log(`✅ Hozzáadva: ${ingredient} (${categoryName})`);
        }
      }
    });
    
    console.log(`🎯 Összegyűjtött alapanyagok (${categoryName}):`, ingredients);
    return ingredients;
  };

  const handlePreferenceChange = (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    
    setPreferences(prev => ({
      ...prev,
      [key]: preference
    }));
  };

  const getPreferenceForIngredient = (ingredient: string): 'like' | 'dislike' | 'neutral' => {
    const key = `${categoryNames[currentCategoryIndex]}-${ingredient}`;
    return preferences[key] || 'neutral';
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
          return {
            category,
            ingredient,
            preference
          };
        });

      console.log('💾 Mentendő preferenciák:', preferencesToSave);

      await saveUserPreferences(user.id, preferencesToSave);
      console.log('✅ Preferenciák sikeresen elmentve');
      
      toast({
        title: "Preferenciák mentve! ✅",
        description: `${preferencesToSave.length} preferencia sikeresen elmentve!`,
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Category Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {categoryNames[currentCategoryIndex]}
            </h2>
            <p className="text-gray-600 text-lg">
              Jelöld meg, hogy mely alapanyagokat szereted!
            </p>
          </div>

          {/* Ingredients Grid */}
          <IngredientsGrid
            ingredients={currentIngredients}
            categoryName={categoryNames[currentCategoryIndex]}
            getPreferenceForIngredient={getPreferenceForIngredient}
            onPreferenceChange={handlePreferenceChange}
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
