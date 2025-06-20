
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
    let isMounted = true;

    const checkUserSetupStatus = async (userId: string) => {
      try {
        console.log('🔍 Profil adatok ellenőrzése...');
        
        // Check if user has personal info with timeout
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('age, weight, height, activity_level')
          .eq('id', userId)
          .maybeSingle();

        if (!isMounted) return;

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('❌ Profile ellenőrzési hiba:', profileError);
          setLoading(false);
          return;
        }

        console.log('📊 Profil adatok:', profile);

        const hasPersonalInfo = profile && 
          profile.age && 
          profile.weight && 
          profile.height && 
          profile.activity_level;
        
        console.log('✅ Van személyes adat:', hasPersonalInfo);
        
        if (!hasPersonalInfo) {
          console.log('🔄 Személyes adatok hiányoznak, setup szükséges');
          if (isMounted) {
            setNeedsPersonalInfo(true);
            setLoading(false);
          }
          return;
        }

        // Check if user has preferences with timeout
        console.log('🔍 Preferenciák ellenőrzése...');
        const hasPreferences = await checkUserHasPreferences(userId);
        
        if (!isMounted) return;
        
        console.log('✅ Van preferencia:', hasPreferences);
        
        if (!hasPreferences) {
          console.log('🔄 Preferenciák hiányoznak, setup szükséges');
          if (isMounted) {
            setNeedsPreferences(true);
            setLoading(false);
          }
          return;
        }

        // Check admin status
        console.log('🔍 Admin státusz ellenőrzése...');
        const adminStatus = await checkIsAdmin(userId);
        
        if (!isMounted) return;
        
        console.log('✅ Admin státusz:', adminStatus);
        if (isMounted) {
          setIsAdmin(adminStatus);
          setLoading(false);
        }
        
        console.log('✅ Setup ellenőrzés befejezve');

      } catch (error) {
        console.error('❌ Felhasználó setup ellenőrzési hiba:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Kezdeti session lekérése...');
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        console.log('👤 Felhasználó:', currentUser?.email || 'nincs');
        
        if (!isMounted) return;
        
        setUser(currentUser);
        
        if (currentUser) {
          console.log('🔍 Felhasználó setup állapot ellenőrzése kezdődik...');
          await checkUserSetupStatus(currentUser.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Session lekérési hiba:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth állapot változás:', event, session?.user?.email);
      
      if (!isMounted) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Reset all states when user changes
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
      
      if (currentUser && event === 'SIGNED_IN') {
        setLoading(true);
        console.log('🔍 Új bejelentkezés, setup állapot ellenőrzése...');
        await checkUserSetupStatus(currentUser.id);
      } else if (!currentUser) {
        setLoading(false);
      }
    });

    // Initialize
    getInitialSession();

    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('⚠️ Safety timeout triggered - forcing loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés indítása...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Kijelentkezési hiba:', error);
        throw error;
      }
      console.log('✅ Kijelentkezés sikeres');
      
      // Reset states
      setUser(null);
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
      setLoading(false);
    } catch (error) {
      console.error('❌ Kijelentkezési hiba:', error);
      setUser(null);
      setIsAdmin(false);
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
      setLoading(false);
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

  // Show loading while checking initial state
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

  // Show auth form if no user
  if (!user) {
    return <ModernAuthForm onSuccess={() => {}} />;
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.email || 'Felhasználó'
  };

  // Show personal info setup if needed
  if (needsPersonalInfo) {
    return (
      <PersonalInfoSetup
        user={userProfile}
        onComplete={handlePersonalInfoComplete}
      />
    );
  }

  // Show preferences setup if needed
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

  // Show admin dashboard if admin
  if (isAdmin) {
    return (
      <AdminDashboard
        user={userProfile}
        onLogout={handleLogout}
        onBackToApp={() => {}}
      />
    );
  }

  // Show normal user interface
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
