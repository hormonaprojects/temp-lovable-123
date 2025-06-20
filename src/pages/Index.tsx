
import { useState, useEffect } from "react";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { PersonalInfoSetup } from "@/components/food-planner/PersonalInfoSetup";
import { PreferenceSetup } from "@/components/food-planner/PreferenceSetup";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/services/adminQueries";
import { fetchUserProfile } from "@/services/profileQueries";
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
        setLoading(false);
        
        if (currentUser) {
          await checkUserStatus(currentUser.id);
        }
      } catch (error) {
        console.error('Session lekérési hiba:', error);
        setLoading(false);
      }
    };

    const checkUserStatus = async (userId: string) => {
      try {
        // Check admin status
        const adminStatus = await checkIsAdmin(userId);
        setIsAdmin(adminStatus);

        // Check if user needs to complete personal info or preferences
        const profile = await fetchUserProfile(userId);
        
        if (!profile || !profile.age || !profile.weight || !profile.height || !profile.activity_level) {
          setNeedsPersonalInfo(true);
        } else {
          // Check if user has set up food preferences
          const { data: preferences } = await supabase
            .from('Ételpreferenciák')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

          if (!preferences || preferences.length === 0) {
            setNeedsPreferences(true);
          }
        }
      } catch (error) {
        console.error('User státusz ellenőrzési hiba:', error);
        setIsAdmin(false);
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
        await checkUserStatus(currentUser.id);
      } else {
        setIsAdmin(false);
        setNeedsPersonalInfo(false);
        setNeedsPreferences(false);
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
      setNeedsPersonalInfo(false);
      setNeedsPreferences(false);
    }
  };

  const handlePersonalInfoComplete = () => {
    setNeedsPersonalInfo(false);
    setNeedsPreferences(true);
  };

  const handlePreferencesComplete = () => {
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

  // Show personal info setup if needed
  if (needsPersonalInfo) {
    return (
      <PersonalInfoSetup
        userId={user.id}
        onComplete={handlePersonalInfoComplete}
      />
    );
  }

  // Show preference setup if needed
  if (needsPreferences) {
    return (
      <PreferenceSetup
        userId={user.id}
        onComplete={handlePreferencesComplete}
      />
    );
  }

  const userProfile = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || user.email || 'Felhasználó'
  };

  // If admin, show admin interface
  if (isAdmin) {
    return (
      <AdminDashboard
        user={userProfile}
        onLogout={handleLogout}
        onBackToApp={() => {}}
      />
    );
  }

  // Show main app
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
