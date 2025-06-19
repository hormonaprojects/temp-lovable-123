
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ModernAuthForm } from '../auth/ModernAuthForm';
import { AdminDashboard } from '../admin/AdminDashboard';
import { fetchUserProfile } from '@/services/profileQueries';
import { checkIsAdmin } from '@/services/adminQueries';

interface User {
  id: string;
  email: string;
  fullName: string;
}

export function FoodPlannerApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<'auth' | 'main' | 'admin'>('auth');
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const processUserSession = async (authUser: any) => {
      try {
        console.log('👤 Felhasználó feldolgozása:', { email: authUser.email, id: authUser.id });
        
        // Alapértelmezett user adatok
        const userData = {
          id: authUser.id,
          email: authUser.email || '',
          fullName: authUser.email || 'Ismeretlen felhasználó'
        };

        // Profil betöltése (opcionális)
        try {
          const userProfile = await fetchUserProfile(authUser.id);
          if (userProfile?.full_name) {
            userData.fullName = userProfile.full_name;
          }
        } catch (error) {
          console.log('⚠️ Profil betöltési hiba (folytatjuk alapértelmezett adatokkal):', error);
        }

        if (!mounted) return;

        // Admin ellenőrzés
        try {
          const adminStatus = await checkIsAdmin(authUser.id);
          console.log('🔍 Admin státusz:', { userId: authUser.id, isAdmin: adminStatus });
          
          if (!mounted) return;
          
          setUser(userData);
          setIsAdmin(adminStatus);
          setCurrentPage(adminStatus ? 'admin' : 'main');
        } catch (error) {
          console.error('Admin státusz ellenőrzési hiba:', error);
          if (mounted) {
            setUser(userData);
            setIsAdmin(false);
            setCurrentPage('main');
          }
        }
      } catch (error) {
        console.error('Felhasználó session feldolgozási hiba:', error);
        if (mounted) {
          // Hiba esetén is beállítjuk a felhasználót
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            fullName: authUser.email || 'Ismeretlen felhasználó'
          });
          setIsAdmin(false);
          setCurrentPage('main');
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

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
            setInitialized(true);
          }
        }
      } catch (error) {
        console.error('Auth inicializálási hiba:', error);
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setCurrentPage('auth');
          setLoading(false);
          setInitialized(true);
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
        setInitialized(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Felhasználó bejelentkezett:', { 
          email: session.user.email, 
          userId: session.user.id 
        });
        setLoading(true);
        await processUserSession(session.user);
      }
    });

    // Inicializálás indítása
    initializeAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    console.log('🔑 Új bejelentkezés érzékelve');
    // Az onAuthStateChange automatikusan kezeli
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

  // Ha még nem inicializálódott, betöltő képernyő
  if (!initialized || loading) {
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
