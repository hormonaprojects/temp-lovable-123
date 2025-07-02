
import { Alapanyag, ReceptAlapanyagV2 } from './types';

export const processIngredientsForRecipes = (
  alapanyagokRaw: ReceptAlapanyagV2[],
  alapanyagokMaster: Alapanyag[]
): Record<number, string[]> => {
  console.log('🔄 Alapanyagok feldolgozása kezdődik...');
  console.log('📊 Nyers alapanyagok száma:', alapanyagokRaw.length);
  console.log('📊 Master alapanyagok száma:', alapanyagokMaster.length);

  // Debug: mutassuk meg néhány nyers alapanyagot
  console.log('🔍 Első 3 nyers alapanyag példa:', alapanyagokRaw.slice(0, 3));

  // Alapanyag lookup map készítése ID alapján
  const alapanyagMap = new Map<string, Alapanyag>();
  alapanyagokMaster.forEach(alapanyag => {
    alapanyagMap.set(alapanyag.ID.toString(), alapanyag);
  });

  console.log('📋 Alapanyag map mérete:', alapanyagMap.size);

  // Csoportosítjuk az alapanyagokat recept ID szerint
  console.log('🔄 Alapanyagok csoportosítása Recept_ID szerint...');
  const alapanyagokByReceptId = alapanyagokRaw.reduce((acc, alapanyag) => {
    const receptId = alapanyag['Recept_ID'];
    if (!receptId) {
      console.warn('⚠️ Hiányzó Recept_ID:', alapanyag);
      return acc;
    }
    
    if (!acc[receptId]) {
      acc[receptId] = [];
    }
    
    // Alapanyag részletek lekérése
    const elelmiszerID = alapanyag['Élelmiszer ID'];
    const elelmiszerNev = alapanyag['Élelmiszerek'];
    const mennyiseg = alapanyag['Mennyiség'] || '';
    const mertekegyseg = alapanyag['Mértékegység'] || '';
    
    console.log(`🔍 Feldolgozás - Recept ID: ${receptId}, Élelmiszer: ${elelmiszerNev}, Mennyiség: ${mennyiseg}, Mértékegység: ${mertekegyseg}`);
    
    // Ha van Élelmiszer ID, használjuk az alapanyag táblából az adatokat
    let finalElelmiszerNev = elelmiszerNev;
    if (elelmiszerID && alapanyagMap.has(elelmiszerID.toString())) {
      const masterAlapanyag = alapanyagMap.get(elelmiszerID.toString())!;
      finalElelmiszerNev = masterAlapanyag.Elelmiszer || elelmiszerNev;
      console.log(`✅ Master alapanyag találat: ${finalElelmiszerNev}`);
    }
    
    // Építsük fel a formázott alapanyag stringet
    let formattedIngredient = '';
    if (mennyiseg && mennyiseg.toString().trim() !== '' && mennyiseg.toString() !== '0') {
      formattedIngredient += mennyiseg.toString();
    }
    if (mertekegyseg && mertekegyseg.trim() !== '') {
      formattedIngredient += (formattedIngredient ? ' ' : '') + mertekegyseg;
    }
    if (finalElelmiszerNev && finalElelmiszerNev.trim() !== '') {
      formattedIngredient += (formattedIngredient ? ' ' : '') + finalElelmiszerNev;
    }
    
    // Ha csak az élelmiszer név van, azt is adjuk hozzá
    if (!formattedIngredient.trim() && finalElelmiszerNev && finalElelmiszerNev.trim() !== '') {
      formattedIngredient = finalElelmiszerNev.trim();
    }
    
    if (formattedIngredient.trim()) {
      acc[receptId].push(formattedIngredient.trim());
      console.log(`✅ Hozzáadva: "${formattedIngredient.trim()}" (Recept ID: ${receptId})`);
    } else {
      console.warn(`⚠️ Üres alapanyag (Recept ID: ${receptId}):`, { 
        elelmiszerNev, 
        mennyiseg, 
        mertekegyseg, 
        elelmiszerID,
        masterFound: elelmiszerID && alapanyagMap.has(elelmiszerID.toString())
      });
    }
    
    return acc;
  }, {} as Record<number, string[]>);

  console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');
  
  // Debug: mutassuk meg néhány recept alapanyagait és az üreseket is
  Object.entries(alapanyagokByReceptId).slice(0, 10).forEach(([receptId, ingredients]) => {
    if (ingredients.length === 0) {
      console.warn(`⚠️ ÜRES! Recept ${receptId} - nincs alapanyag!`);
    } else {
      console.log(`🍽️ Recept ${receptId} alapanyagai (${ingredients.length} db):`, ingredients);
    }
  });

  // Számoljuk meg az üres recepteket
  const emptyRecipes = Object.entries(alapanyagokByReceptId).filter(([_, ingredients]) => ingredients.length === 0);
  console.log(`📊 Üres receptek száma: ${emptyRecipes.length} / ${Object.keys(alapanyagokByReceptId).length}`);
  
  return alapanyagokByReceptId;
};
