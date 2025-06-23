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
import type { User, Session } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentSetupStep, setCurrentSetupStep] = useState<'personal-info' | 'health-conditions' | 'preferences' | 'complete'>('complete');
  const [checkingSetupStatus, setCheckingSetupStatus] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [preferencesJustCompleted, setPreferencesJustCompleted] = useState(false);
  const [setupSkipped, setSetupSkipped] = useState(false);

  useEffect(() => {
    console.log('🔄 Index komponens betöltődött');

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      console.log('🔑 Jelszó visszaállítási link észlelve, átirányítás...');
      navigate('/reset-password?' + searchParams.toString());
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth változás:', event, session?.user?.email || 'nincs');
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 Nincs érvényes session, visszaállítás auth formra');
        setSession(null);
        setUser(null);
        setSetupCompleted(false);
        setCurrentSetupStep('complete');
        setPreferencesJustCompleted(false);
        setSetupSkipped(false);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user);
      setLoading(false);
    });

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session hiba:', error);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('📋 Kezdeti session:', session?.user?.email || 'nincs');
        
        if (!session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);
        setLoading(false);
      } catch (error) {
        console.error('❌ Session lekérési hiba:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, navigate]);

  useEffect(() => {
    if (session && user && !checkingSetupStatus && !setupCompleted && !preferencesJustCompleted && !setupSkipped) {
      checkUserSetupStatus();
    }
  }, [session, user, setupCompleted, preferencesJustCompleted, setupSkipped]);

  const checkUserSetupStatus = async () => {
    if (!session || !user) {
      console.log('❌ Nincs érvényes session vagy user, kihagyás');
      return;
    }
    
    setCheckingSetupStatus(true);
    try {
      console.log('🔍 Felhasználó beállítási állapot ellenőrzése...');
      
      const profile = await fetchUserProfile(user.id);
      console.log('👤 Profil adatok:', profile);
      
      if (!profile || !profile.age || !profile.weight || !profile.height || !profile.activity_level) {
        console.log('❌ Hiányos személyes adatok, személyes info beállítás szükséges');
        setCurrentSetupStep('personal-info');
        return;
      }

      console.log('✅ Személyes adatok megvannak, setup befejezve');
      setCurrentSetupStep('complete');
      setSetupCompleted(true);
      
    } catch (error) {
      console.error('❌ Beállítási állapot ellenőrzési hiba:', error);
      setCurrentSetupStep('personal-info');
    } finally {
      setCheckingSetupStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés...');
      await supabase.auth.signOut();
      setSetupCompleted(false);
      setCurrentSetupStep('complete');
      setPreferencesJustCompleted(false);
      setSetupSkipped(false);
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
    setSetupCompleted(true);
    setPreferencesJustCompleted(true);
    setSetupSkipped(true);
  };

  if (loading || checkingSetupStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
          <p className="text-white text-sm mt-2">
            {checkingSetupStatus ? 'Beállítási állapot ellenőrzése...' : 'Session ellenőrzés...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    console.log('🔐 Nincs érvényes session, auth form megjelenítése');
    return <ModernAuthForm onSuccess={() => {}} />;
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.email || 'Felhasználó'
  };

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

  return (
    <FoodPlannerApp
      user={userProfile}
    />
  );
};

export default Index;
