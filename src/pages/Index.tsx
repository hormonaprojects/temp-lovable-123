
import { useState, useEffect } from "react";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { PersonalInfoSetup } from "@/components/food-planner/PersonalInfoSetup";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/services/adminQueries";
import { checkUserHasPreferences } from "@/services/foodPreferencesQueries";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [needsPersonalInfo, setNeedsPersonalInfo] = useState<boolean>(false);
  const [needsPreferences, setNeedsPreferences] = useState<boolean>(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await checkUserSetupStatus(currentUser.id);
        }
      } catch (error) {
        console.error('Session lekérési hiba:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkUserSetupStatus = async (userId: string) => {
      try {
        console.log('Felhasználó setup ellenőrzése:', userId);
        
        // Check if user has personal info
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('age, weight, height, activity_level')
          .eq('id', userId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile ellenőrzési hiba:', profileError);
        }

        console.log('Profil adatok:', profile);

        const hasPersonalInfo = profile && profile.age && profile.weight && profile.height && profile.activity_level;
        
        if (!hasPersonalInfo) {
          console.log('Személyes adatok hiányoznak');
          setNeedsPersonalInfo(true);
          return;
        }

        // Check if user has preferences
        const hasPreferences = await checkUserHasPreferences(userId);
        console.log('Van ételpreferencia:', hasPreferences);
        
        if (!hasPreferences) {
          setNeedsPreferences(true);
          return;
        }

        // Check admin status
        const adminStatus = await checkIsAdmin(userId);
        setIsAdmin(adminStatus);

      } catch (error) {
        console.error('Felhasználó setup ellenőrzési hiba:', error);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth állapot változás:', event, session?.user?.email);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await checkUserSetupStatus(currentUser.id);
      } else {
        setIsAdmin(false);
        setNeedsPersonalInfo(false);
        setNeedsPreferences(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Kijelentkezés indítása...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Kijelentkezési hiba:', error);
        throw error;
      }
      console.log('Kijelentkezés sikeres');
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
      setUser(null);
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
    }
  };

  const handlePersonalInfoComplete = () => {
    console.log('Személyes adatok mentése kész');
    setNeedsPersonalInfo(false);
    setNeedsPreferences(true);
  };

  const handlePreferencesComplete = () => {
    console.log('Ételpreferenciák mentése kész');
    setNeedsPreferences(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <ModernAuthForm onSuccess={() => {}} />;
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.email || 'Felhasználó'
  };

  // Ha szükséges a személyes adatok bekérése
  if (needsPersonalInfo) {
    console.log('Személyes adatok bekérő oldal megjelenítése');
    return (
      <PersonalInfoSetup
        user={userProfile}
        onComplete={handlePersonalInfoComplete}
      />
    );
  }

  // Ha szükséges az ételpreferenciák beállítása
  if (needsPreferences) {
    console.log('Ételpreferenciák oldal megjelenítése');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <FoodPlannerApp
          user={userProfile}
          onLogout={handleLogout}
          showPreferenceSetup={true}
          onPreferenceSetupComplete={handlePreferencesComplete}
        />
      </div>
    );
  }

  // Ha admin
  if (isAdmin) {
    return (
      <AdminDashboard
        user={userProfile}
        onLogout={handleLogout}
        onBackToApp={() => {}}
      />
    );
  }

  // Normál felhasználói felület
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
