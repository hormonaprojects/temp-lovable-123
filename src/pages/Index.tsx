
import { useState, useEffect } from "react";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { BasicInfoSetup } from "@/components/food-planner/BasicInfoSetup";
import { PreferenceSetup } from "@/components/food-planner/PreferenceSetup";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/services/adminQueries";
import { fetchUserProfile } from "@/services/profileQueries";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<'basic' | 'preferences' | 'complete'>('complete');

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);
        
        if (currentUser) {
          checkAdminStatus(currentUser.id);
          checkUserSetup(currentUser.id);
        }
      } catch (error) {
        console.error('Session lekérési hiba:', error);
        setLoading(false);
      }
    };

    const checkAdminStatus = async (userId: string) => {
      try {
        const adminStatus = await checkIsAdmin(userId);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Admin státusz ellenőrzési hiba:', error);
        setIsAdmin(false);
      }
    };

    const checkUserSetup = async (userId: string) => {
      try {
        const profile = await fetchUserProfile(userId);
        
        if (!profile || !profile.age || !profile.weight || !profile.height || !profile.activity_level) {
          setSetupStep('basic');
        } else {
          // Check if preferences are set up
          const { data: preferences } = await supabase
            .from('Ételpreferenciák')
            .select('*')
            .eq('user_id', userId)
            .limit(1);
          
          if (!preferences || preferences.length === 0) {
            setSetupStep('preferences');
          } else {
            setSetupStep('complete');
          }
        }
      } catch (error) {
        console.error('Felhasználó beállítások ellenőrzési hiba:', error);
        setSetupStep('basic');
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
        checkAdminStatus(currentUser.id);
        checkUserSetup(currentUser.id);
      } else {
        setIsAdmin(false);
        setSetupStep('complete');
      }
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
      setSetupStep('complete');
    }
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

  // Ha admin, csak az admin felületet mutassuk
  if (isAdmin) {
    return (
      <AdminDashboard
        user={userProfile}
        onLogout={handleLogout}
        onBackToApp={() => {}}
      />
    );
  }

  // Setup flow for new users
  if (setupStep === 'basic') {
    return (
      <BasicInfoSetup
        user={userProfile}
        onComplete={() => setSetupStep('preferences')}
      />
    );
  }

  if (setupStep === 'preferences') {
    return (
      <PreferenceSetup
        user={userProfile}
        onComplete={() => setSetupStep('complete')}
        onBack={() => setSetupStep('basic')}
      />
    );
  }

  // Ha minden be van állítva, az ételtervező alkalmazást mutassuk
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
