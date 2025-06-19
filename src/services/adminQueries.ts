
import { supabase } from '@/integrations/supabase/client';

export interface AdminUserOverview {
  id: string;
  email: string;
  user_created_at: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  avatar_url: string | null;
  role: 'admin' | 'user' | null;
  favorites_count: number;
  preferences_count: number;
  ratings_count: number;
}

export const checkIsAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
  
  if (error) {
    console.error('Admin ellenőrzési hiba:', error);
    return false;
  }
  
  return data || false;
};

export const fetchAllUsers = async (): Promise<AdminUserOverview[]> => {
  const { data, error } = await supabase
    .from('admin_user_overview')
    .select('*')
    .order('user_created_at', { ascending: false });

  if (error) {
    console.error('Felhasználók betöltési hiba:', error);
    throw error;
  }

  return data || [];
};

export const searchUsers = async (searchTerm: string): Promise<AdminUserOverview[]> => {
  const { data, error } = await supabase
    .from('admin_user_overview')
    .select('*')
    .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
    .order('user_created_at', { ascending: false });

  if (error) {
    console.error('Felhasználók keresési hiba:', error);
    throw error;
  }

  return data || [];
};

export const assignAdminRole = async (email: string, assignedBy: string) => {
  // Először megkeressük a felhasználót email alapján
  const { data: userData, error: userError } = await supabase
    .from('admin_user_overview')
    .select('id')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    throw new Error('Nem található felhasználó ezzel az email címmel');
  }

  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userData.id,
      role: 'admin',
      assigned_by: assignedBy
    });

  if (error) {
    if (error.code === '23505') { // unique constraint violation
      throw new Error('Ez a felhasználó már admin jogosultsággal rendelkezik');
    }
    console.error('Admin szerepkör kiosztási hiba:', error);
    throw error;
  }

  return true;
};

export const removeAdminRole = async (userId: string) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (error) {
    console.error('Admin szerepkör eltávolítási hiba:', error);
    throw error;
  }

  return true;
};

export const getUserDetails = async (userId: string) => {
  // Felhasználó alapadatai
  const { data: user, error: userError } = await supabase
    .from('admin_user_overview')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) {
    console.error('Felhasználó adatok betöltési hiba:', userError);
    throw userError;
  }

  // Kedvencek
  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Preferenciák
  const { data: preferences, error: prefError } = await supabase
    .from('Ételpreferenciák')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    user,
    favorites: favorites || [],
    preferences: preferences || [],
    favoritesError: favError,
    preferencesError: prefError
  };
};
