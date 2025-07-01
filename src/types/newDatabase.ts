
export interface ReceptekV2 {
  'Recept ID': number;
  'Receptnév': string;
  'Elkészítése': string;
  'Kép': string;
  'Szenhidrat_g': number;
  'Feherje_g': number;
  'Zsir_g': number;
}

export interface ReceptAlapanyagV2 {
  'ID': string;
  'Recept_ID': number;
  'Élelmiszerek': string;
  'Mennyiség': number;
  'Mértékegység': string;
  'Élelmiszer ID': string;
}

export interface CombinedRecipe {
  id: number;
  név: string;
  elkészítés: string;
  kép: string;
  szénhidrát: number;
  fehérje: number;
  zsír: number;
  hozzávalók: string[];
}
