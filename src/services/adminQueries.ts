
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
  try {
    console.log('🔍 Admin ellenőrzés:', { userId });
    
    const { data, error } = await supabase.rpc('is_admin', { user_id: userId });
    
    if (error) {
      console.error('Admin ellenőrzési hiba:', error);
      return false;
    }
    
    console.log('✅ Admin státusz:', { userId, isAdmin: data });
    return data || false;
  } catch (error) {
    console.error('Admin ellenőrzési kivétel:', error);
    return false;
  }
};

export const fetchAllUsers = async (): Promise<AdminUserOverview[]> => {
  try {
    console.log('📊 Összes felhasználó betöltése...');
    
    const { data, error } = await supabase
      .from('admin_user_overview')
      .select('*')
      .order('user_created_at', { ascending: false });

    if (error) {
      console.error('Felhasználók betöltési hiba:', error);
      throw error;
    }

    console.log('✅ Felhasználók betöltve:', { count: data?.length || 0 });
    return data || [];
  } catch (error) {
    console.error('Felhasználók betöltési kivétel:', error);
    throw error;
  }
};

export const searchUsers = async (searchTerm: string): Promise<AdminUserOverview[]> => {
  try {
    console.log('🔍 Felhasználók keresése:', { searchTerm });
    
    const { data, error } = await supabase
      .from('admin_user_overview')
      .select('*')
      .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
      .order('user_created_at', { ascending: false });

    if (error) {
      console.error('Felhasználók keresési hiba:', error);
      throw error;
    }

    console.log('✅ Keresési eredmény:', { count: data?.length || 0 });
    return data || [];
  } catch (error) {
    console.error('Felhasználók keresési kivétel:', error);
    throw error;
  }
};

export const assignAdminRole = async (email: string, assignedBy: string) => {
  try {
    console.log('👑 Admin szerepkör kiosztása:', { email, assignedBy });
    
    // Először megkeressük a felhasználót email alapján
    const { data: userData, error: userError } = await supabase
      .from('admin_user_overview')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error('Felhasználó nem található:', { email, error: userError });
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

    console.log('✅ Admin szerepkör sikeresen kiosztva:', { email });
    return true;
  } catch (error) {
    console.error('Admin szerepkör kiosztási kivétel:', error);
    throw error;
  }
};

export const removeAdminRole = async (userId: string) => {
  try {
    console.log('❌ Admin szerepkör megvonása:', { userId });
    
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) {
      console.error('Admin szerepkör eltávolítási hiba:', error);
      throw error;
    }

    console.log('✅ Admin szerepkör sikeresen megvonva:', { userId });
    return true;
  } catch (error) {
    console.error('Admin szerepkör eltávolítási kivétel:', error);
    throw error;
  }
};

export const getUserDetails = async (userId: string) => {
  try {
    console.log('📋 Felhasználó részletek betöltése:', { userId });
    
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

    console.log('✅ Felhasználó részletek betöltve:', { 
      userId, 
      favorites: favorites?.length || 0, 
      preferences: preferences?.length || 0 
    });

    return {
      user,
      favorites: favorites || [],
      preferences: preferences || [],
      favoritesError: favError,
      preferencesError: prefError
    };
  } catch (error) {
    console.error('Felhasználó részletek betöltési kivétel:', error);
    throw error;
  }
};
