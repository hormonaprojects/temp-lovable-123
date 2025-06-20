import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { PersonalInfoSetup } from "@/components/food-planner/PersonalInfoSetup";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showPersonalInfo, setShowPersonalInfo] = useState(true);
  const [showHealthConditions, setShowHealthConditions] = useState(false);
  const [showPreferenceSetup, setShowPreferenceSetup] = useState(false);

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

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Kijelentkezési hiba:', error);
    }
  };

  const handlePersonalInfoComplete = () => {
    setShowPersonalInfo(false);
    setShowHealthConditions(true);
  };

  const handleHealthConditionsComplete = () => {
    setShowHealthConditions(false);
    setShowPreferenceSetup(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-green-500 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Betöltés...</p>
          <p className="text-white text-sm mt-2">Egyszerű auth ellenőrzés...</p>
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

  // Bejelentkezett felhasználó - egyszerű app megjelenítés
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
