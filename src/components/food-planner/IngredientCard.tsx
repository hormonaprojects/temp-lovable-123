
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface IngredientCardProps {
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
  favorite: boolean;
  index: number;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
  onFavoriteChange: (ingredient: string, isFavorite: boolean) => void;
}

export function IngredientCard({ 
  ingredient, 
  preference, 
  favorite,
  index, 
  onPreferenceChange,
  onFavoriteChange 
}: IngredientCardProps) {
  const getIngredientImage = (ingredient: string): string => {
    const normalizedIngredient = ingredient
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '');
    
    return supabase.storage.from('alapanyag').getPublicUrl(`${normalizedIngredient}.jpg`).data.publicUrl;
  };

  const getPngImageUrl = (ingredient: string): string => {
    const normalizedIngredient = ingredient
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\./g, '');
    
    return supabase.storage.from('alapanyag').getPublicUrl(`${normalizedIngredient}.png`).data.publicUrl;
  };

  const handlePreferenceClick = (newPreference: 'like' | 'dislike') => {
    const currentPreference = preference || 'neutral';
    const finalPreference = currentPreference === newPreference ? 'neutral' : newPreference;
    onPreferenceChange(ingredient, finalPreference);
  };

  const handleFavoriteClick = () => {
    const newFavoriteState = !favorite;
    onFavoriteChange(ingredient, newFavoriteState);
    
    // Ha kedvencnek jelöljük, automatikusan "like" preferencet állítunk
    if (newFavoriteState && preference !== 'like') {
      onPreferenceChange(ingredient, 'like');
    }
  };

  const jpgImageUrl = getIngredientImage(ingredient);
  const pngImageUrl = getPngImageUrl(ingredient);

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fadeInUp border-2
        ${preference === 'like' ? 'bg-green-50 border-green-300 scale-110 shadow-lg ring-2 ring-green-200' : ''}
        ${preference === 'dislike' ? 'bg-red-50 border-red-300 scale-90 opacity-70 ring-2 ring-red-200' : ''}
        ${preference === 'neutral' ? 'bg-white border-gray-200 hover:shadow-md hover:border-purple-300' : ''}
        ${favorite ? 'ring-2 ring-pink-300' : ''}
      `}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div className="p-2">
        {/* Favorite indicator */}
        {favorite && (
          <div className="absolute top-1 right-1 z-10">
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
          </div>
        )}
        
        {/* Ingredient Image - Smaller */}
        <div className="w-full aspect-square mb-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={jpgImageUrl}
            alt={ingredient}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              console.log('❌ JPG kép betöltési hiba, próbálkozás PNG-vel:', ingredient);
              (e.target as HTMLImageElement).src = pngImageUrl;
              (e.target as HTMLImageElement).onerror = () => {
                console.log('❌ PNG kép is hibás:', ingredient);
                (e.target as HTMLImageElement).style.display = 'none';
              };
            }}
            onLoad={() => {
              console.log('✅ Kép sikeresen betöltve:', ingredient);
            }}
          />
        </div>
        
        {/* Ingredient Name - Better visibility with word-break */}
        <h3 className="text-xs font-semibold text-gray-800 text-center mb-2 leading-tight break-words hyphens-auto px-1 min-h-[2rem] flex items-center justify-center">
          {ingredient}
        </h3>
        
        {/* Preference and Favorite Buttons - Square shapes */}
        <div className="flex justify-center gap-1">
          <Button
            onClick={() => handlePreferenceClick('like')}
            variant={preference === 'like' ? 'default' : 'outline'}
            size="sm"
            className={`
              w-6 h-6 p-0 transition-all duration-200 rounded-sm
              ${preference === 'like' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                : 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'
              }
            `}
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={() => handlePreferenceClick('dislike')}
            variant={preference === 'dislike' ? 'default' : 'outline'}
            size="sm"
            className={`
              w-6 h-6 p-0 transition-all duration-200 rounded-sm
              ${preference === 'dislike' 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg' 
                : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
              }
            `}
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
          
          <Button
            onClick={handleFavoriteClick}
            variant={favorite ? 'default' : 'outline'}
            size="sm"
            className={`
              w-6 h-6 p-0 transition-all duration-200 rounded-sm
              ${favorite 
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg' 
                : 'hover:bg-pink-50 hover:border-pink-300 hover:text-pink-600'
              }
            `}
          >
            <Heart className={`w-3 h-3 ${favorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
