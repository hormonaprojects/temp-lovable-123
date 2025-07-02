
import { Alapanyag, ReceptAlapanyagV2 } from './types';

export const processIngredientsForRecipes = (
  alapanyagokRaw: ReceptAlapanyagV2[],
  alapanyagokMaster: Alapanyag[]
): Record<number, string[]> => {
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
    
    // Ha van Élelmiszer ID, használjuk az alapanyag táblából az adatokat
    let finalElelmiszerNev = elelmiszerNev;
    if (elelmiszerID && alapanyagMap.has(elelmiszerID.toString())) {
      const masterAlapanyag = alapanyagMap.get(elelmiszerID.toString())!;
      finalElelmiszerNev = masterAlapanyag.Elelmiszer || elelmiszerNev;
    }
    
    // Építsük fel a formázott alapanyag stringet
    let formattedIngredient = '';
    if (mennyiseg) {
      formattedIngredient += mennyiseg;
    }
    if (mertekegyseg) {
      formattedIngredient += (formattedIngredient ? ' ' : '') + mertekegyseg;
    }
    if (finalElelmiszerNev) {
      formattedIngredient += (formattedIngredient ? ' ' : '') + finalElelmiszerNev;
    }
    
    if (formattedIngredient.trim()) {
      acc[receptId].push(formattedIngredient.trim());
    }
    
    return acc;
  }, {} as Record<number, string[]>);

  console.log('📊 Alapanyagok csoportosítva:', Object.keys(alapanyagokByReceptId).length, 'recept ID-hoz');
  
  return alapanyagokByReceptId;
};
