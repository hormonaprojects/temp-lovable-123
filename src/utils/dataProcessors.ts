
export const processCategories = (categoriesData: any[]) => {
  const processedCategories: Record<string, string[]> = {};
  
  if (categoriesData && categoriesData.length > 0) {
    categoriesData.forEach(categoryRow => {
      Object.entries(categoryRow).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          const items = value.split(',')
            .map(item => item.trim())
            .filter(item => item && item !== '' && item !== 'EMPTY' && item !== 'NULL');
          
          if (items.length > 0) {
            if (!processedCategories[key]) {
              processedCategories[key] = [];
            }
            items.forEach(item => {
              if (!processedCategories[key].includes(item)) {
                processedCategories[key].push(item);
              }
            });
          }
        }
      });
    });
  }

  return processedCategories;
};

export const processMealTypes = (mealTypesData: any[]) => {
  const processedMealTypeRecipes: Record<string, string[]> = {};
  
  console.log('🔍 ÉTKEZÉS DEBUG - Nyers mealTypesData:', mealTypesData);
  
  if (mealTypesData && mealTypesData.length > 0) {
    mealTypesData.forEach((row, index) => {
      console.log(`🔍 ÉTKEZÉS DEBUG - Sor ${index}:`, row);
      
      // Megnézzük az összes oszlopot és megkeressük a megfelelő étkezési típusokat
      Object.keys(row).forEach(columnName => {
        const cellValue = row[columnName];
        console.log(`🔍 Oszlop: "${columnName}", érték: "${cellValue}"`);
        
        // Ha X van a cellában és van recept név
        if (cellValue === 'X' && row['Recept Neve']) {
          const recipeName = row['Recept Neve'];
          
          // JAVÍTOTT mapping logic - PONTOS oszlopnév használata
          let mealTypeKey = '';
          
          // JAVÍTOTT: Használjuk pontosan az oszlop nevét mint kulcsot
          if (columnName === 'Reggeli') {
            mealTypeKey = 'Reggeli';
          } else if (columnName === 'Tízórai') {
            mealTypeKey = 'Tízórai';  // Pontosan az adatbázis oszlop neve!
          } else if (columnName === 'Ebéd') {
            mealTypeKey = 'Ebéd';
          } else if (columnName === 'Leves') {
            mealTypeKey = 'Leves';
          } else if (columnName === 'Uzsonna') {
            mealTypeKey = 'Uzsonna';
          } else if (columnName === 'Vacsora') {
            mealTypeKey = 'Vacsora';
          }
          
          if (mealTypeKey) {
            if (!processedMealTypeRecipes[mealTypeKey]) {
              processedMealTypeRecipes[mealTypeKey] = [];
            }
            if (!processedMealTypeRecipes[mealTypeKey].includes(recipeName)) {
              processedMealTypeRecipes[mealTypeKey].push(recipeName);
              console.log(`✅ ${columnName} -> ${mealTypeKey} - Hozzáadva recept: ${recipeName}`);
            }
          }
        }
      });
    });
  }

  console.log('🍽️ Feldolgozott étkezési típusok receptekkel:', processedMealTypeRecipes);

  return processedMealTypeRecipes;
};

export const createMealTypesDisplay = (processedMealTypeRecipes: Record<string, string[]>) => {
  const processedMealTypes: Record<string, string[]> = {};
  
  // Display mapping - pontosan az adatbázis oszlopneveket használjuk
  const displayMapping = {
    'Reggeli': 'reggeli',
    'Tízórai': 'tízórai',  // JAVÍTVA: pontosan az adatbázis oszlop neve
    'Ebéd': 'ebéd',
    'Leves': 'leves',
    'Uzsonna': 'uzsonna',
    'Vacsora': 'vacsora'
  };
  
  Object.entries(displayMapping).forEach(([dbColumnName, displayName]) => {
    if (processedMealTypeRecipes[dbColumnName] && processedMealTypeRecipes[dbColumnName].length > 0) {
      processedMealTypes[displayName] = processedMealTypeRecipes[dbColumnName];
    }
  });

  console.log('✅ Végső meal types receptszámokkal:', processedMealTypes);
  return processedMealTypes;
};
