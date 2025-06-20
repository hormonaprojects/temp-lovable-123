
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
    const initializeAuth = async () => {
      try {
        console.log('🔄 Session inicializálás...');
        
        // Egyszerű session lekérés
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session hiba:', error);
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        console.log('👤 Felhasználó:', currentUser?.email || 'nincs');
        setUser(currentUser);

        if (currentUser) {
          await checkUserSetup(currentUser.id);
        } else {
          setLoading(false);
        }

      } catch (error) {
        console.error('❌ Inicializálási hiba:', error);
        setLoading(false);
      }
    };

    const checkUserSetup = async (userId: string) => {
      try {
        console.log('🔍 Felhasználó setup ellenőrzése...');

        // Profil adatok ellenőrzése
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('age, weight, height, activity_level')
          .eq('id', userId)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Profile hiba:', profileError);
          setLoading(false);
          return;
        }

        const hasPersonalInfo = profile && 
          profile.age && 
          profile.weight && 
          profile.height && 
          profile.activity_level;

        if (!hasPersonalInfo) {
          console.log('🔄 Személyes adatok hiányoznak');
          setNeedsPersonalInfo(true);
          setLoading(false);
          return;
        }

        // Preferenciák ellenőrzése
        const hasPreferences = await checkUserHasPreferences(userId);
        
        if (!hasPreferences) {
          console.log('🔄 Preferenciák hiányoznak');
          setNeedsPreferences(true);
          setLoading(false);
          return;
        }

        // Admin státusz ellenőrzése
        const adminStatus = await checkIsAdmin(userId);
        setIsAdmin(adminStatus);
        
        console.log('✅ Setup ellenőrzés befejezve');
        setLoading(false);

      } catch (error) {
        console.error('❌ Setup ellenőrzési hiba:', error);
        setLoading(false);
      }
    };

    // Auth állapot figyelő
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth változás:', event, session?.user?.email);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Reset states
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
      
      if (currentUser && event === 'SIGNED_IN') {
        setLoading(true);
        await checkUserSetup(currentUser.id);
      } else if (!currentUser) {
        setLoading(false);
      }
    });

    // Inicializálás
    initializeAuth();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés...');
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
      setLoading(false);
    } catch (error) {
      console.error('❌ Kijelentkezési hiba:', error);
    }
  };

  const handlePersonalInfoComplete = () => {
    console.log('✅ Személyes adatok kitöltve');
    setNeedsPersonalInfo(false);
    setNeedsPreferences(true);
  };

  const handlePreferencesComplete = () => {
    console.log('✅ Preferenciák beállítva');
    setNeedsPreferences(false);
  };

  // Loading state
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

  // No user - show auth
  if (!user) {
    return <ModernAuthForm onSuccess={() => {}} />;
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.email || 'Felhasználó'
  };

  // Personal info setup needed
  if (needsPersonalInfo) {
    return (
      <PersonalInfoSetup
        user={userProfile}
        onComplete={handlePersonalInfoComplete}
      />
    );
  }

  // Preferences setup needed
  if (needsPreferences) {
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

  // Admin interface
  if (isAdmin) {
    return (
      <AdminDashboard
        user={userProfile}
        onLogout={handleLogout}
        onBackToApp={() => {}}
      />
    );
  }

  // Normal user interface
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
