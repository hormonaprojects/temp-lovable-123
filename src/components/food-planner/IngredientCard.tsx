
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface IngredientCardProps {
  ingredient: string;
  preference: 'like' | 'dislike' | 'neutral';
  index: number;
  onPreferenceChange: (ingredient: string, preference: 'like' | 'dislike' | 'neutral') => void;
}

export function IngredientCard({ 
  ingredient, 
  preference, 
  index, 
  onPreferenceChange 
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

  const jpgImageUrl = getIngredientImage(ingredient);
  const pngImageUrl = getPngImageUrl(ingredient);

  return (
    <Card
      className={`
        relative overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 animate-fadeInUp border-2
        ${preference === 'like' ? 'bg-green-50 border-green-300 scale-110 shadow-lg ring-2 ring-green-200' : ''}
        ${preference === 'dislike' ? 'bg-red-50 border-red-300 scale-90 opacity-70 ring-2 ring-red-200' : ''}
        ${preference === 'neutral' ? 'bg-white border-gray-200 hover:shadow-md hover:border-purple-300' : ''}
      `}
      style={{
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div className="p-4">
        {/* Ingredient Image */}
        <div className="w-full aspect-square mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={jpgImageUrl}
            alt={ingredient}
            className="w-full h-full object-cover rounded-xl"
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
        
        {/* Ingredient Name */}
        <h3 className="text-sm font-semibold text-gray-800 text-center mb-3 truncate min-h-[1.25rem]">
          {ingredient}
        </h3>
        
        {/* Preference Buttons */}
        <div className="flex justify-center gap-2">
          <Button
            onClick={() => handlePreferenceClick('like')}
            variant={preference === 'like' ? 'default' : 'outline'}
            size="sm"
            className={`
              w-8 h-8 p-0 transition-all duration-200 rounded-full
              ${preference === 'like' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg' 
                : 'hover:bg-green-50 hover:border-green-300 hover:text-green-600'
              }
            `}
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={() => handlePreferenceClick('dislike')}
            variant={preference === 'dislike' ? 'default' : 'outline'}
            size="sm"
            className={`
              w-8 h-8 p-0 transition-all duration-200 rounded-full
              ${preference === 'dislike' 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg' 
                : 'hover:bg-red-50 hover:border-red-300 hover:text-red-600'
              }
            `}
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
