
import { supabase } from '@/integrations/supabase/client';
import { fetchCombinedRecipes } from './newDatabaseQueries';
import { SupabaseRecipe } from '@/types/supabase';

export const fetchCategories = async () => {
  console.log('🔄 Kategóriák betöltése új táblából...');
  const { data, error } = await supabase
    .from('Ételkategóriák_Új')
    .select('*');

  if (error) {
    console.error('❌ Kategóriák betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Kategóriák betöltve:', data?.length || 0, 'db');
  return data;
};

export const fetchMealTypes = async () => {
  console.log('🔄 Étkezések betöltése...');
  const { data, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések betöltési hiba:', error);
    throw error;
  }

  console.log('✅ Étkezések betöltve:', data?.length || 0, 'db');
  return data;
};

// FALLBACK: Ha az új táblák üresek, használjuk a régit
export const fetchRecipes = async () => {
  console.log('🔄 Receptek betöltése - először új táblák, majd fallback...');
  
  try {
    // Próbáljuk az új struktúrát
    const newRecipes = await fetchCombinedRecipes();
    
    if (newRecipes && newRecipes.length > 0) {
      console.log('✅ Új táblákból sikeresen betöltve:', newRecipes.length, 'recept');
      return newRecipes;
    }
    
    console.log('⚠️ Új táblák üresek, fallback a régi Adatbázis táblára...');
    
    // Fallback a régi táblára
    const { data: oldRecipes, error } = await supabase
      .from('Adatbázis')
      .select('*');

    if (error) {
      console.error('❌ Régi adatbázis betöltési hiba:', error);
      throw error;
    }
    
    console.log('✅ Régi táblából betöltve:', oldRecipes?.length || 0, 'recept');
    
    if (!oldRecipes || oldRecipes.length === 0) {
      console.warn('⚠️ Mindkét tábla üres!');
      return [];
    }
    
    // Konvertáljuk a régi formátumot az új formátumra
    const convertedRecipes = await convertOldRecipesToNew(oldRecipes);
    console.log('✅ Konvertált receptek:', convertedRecipes.length, 'db');
    
    return convertedRecipes;
    
  } catch (error) {
    console.error('❌ Receptek betöltési hiba:', error);
    throw error;
  }
};

// Konvertáló függvény a régi formátumból az újba
const convertOldRecipesToNew = async (oldRecipes: SupabaseRecipe[]) => {
  console.log('🔄 Régi receptek konvertálása új formátumra...');
  
  const convertedRecipes = [];
  
  for (const oldRecipe of oldRecipes) {
    if (!oldRecipe['Recept_Neve']) continue;
    
    // Hozzávalók összegyűjtése
    const ingredients = [
      oldRecipe['Hozzavalo_1'], oldRecipe['Hozzavalo_2'], oldRecipe['Hozzavalo_3'],
      oldRecipe['Hozzavalo_4'], oldRecipe['Hozzavalo_5'], oldRecipe['Hozzavalo_6'],
      oldRecipe['Hozzavalo_7'], oldRecipe['Hozzavalo_8'], oldRecipe['Hozzavalo_9'],
      oldRecipe['Hozzavalo_10'], oldRecipe['Hozzavalo_11'], oldRecipe['Hozzavalo_12'],
      oldRecipe['Hozzavalo_13'], oldRecipe['Hozzavalo_14'], oldRecipe['Hozzavalo_15'],
      oldRecipe['Hozzavalo_16'], oldRecipe['Hozzavalo_17'], oldRecipe['Hozzavalo_18']
    ].filter(Boolean);
    
    // Meal types meghatározása az Étkezések tábla alapján
    const mealTypes = await determineMealTypesForRecipe(oldRecipe['Recept_Neve']);
    
    const convertedRecipe = {
      id: Math.floor(Math.random() * 1000000), // Generált ID
      név: oldRecipe['Recept_Neve'],
      elkészítés: oldRecipe['Elkészítés'] || 'Nincs leírás',
      kép: oldRecipe['Kép URL'] || '',
      szénhidrát: oldRecipe['Szenhidrat_g'] || 0,
      fehérje: oldRecipe['Feherje_g'] || 0,
      zsír: oldRecipe['Zsir_g'] || 0,
      hozzávalók: ingredients,
      mealTypes: mealTypes
    };
    
    convertedRecipes.push(convertedRecipe);
  }
  
  return convertedRecipes;
};

// Meal types meghatározása az Étkezések tábla alapján (másolva az új queryből)
const determineMealTypesForRecipe = async (recipeName: string): Promise<string[]> => {
  console.log('🔍 Meal types meghatározása recepthez:', recipeName);
  
  const { data: mealTypesData, error } = await supabase
    .from('Étkezések')
    .select('*');

  if (error) {
    console.error('❌ Étkezések tábla lekérési hiba:', error);
    return [];
  }

  const normalizedRecipeName = normalizeText(recipeName);
  const mealTypes: string[] = [];

  // Keressük meg a recept nevét az Étkezések táblában
  const matchingRow = mealTypesData?.find(row => {
    const rowRecipeName = row['Recept Neve'];
    if (!rowRecipeName) return false;
    
    const normalizedRowName = normalizeText(rowRecipeName);
    
    // Pontosabb egyezés ellenőrzése
    const exactMatch = normalizedRowName === normalizedRecipeName;
    const containsMatch = normalizedRowName.includes(normalizedRecipeName) || 
                         normalizedRecipeName.includes(normalizedRowName);
    
    // Szó-alapú egyezés
    const recipeWords = normalizedRecipeName.split(' ').filter(word => word.length > 2);
    const nameWords = normalizedRowName.split(' ').filter(word => word.length > 2);
    
    const wordMatch = recipeWords.length > 0 && nameWords.length > 0 && 
      recipeWords.some(word => nameWords.some(nameWord => 
        word.includes(nameWord) || nameWord.includes(word) ||
        Math.abs(word.length - nameWord.length) <= 2
      ));
    
    return exactMatch || containsMatch || wordMatch;
  });

  if (matchingRow) {
    console.log(`✅ Találat az Étkezések táblában: "${recipeName}"`);
    
    // Ellenőrizzük az összes étkezési típust
    const mealTypeColumns = ['Reggeli', 'Tízórai', 'Ebéd', 'Uzsonna', 'Vacsora', 'Leves', 'Előétel', 'Desszert', 'Köret'];
    
    mealTypeColumns.forEach(mealType => {
      const cellValue = matchingRow[mealType];
      if (cellValue && (
        cellValue.toLowerCase().includes('x') || 
        cellValue.toLowerCase().includes('igen') || 
        cellValue === '1' || 
        cellValue === 1
      )) {
        const normalizedMealType = mealType.toLowerCase();
        mealTypes.push(normalizedMealType);
        console.log(`✅ "${recipeName}" hozzáadva "${normalizedMealType}" típushoz`);
      }
    });
  } else {
    console.log(`⚠️ "${recipeName}" nem található az Étkezések táblában`);
  }

  return mealTypes;
};

// Szöveg normalizálási függvény
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ő]/g, 'o')
    .replace(/[ű]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
};

export const saveRecipeRating = async (recipeName: string, rating: number, userId: string) => {
  const { error } = await supabase
    .from('Értékelések')
    .insert({
      'Recept neve': recipeName,
      'Értékelés': rating.toString(),
      'Dátum': new Date().toISOString(),
      'user_id': userId
    });

  if (error) {
    console.error('Értékelés mentési hiba:', error);
    throw error;
  }

  return true;
};
