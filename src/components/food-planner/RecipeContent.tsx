
import { Recipe } from "@/types/recipe";
import { Clock, Users } from "lucide-react";

interface RecipeContentProps {
  recipe: Recipe;
  compact?: boolean;
  isFullScreen?: boolean;
}

export function RecipeContent({ recipe, compact = false, isFullScreen = false }: RecipeContentProps) {
  // Jobb recept képek kategóriák alapján
  const getRecipeImage = (recipeName: string, category?: string) => {
    // Kategória alapú képek
    const categoryImages = {
      'húsfélék': [
        'photo-1555939594-58d7cb561ad1', // grilled meat
        'photo-1544025162-d76694265947', // roasted chicken
        'photo-1532636744-8306ee026f7d'  // beef steak
      ],
      'halak': [
        'photo-1544943910-4c1dc44aab44', // grilled fish
        'photo-1559847844-5315695dadae', // salmon
        'photo-1565299624946-b28f40a0ca4b'  // fish dish
      ],
      'zöldségek': [
        'photo-1512621776951-a57141f2eefd', // vegetable salad
        'photo-1540420773420-3366772f4999', // vegetables
        'photo-1525351484163-7529414344d8'  // green vegetables
      ],
      'tejtermékek': [
        'photo-1506224772180-d75b3efbe9be', // dairy products
        'photo-1486297678162-eb2a19b0a32b', // cheese
        'photo-1628088062854-d1870b4553da'  // yogurt
      ],
      'gyümölcsök': [
        'photo-1542838132-92c53300491e', // mixed fruits
        'photo-1619566636858-adf3ef46400b', // fresh fruits
        'photo-1490474418585-ba9bad8fd0ea'  // colorful fruits
      ],
      'gabonák': [
        'photo-1586201375761-83865001e31c', // rice dish
        'photo-1551326844-4df70f78d0e9', // pasta
        'photo-1589367920969-ab8e050bbb04'  // grains
      ],
      'default': [
        'photo-1565958011703-44f9829ba187', // colorful meal
        'photo-1504674900247-0877df9cc836', // food spread
        'photo-1493770348161-369560ae357d'  // delicious meal
      ]
    };

    // Étkezés típus alapú képek
    const mealTypeImages = {
      'reggeli': [
        'photo-1551218808-94e220e084d2', // breakfast
        'photo-1484723091739-30a097e8f929', // pancakes
        'photo-1533089860892-a7c6f0a88666'  // morning meal
      ],
      'ebéd': [
        'photo-1565958011703-44f9829ba187', // lunch
        'photo-1504674900247-0877df9cc836', // main dish
        'photo-1546833999-b9f581a1996d'  // hearty meal
      ],
      'vacsora': [
        'photo-1467003909585-2f8a72700288', // dinner
        'photo-1493770348161-369560ae357d', // evening meal
        'photo-1551218808-94e220e084d2'  // dinner spread
      ],
      'leves': [
        'photo-1547592166-23ac45744acd', // soup bowl
        'photo-1613478223719-2ab802602423', // vegetable soup
        'photo-1588566565463-180a5dc2c3b9'  // hearty soup
      ]
    };

    // Először étkezés típus alapján próbálkozunk
    const recipeLower = recipeName.toLowerCase();
    
    if (recipeLower.includes('leves') || recipeLower.includes('soup')) {
      const images = mealTypeImages['leves'];
      return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
    }
    
    if (recipeLower.includes('reggeli') || recipeLower.includes('breakfast')) {
      const images = mealTypeImages['reggeli'];
      return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
    }

    // Kategória alapján
    if (category) {
      const categoryKey = Object.keys(categoryImages).find(key => 
        category.toLowerCase().includes(key.toLowerCase())
      );
      if (categoryKey && categoryImages[categoryKey as keyof typeof categoryImages]) {
        const images = categoryImages[categoryKey as keyof typeof categoryImages];
        return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
      }
    }

    // Alapanyag alapján
    if (recipeLower.includes('hús') || recipeLower.includes('csirke') || recipeLower.includes('pulyka')) {
      const images = categoryImages['húsfélék'];
      return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
    }
    
    if (recipeLower.includes('hal') || recipeLower.includes('tonhal') || recipeLower.includes('lazac')) {
      const images = categoryImages['halak'];
      return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
    }
    
    if (recipeLower.includes('zöldség') || recipeLower.includes('répa') || recipeLower.includes('paradicsom')) {
      const images = categoryImages['zöldségek'];
      return `https://images.unsplash.com/${images[0]}?auto=format&fit=crop&w=600&q=80`;
    }

    // Default kép
    const defaultImages = categoryImages['default'];
    return `https://images.unsplash.com/${defaultImages[0]}?auto=format&fit=crop&w=600&q=80`;
  };

  const formatIngredients = (ingredients: string[]) => {
    return ingredients
      .filter(ingredient => ingredient && ingredient.trim() !== '')
      .map(ingredient => ingredient.trim());
  };

  const formatInstructions = (instructions: string) => {
    if (!instructions) return [];
    
    // Számozott lépések keresése (1., 2., stb.)
    const numberedSteps = instructions.split(/\d+\./).filter(step => step.trim());
    if (numberedSteps.length > 1) {
      return numberedSteps.map(step => step.trim()).filter(step => step);
    }
    
    // Mondatok szétválasztása
    const sentences = instructions.split(/[.!?]+/).filter(sentence => sentence.trim());
    if (sentences.length > 1) {
      return sentences.map(sentence => sentence.trim()).filter(sentence => sentence);
    }
    
    // Ha nincs világos struktúra, az egészet egy lépésként visszaadjuk
    return [instructions.trim()];
  };

  // Compact mód a többnapos étrendtervezőhöz
  if (compact) {
    return (
      <div className="space-y-3">
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
    <div className="space-y-4 sm:space-y-6">
      {/* Recept címe és képe */}
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center justify-center gap-2 px-2">
          🍽️ {recipe.név}
        </h2>
        
        {/* Recept kép - javított padding és méretezés */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto px-2">
          <img
            src={getRecipeImage(recipe.név, recipe.kategória)}
            alt={recipe.név}
            className="w-full h-40 sm:h-48 md:h-64 object-cover rounded-xl sm:rounded-2xl shadow-lg"
            onError={(e) => {
              // Fallback kép ha a fő kép nem töltődik be
              e.currentTarget.src = 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </div>

        {/* Főzési idő és adag - javított padding */}
        <div className="flex justify-center gap-3 sm:gap-4 text-white/80 px-2">
          {recipe.főzésiIdő && (
            <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{recipe.főzésiIdő}</span>
            </div>
          )}
          {recipe.adagok && (
            <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-3 py-1 sm:py-2 rounded-lg">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">{recipe.adagok}</span>
            </div>
          )}
        </div>
      </div>

      {/* Hozzávalók - javított padding */}
      <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mx-2 sm:mx-0">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          🥕 Hozzávalók:
        </h3>
        <ul className="space-y-1 sm:space-y-2">
          {formatIngredients(recipe.hozzávalók).map((ingredient, index) => (
            <li key={index} className="text-white/90 flex items-start gap-2 text-sm sm:text-base">
              <span className="text-yellow-400 mt-1">•</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Elkészítés - javított padding */}
      <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mx-2 sm:mx-0">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          👨‍🍳 Elkészítés:
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {formatInstructions(recipe.elkészítés).map((step, index) => (
            <div key={index} className="flex gap-2 sm:gap-3">
              <span className="bg-yellow-400 text-black text-xs sm:text-sm font-bold px-2 py-1 rounded-full min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <p className="text-white/90 flex-1 leading-relaxed text-sm sm:text-base">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
