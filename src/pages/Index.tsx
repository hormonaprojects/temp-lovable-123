import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { PersonalInfoSetup } from "@/components/food-planner/PersonalInfoSetup";
import { HealthConditionsSetup } from "@/components/food-planner/HealthConditionsSetup";
import { PreferenceSetup } from "@/components/food-planner/PreferenceSetup";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserProfile } from "@/services/profileQueries";
import { checkUserHasPreferences } from "@/services/foodPreferencesQueries";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentSetupStep, setCurrentSetupStep] = useState<'personal-info' | 'health-conditions' | 'preferences' | 'complete'>('complete');
  const [checkingSetupStatus, setCheckingSetupStatus] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false); // Új flag a beállítások befejezéséhez

  useEffect(() => {
    console.log('🔄 Index komponens betöltődött');

    // Ellenőrizzük, hogy ez egy jelszó visszaállítási link-e
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      console.log('🔑 Jelszó visszaállítási link észlelve, átirányítás...');
      navigate('/reset-password?' + searchParams.toString());
      return;
    }

    // Egyszerű session ellenőrzés
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📋 Session:', session?.user?.email || 'nincs');
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('❌ Session hiba:', error);
        setLoading(false);
      }
    };

    // Auth változások figyelése
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth változás:', event, session?.user?.email || 'nincs');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, navigate]);

  // Ellenőrizzük a felhasználó beállítási állapotát amikor bejelentkezik
  useEffect(() => {
    if (user && !checkingSetupStatus && !setupCompleted) {
      checkUserSetupStatus();
    }
  }, [user, setupCompleted]);

  const checkUserSetupStatus = async () => {
    if (!user) return;
    
    setCheckingSetupStatus(true);
    try {
      console.log('🔍 Felhasználó beállítási állapot ellenőrzése...');
      
      // 1. Ellenőrizzük a személyes adatokat
      const profile = await fetchUserProfile(user.id);
      console.log('👤 Profil adatok:', profile);
      
      if (!profile || !profile.age || !profile.weight || !profile.height || !profile.activity_level) {
        console.log('❌ Hiányos személyes adatok, személyes info beállítás szükséges');
        setCurrentSetupStep('personal-info');
        return;
      }

      // 2. Ellenőrizzük az ételpreferenciákat
      const hasPreferences = await checkUserHasPreferences(user.id);
      console.log('🍽️ Van preferencia:', hasPreferences);
      
      if (!hasPreferences) {
        console.log('❌ Nincsenek preferenciák, egészségügyi állapotok beállítás szükséges');
        setCurrentSetupStep('health-conditions');
        return;
      }

      // Ha minden megvan, akkor kész
      console.log('✅ Minden beállítás kész');
      setCurrentSetupStep('complete');
      setSetupCompleted(true); // Jelezzük, hogy a beállítás befejezve
      
    } catch (error) {
      console.error('❌ Beállítási állapot ellenőrzési hiba:', error);
      // Ha hiba van, kezdjük az elejéről
      setCurrentSetupStep('personal-info');
    } finally {
      setCheckingSetupStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés...');
      await supabase.auth.signOut();
      // Reset setup state kijelentkezéskor
      setSetupCompleted(false);
      setCurrentSetupStep('complete');
    } catch (error) {
      console.error('❌ Kijelentkezési hiba:', error);
    }
  };

  const handlePersonalInfoComplete = () => {
    console.log('✅ Személyes adatok befejezve, tovább az egészségügyi állapotokhoz');
    setCurrentSetupStep('health-conditions');
  };

  const handleHealthConditionsComplete = () => {
    console.log('✅ Egészségügyi állapotok befejezve, tovább a preferenciákhoz');
    setCurrentSetupStep('preferences');
  };

  const handlePreferencesComplete = () => {
    console.log('✅ Preferenciák befejezve, tovább az apphoz');
    setCurrentSetupStep('complete');
    setSetupCompleted(true); // Jelezzük, hogy a teljes beállítás befejezve
  };

  // Loading state
  if (loading || checkingSetupStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
          <p className="text-white text-sm mt-2">
            {checkingSetupStatus ? 'Beállítási állapot ellenőrzése...' : 'Egyszerű auth ellenőrzés...'}
          </p>
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

  // Beállítási lépések kezelése
  if (currentSetupStep === 'personal-info') {
    return (
      <PersonalInfoSetup
        user={userProfile}
        onComplete={handlePersonalInfoComplete}
      />
    );
  }

  if (currentSetupStep === 'health-conditions') {
    return (
      <HealthConditionsSetup
        user={userProfile}
        onComplete={handleHealthConditionsComplete}
        onBack={() => setCurrentSetupStep('personal-info')}
      />
    );
  }

  if (currentSetupStep === 'preferences') {
    return (
      <PreferenceSetup
        user={userProfile}
        onComplete={handlePreferencesComplete}
      />
    );
  }

  // Bejelentkezett felhasználó - teljes app megjelenítés
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
