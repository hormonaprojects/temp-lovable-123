
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
    
    // Tisztítjuk meg az instrukciókat és szétválasztjuk a főcímeket
    const cleanInstructions = instructions.trim();
    
    // Keresünk főcímeket (nagy kezdőbetű + kettőspont)
    // Például: "Szósz elkészítése:", "Quinoa főzése:", stb.
    const sectionPattern = /([A-ZÁÉÍÓÖŐÜŰ][^:]*:)/g;
    const sections = cleanInstructions.split(sectionPattern).filter(part => part.trim());
    
    const formattedSections = [];
    let stepCounter = 1;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      if (section.match(/^[A-ZÁÉÍÓÖŐÜŰ][^:]*:$/)) {
        // Ez egy főcím - reset step counter
        stepCounter = 1;
        formattedSections.push({
          type: 'header',
          content: section
        });
      } else if (section) {
        // Ez egy lépés vagy lépések csoportja
        // Először próbáljuk meg a számozott lépéseket felismerni
        const numberedSteps = section.split(/(\d+\.)\s*/).filter(step => step.trim());
        
        if (numberedSteps.length > 2) {
          // Van számozás a szövegben
          for (let j = 1; j < numberedSteps.length; j += 2) {
            const stepContent = numberedSteps[j + 1];
            if (stepContent && stepContent.trim()) {
              formattedSections.push({
                type: 'step',
                content: stepContent.trim(),
                number: stepCounter++
              });
            }
          }
        } else {
          // Nincs számozás, mondatok szerint bontjuk és számozzuk
          const sentences = section.split(/[.!?]+/).filter(sentence => sentence.trim());
          sentences.forEach((sentence) => {
            if (sentence.trim()) {
              formattedSections.push({
                type: 'step',
                content: sentence.trim(),
                number: stepCounter++
              });
            }
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

      {/* Elkészítés - javított formázással */}
      <div className="bg-white/5 rounded-lg p-3 sm:p-4 mx-2 sm:mx-0">
        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2">
          👨‍🍳 Elkészítés:
        </h3>
        <div className="space-y-3">
          {formatInstructions(recipe.elkészítés).map((item, index) => {
            if (item.type === 'header') {
              return (
                <div key={index} className="mt-4 first:mt-0">
                  <h4 className="text-yellow-400 font-semibold text-sm sm:text-base mb-2">
                    {item.content}
                  </h4>
                </div>
              );
            } else {
              return (
                <div key={index} className="flex gap-2">
                  <span className="bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-5 flex items-center justify-center flex-shrink-0">
                    {item.number}
                  </span>
                  <p className="text-white/90 flex-1 leading-relaxed text-xs sm:text-sm">{item.content}</p>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}
