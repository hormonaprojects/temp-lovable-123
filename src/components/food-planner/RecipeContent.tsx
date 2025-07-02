
import { Recipe } from "@/types/recipe";
import { Clock, Users } from "lucide-react";

interface RecipeContentProps {
  recipe: Recipe;
  compact?: boolean;
  isFullScreen?: boolean;
}

export function RecipeContent({ recipe, compact = false, isFullScreen = false }: RecipeContentProps) {
  const formatIngredients = (ingredients: string[]) => {
    return ingredients
      .filter(ingredient => ingredient && ingredient.trim() !== '')
      .map(ingredient => ingredient.trim());
  };

  const formatInstructions = (instructions: string) => {
    if (!instructions) return [];
    
    // Tisztítjuk meg az instrukciókat
    const cleanInstructions = instructions.trim();
    
    // Keresünk főcímeket (nagy kezdőbetű + kettőspont)
    const sectionPattern = /([A-ZÁÉÍÓÖŐÜŰ][^:]*:)/g;
    const sections = cleanInstructions.split(sectionPattern).filter(part => part.trim());
    
    const formattedSections = [];
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      if (section.match(/^[A-ZÁÉÍÓÖŐÜŰ][^:]*:$/)) {
        // Ez egy főcím
        const title = section;
        
        // A következő rész a főcím alatti tartalom
        if (i + 1 < sections.length) {
          const nextSection = sections[i + 1].trim();
          if (nextSection && !nextSection.match(/^[A-ZÁÉÍÓÖŐÜŰ][^:]*:$/)) {
            // Kombináljuk a főcímet a tartalommal
            const cleanedSection = nextSection.replace(/^\d+\.\s*/gm, '').trim();
            
            formattedSections.push({
              type: 'bullet',
              content: `${title} ${cleanedSection}`
            });
            
            i++; // Kihagyjuk a következő iterációt, mert már feldolgoztuk
          } else {
            // Ha nincs tartalom a főcím után, akkor csak a főcímet adjuk hozzá
            formattedSections.push({
              type: 'bullet',
              content: title
            });
          }
        } else {
          // Ha ez az utolsó elem, csak a főcímet adjuk hozzá
          formattedSections.push({
            type: 'bullet',
            content: title
          });
        }
      } else if (section && !formattedSections.some(item => item.content.includes(section))) {
        // Ha nincs főcím előtte, akkor egyszerűen hozzáadjuk
        const cleanedSection = section.replace(/^\d+\.\s*/, '').trim();
        if (cleanedSection) {
          formattedSections.push({
            type: 'bullet',
            content: cleanedSection
          });
        }
      }
    }
    
    return formattedSections;
  };

  // Compact mód a többnapos étrendtervezőhöz
  if (compact) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-white text-sm">{recipe.név}</h4>
        {(recipe.főzésiIdő || recipe.adagok) && (
          <div className="flex gap-2 text-xs text-white/70">
            {recipe.főzésiIdő && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.főzésiIdő}
              </span>
            )}
            {recipe.adagok && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {recipe.adagok}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Recept címe és képe - kompaktabb */}
      <div className="text-center space-y-2 sm:space-y-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white flex items-center justify-center gap-2 px-2">
          🍽️ {recipe.név}
        </h2>
        
        {/* Recept kép - kisebb méret */}
        {recipe.képUrl && (
          <div className="w-full max-w-xs sm:max-w-sm mx-auto px-2">
            <img
              src={recipe.képUrl}
              alt={recipe.név}
              className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-lg sm:rounded-xl shadow-lg"
              onError={(e) => {
                // Fallback kép ha a fő kép nem töltődik be
                e.currentTarget.src = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>
        )}

        {/* Főzési idő és adag - kompaktabb */}
        <div className="flex justify-center gap-2 sm:gap-3 text-white/80 px-2">
          {recipe.főzésiIdő && (
            <div className="flex items-center gap-1 bg-white/10 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm">
              <Clock className="w-3 h-3" />
              <span>{recipe.főzésiIdő}</span>
            </div>
          )}
          {recipe.adagok && (
            <div className="flex items-center gap-1 bg-white/10 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm">
              <Users className="w-3 h-3" />
              <span>{recipe.adagok}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hozzávalók - kompaktabb */}
      <div className="bg-white/5 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
          🥕 Hozzávalók:
        </h3>
        <ul className="space-y-1">
          {formatIngredients(recipe.hozzávalók).map((ingredient, index) => (
            <li key={index} className="text-white/90 flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Elkészítés - főcímek a bullet pontok elején */}
      <div className="bg-white/5 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
          👨‍🍳 Elkészítés:
        </h3>
        <ul className="space-y-2">
          {formatInstructions(recipe.elkészítés).map((item, index) => (
            <li key={index} className="text-white/90 flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span className="leading-relaxed">{item.content}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
