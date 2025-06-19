
import { useState, useEffect } from "react";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { ModernAuthForm } from "@/components/auth/ModernAuthForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/services/adminQueries";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session lekérési hiba:', error);
          if (mounted) {
            setLoading(false);
            setAuthChecked(true);
          }
          return;
        }

        const currentUser = session?.user ?? null;
        
        if (mounted) {
          setUser(currentUser);
        }
        
        // Check admin status only if user exists
        if (currentUser && mounted) {
          try {
            const adminStatus = await checkIsAdmin(currentUser.id);
            if (mounted) {
              setIsAdmin(adminStatus);
            }
          } catch (error) {
            console.error('Admin státusz ellenőrzési hiba:', error);
            if (mounted) {
              setIsAdmin(false);
            }
          }
        } else if (mounted) {
          setIsAdmin(false);
        }
        
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      } catch (error) {
        console.error('Auth inicializálási hiba:', error);
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth állapot változás:', event, session?.user?.email);
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const adminStatus = await checkIsAdmin(currentUser.id);
          if (mounted) {
            setIsAdmin(adminStatus);
          }
        } catch (error) {
          console.error('Admin státusz ellenőrzési hiba:', error);
          if (mounted) {
            setIsAdmin(false);
          }
        }
      } else {
        if (mounted) {
          setIsAdmin(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      // A state automatikusan frissül az onAuthStateChange miatt
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
      // Force logout even if there's an error
      setUser(null);
      setIsAdmin(false);
    }
  };

  // Show loading only while checking auth status
  if (loading || !authChecked) {
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
        onBackToApp={() => {}} // Adminoknak nincs "vissza" opció
      />
    );
  }

  // Ha normál user, az ételtervező alkalmazást mutassuk
  return (
    <FoodPlannerApp
      user={userProfile}
      onLogout={handleLogout}
    />
  );
};

export default Index;
