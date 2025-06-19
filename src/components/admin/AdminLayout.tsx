
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserCog, ArrowLeft, Shield } from 'lucide-react';
import { checkIsAdmin } from '@/services/adminQueries';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
  onBackToApp: () => void;
  children: React.ReactNode;
  activeTab: 'users' | 'roles';
  onTabChange: (tab: 'users' | 'roles') => void;
}

export function AdminLayout({ user, onLogout, onBackToApp, children, activeTab, onTabChange }: AdminLayoutProps) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        console.log('🔍 Admin státusz ellenőrzése:', { userId: user.id });
        const adminStatus = await checkIsAdmin(user.id);
        console.log('✅ Admin státusz eredmény:', { adminStatus });
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('Admin státusz ellenőrzési hiba:', error);
        setIsAdmin(false);
        toast({
          title: "Hiba",
          description: "Nem sikerült ellenőrizni az admin jogosultságokat.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user.id, toast]);

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error('Kijelentkezési hiba az admin felületen:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült kijelentkezni.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Jogosultságok ellenőrzése...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-4">Hozzáférés megtagadva</h1>
          <p className="text-gray-300 mb-6">
            Nincs admin jogosultságod ehhez a felülethez.
          </p>
          <Button onClick={onBackToApp} variant="outline" className="text-white border-white/30 hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza az alkalmazásba
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBackToApp}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Vissza
            </Button>
            <div className="text-white">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                Admin Felület
              </h1>
              <p className="text-sm opacity-80">Felhasználók és jogosultságok kezelése</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-white text-right">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs opacity-70">Administrator</p>
            </div>
            <Avatar className="w-8 h-8 border border-white/30">
              <AvatarImage src={undefined} alt="Admin" />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm font-bold">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/10"
            >
              Kijelentkezés
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex space-x-1">
            <Button
              onClick={() => onTabChange('users')}
              variant={activeTab === 'users' ? 'secondary' : 'ghost'}
              className={`rounded-none border-b-2 ${
                activeTab === 'users' 
                  ? 'border-purple-400 bg-white/10 text-white' 
                  : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Felhasználók
            </Button>
            <Button
              onClick={() => onTabChange('roles')}
              variant={activeTab === 'roles' ? 'secondary' : 'ghost'}
              className={`rounded-none border-b-2 ${
                activeTab === 'roles' 
                  ? 'border-purple-400 bg-white/10 text-white' 
                  : 'border-transparent text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCog className="w-4 h-4 mr-2" />
              Szerepkörök
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
