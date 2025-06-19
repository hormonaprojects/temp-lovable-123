
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ModernAuthForm } from '../auth/ModernAuthForm';
import { AdminDashboard } from '../admin/AdminDashboard';
import { fetchUserProfile } from '@/services/profileQueries';
import { checkUserHasPreferences } from '@/services/foodPreferencesQueries';
import { checkIsAdmin } from '@/services/adminQueries';

interface User {
  id: string;
  email: string;
  fullName: string;
}

export function FoodPlannerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'auth' | 'preferences' | 'main' | 'admin'>('auth');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Auth inicializálása...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          console.log('✅ Session található:', { 
            email: session.user.email, 
            userId: session.user.id 
          });
          
          await processUserSession(session.user);
        } else {
          console.log('❌ Nincs aktív session');
          if (mounted) {
            setUser(null);
            setIsAdmin(false);
            setCurrentPage('auth');
            setLoading(false);
            setAuthChecked(true);
          }
        }
      } catch (error) {
        console.error('Auth inicializálási hiba:', error);
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    const processUserSession = async (authUser: any) => {
      try {
        const userProfile = await fetchUserProfile(authUser.id);
        
        if (!mounted) return;
        
        if (userProfile) {
          const userData = {
            id: authUser.id,
            email: authUser.email || '',
            fullName: userProfile.full_name || authUser.email || 'Ismeretlen felhasználó'
          };
          
          // Admin ellenőrzés
          try {
            const adminStatus = await checkIsAdmin(authUser.id);
            console.log('🔍 Admin státusz:', { userId: authUser.id, isAdmin: adminStatus });
            
            if (!mounted) return;
            
            if (adminStatus) {
              console.log('👑 Admin felhasználó - admin felületre irányítás');
              setUser(userData);
              setIsAdmin(true);
              setCurrentPage('admin');
              setLoading(false);
              setAuthChecked(true);
              return;
            }
          } catch (error) {
            console.error('Admin státusz ellenőrzési hiba:', error);
          }
          
          // Normál felhasználó esetén
          console.log('👤 Normál felhasználó - fő alkalmazásra irányítás');
          if (mounted) {
            setUser(userData);
            setIsAdmin(false);
            setCurrentPage('main');
            setLoading(false);
            setAuthChecked(true);
          }
        } else {
          console.log('❌ Nincs felhasználói profil - kijelentkeztetés');
          await supabase.auth.signOut();
          if (mounted) {
            setUser(null);
            setCurrentPage('auth');
            setLoading(false);
            setAuthChecked(true);
          }
        }
      } catch (error) {
        console.error('Felhasználó session feldolgozási hiba:', error);
        if (mounted) {
          setLoading(false);
          setAuthChecked(true);
        }
      }
    };

    // Auth listener beállítása
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth státusz változás:', { event, userId: session?.user?.id });
      
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 Felhasználó kijelentkezve');
        setUser(null);
        setIsAdmin(false);
        setCurrentPage('auth');
        setLoading(false);
        setAuthChecked(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Felhasználó bejelentkezett:', { 
          email: session.user.email, 
          userId: session.user.id 
        });
        setLoading(true);
        await processUserSession(session.user);
      }
    });

    // Inicializálás
    if (!authChecked) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [authChecked]);

  const handleLogin = async () => {
    console.log('🔑 Új bejelentkezés érzékelve');
    setLoading(true);
    setAuthChecked(false);
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Kijelentkezés...');
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Kijelentkezési hiba:', error);
        throw error;
      }
      
      console.log('✅ Sikeres kijelentkezés');
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
      // Még hiba esetén is próbáljuk visszaállítani az állapotot
      setUser(null);
      setIsAdmin(false);
      setCurrentPage('auth');
      setLoading(false);
    }
  };

  const handleBackToApp = () => {
    console.log('📱 Vissza az alkalmazásba...');
    setCurrentPage('main');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Betöltés...</p>
        </div>
      </div>
    );
  }

  switch (currentPage) {
    case 'auth':
      return <ModernAuthForm onSuccess={handleLogin} />;
    case 'preferences':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Preferenciák beállítása</h2>
            <p className="mb-4">Kérjük állítsd be az étkezési preferenciáidat a folytatáshoz.</p>
            <button 
              onClick={() => setCurrentPage('main')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Folytatás beállítások nélkül
            </button>
          </div>
        </div>
      );
    case 'main':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Fő alkalmazás</h2>
            <p className="mb-4">Üdvözlünk, {user?.fullName}!</p>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Kijelentkezés
            </button>
          </div>
        </div>
      );
    case 'admin':
      return <AdminDashboard user={user!} onLogout={handleLogout} onBackToApp={handleBackToApp} />;
    default:
      return <div>Ismeretlen állapot.</div>;
  }
}
