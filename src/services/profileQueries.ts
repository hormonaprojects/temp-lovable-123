
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  full_name: string | null;
  age: number | null;
  weight: number | null;
  height: number | null;
  activity_level: string | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  created_at: string;
  updated_at: string;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profil betöltési hiba:', error);
    return null;
  }

  return data;
};

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Profil frissítési hiba:', error);
    throw error;
  }

  return data;
};

export const createUserProfile = async (userId: string, profileData: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      ...profileData,
    })
    .select()
    .single();

  if (error) {
    console.error('Profil létrehozási hiba:', error);
    throw error;
  }

  return data;
};
