
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

  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Felhasználó bejelentkezett:', { 
          email: session.user.email, 
          userId: session.user.id 
        });
        
        const userProfile = await fetchUserProfile(session.user.id);
        
        if (userProfile) {
          const userData = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: userProfile.full_name || session.user.email || 'Ismeretlen felhasználó'
          };
          
          // Ellenőrizzük, hogy admin-e a felhasználó
          try {
            const isAdmin = await checkIsAdmin(session.user.id);
            console.log('🔍 Admin státusz ellenőrzés:', { userId: session.user.id, isAdmin });
            
            if (isAdmin) {
              console.log('👑 Admin felhasználó bejelentkezve - admin felületre irányítás');
              setUser(userData);
              setIsAdmin(true);
              setCurrentPage('admin');
              setLoading(false);
              return;
            }
          } catch (error) {
            console.error('Admin státusz ellenőrzési hiba:', error);
          }
          
          // Normál felhasználó esetén ellenőrizzük a preferenciákat
          const hasPrefs = await checkUserHasPreferences(session.user.id);
          console.log('🍽️ Preferenciák ellenőrzés:', { userId: session.user.id, hasPrefs });
          
          setUser(userData);
          setIsAdmin(false);
          
          if (!hasPrefs) {
            console.log('⚙️ Nincsenek preferenciák - beállítási felületre irányítás');
            setCurrentPage('preferences');
          } else {
            console.log('✅ Preferenciák megvannak - fő alkalmazásra irányítás');
            setCurrentPage('main');
          }
        } else {
          console.log('❌ Nincs felhasználói profil - kijelentkeztetés');
          await supabase.auth.signOut();
          setUser(null);
          setCurrentPage('auth');
        }
      } else {
        console.log('❌ Nincs aktív session');
        setUser(null);
        setCurrentPage('auth');
      }
      
      setLoading(false);
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth státusz változás:', { event, userId: session?.user?.id });
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 Felhasználó kijelentkezve');
        setUser(null);
        setIsAdmin(false);
        setCurrentPage('auth');
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Felhasználó bejelentkezett:', { 
          email: session.user.email, 
          userId: session.user.id 
        });
        await checkAuthStatus();
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogin = async () => {
    console.log('🔑 Új bejelentkezés érzékelve - státusz frissítése');
    setLoading(true);
    await supabase.auth.refreshSession();
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
      setUser(null);
      setIsAdmin(false);
      setCurrentPage('auth');
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
    } finally {
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
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
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
