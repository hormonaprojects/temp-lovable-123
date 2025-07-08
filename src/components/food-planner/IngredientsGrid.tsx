
import { useState, useEffect } from "react";
import { IngredientCard } from "./IngredientCard";
import { sortIngredientsByPreference } from "@/services/ingredientSorting";
import { supabase } from "@/integrations/supabase/client";

interface IngredientsGridProps {
  ingredients: string[];
  categoryName: string;
  getPreferenceForIngredient: (ingredient: string) => 'like' | 'dislike' | 'neutral';
  getFavoriteForIngredient: (ingredient: string) => boolean;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
  onFavoriteChange: (ingredient: string, isFavorite: boolean) => void;
  hideDisliked?: boolean;
}

export function IngredientsGrid({
  ingredients,
  categoryName,
  getPreferenceForIngredient,
  getFavoriteForIngredient,
  onPreferenceChange,
  onFavoriteChange,
  hideDisliked = true
}: IngredientsGridProps) {
  const [ingredientImages, setIngredientImages] = useState<Record<string, string>>({});

  // Lekérjük az alapanyag képeket a storage-ből
  useEffect(() => {
    const fetchIngredientImages = async () => {
      try {
        console.log('🔄 Alapanyag képek betöltése storage-ből...');
        const imageMap: Record<string, string> = {};
        
        // Minden alapanyag nevét normalizáljuk és megpróbáljuk betölteni a storage-ből
        for (const ingredient of ingredients) {
          // Teljes normalizálás minden ékezetes karakterre
          const normalizedName = ingredient
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // ékezetek eltávolítása
            .replace(/ű/g, 'u')
            .replace(/ő/g, 'o')
            .replace(/á/g, 'a')
            .replace(/é/g, 'e')
            .replace(/í/g, 'i')
            .replace(/ó/g, 'o')
            .replace(/ú/g, 'u')
            .replace(/ü/g, 'u')
            .replace(/[()\/\-]/g, '') // ( ) / - karakterek eltávolítása
            .replace(/\s+/g, '_') // szóközök -> aláhúzás
            .replace(/_+/g, '_') // több egymás utáni aláhúzás -> egy aláhúzás
            .replace(/^_|_$/g, '') // kezdő/záró aláhúzás eltávolítása
            .trim();
          
          // Megpróbáljuk png és jpg formátumban is (csak kisbetűvel, mivel minden fájl kisbetűvel van)
          const formats = ['png', 'jpg'];
          let imageUrl = null;
          
          for (const format of formats) {
            try {
              const { data } = supabase.storage
                .from('alapanyag')
                .getPublicUrl(`${normalizedName}.${format}`);
              
              if (data?.publicUrl) {
                // Ellenőrizzük, hogy a kép létezik-e (HEAD request)
                const response = await fetch(data.publicUrl, { method: 'HEAD' });
                if (response.ok) {
                  imageUrl = data.publicUrl;
                  console.log(`✅ Kép talált: ${ingredient} -> ${normalizedName}.${format}`);
                  break;
                }
              }
            } catch (error) {
              // Próbáljuk a következő formátumot
            }
          }
          
          if (imageUrl) {
            imageMap[ingredient] = imageUrl;
          } else {
            console.log(`❌ Nincs kép: ${ingredient} (${normalizedName})`);
          }
        }
        
        setIngredientImages(imageMap);
        console.log('✅ Storage képek betöltve:', Object.keys(imageMap).length, 'db az alapanyagokból:', ingredients.length, 'db');
      } catch (error) {
        console.error('❌ Storage képek betöltési hiba:', error);
      }
    };

    if (ingredients.length > 0) {
      fetchIngredientImages();
    }
  }, [ingredients]);
  const getSortedIngredients = () => {
    if (!hideDisliked) {
      return [...ingredients].sort((a, b) => {
        const aIsFavorite = getFavoriteForIngredient(a);
        const bIsFavorite = getFavoriteForIngredient(b);
        const aPreference = getPreferenceForIngredient(a);
        const bPreference = getPreferenceForIngredient(b);
        
        if (aIsFavorite !== bIsFavorite) {
          return aIsFavorite ? -1 : 1;
        }
        
        if (aPreference === 'like' && bPreference !== 'like') {
          return -1;
        }
        if (bPreference === 'like' && aPreference !== 'like') {
          return 1;
        }
        
        if (aPreference === 'dislike' && bPreference !== 'dislike') {
          return 1;
        }
        if (bPreference === 'dislike' && aPreference !== 'dislike') {
          return -1;
        }
        
        return a.localeCompare(b, 'hu');
      });
    }
    
    return sortIngredientsByPreference(
      ingredients,
      (ingredient) => getFavoriteForIngredient(ingredient),
      (ingredient) => getPreferenceForIngredient(ingredient),
      categoryName
    );
  };

  const displayedIngredients = getSortedIngredients();

  if (displayedIngredients.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nincs megjeleníthető alapanyag ebben a kategóriában.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {displayedIngredients.map((ingredient, index) => {
        const preference = getPreferenceForIngredient(ingredient);
        const favorite = getFavoriteForIngredient(ingredient);
        const imageUrl = ingredientImages[ingredient];
        
        return (
          <IngredientCard
            key={ingredient}
            ingredient={ingredient}
            preference={preference}
            favorite={favorite}
            index={index}
            imageUrl={imageUrl}
            onPreferenceChange={onPreferenceChange}
            onFavoriteChange={onFavoriteChange}
          />
        );
      })}
    </div>
  );
}
