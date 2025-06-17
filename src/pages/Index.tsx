
import { useState, useEffect } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { FoodPlannerApp } from "@/components/food-planner/FoodPlannerApp";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface Session {
  sessionId: string;
  userId: string;
  user: User;
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Check for existing session on page load
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        try {
          const session: Session = JSON.parse(sessionData);
          if (session.user && session.sessionId) {
            setUser(session.user);
            setIsAuthenticated(true);
            console.log('✅ Session restored for user:', session.user.email);
          }
        } catch (error) {
          console.error('Session parsing error:', error);
          localStorage.removeItem('userSession');
        }
      }
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const handleLoginSuccess = (sessionData: Session) => {
    console.log('🔑 Login successful, setting user data:', sessionData.user.email);
    setUser(sessionData.user);
    setIsAuthenticated(true);
    
    // Store session in localStorage
    localStorage.setItem('userSession', JSON.stringify(sessionData));
    
    toast({
      title: "Sikeres bejelentkezés!",
      description: `Üdvözöljük, ${sessionData.user.fullName}!`,
    });
  };

  const handleLogout = () => {
    console.log('🚪 Logging out user:', user?.email);
    localStorage.removeItem('userSession');
    setUser(null);
    setIsAuthenticated(false);
    
    toast({
      title: "Sikeres kijelentkezés!",
      description: "Viszlát!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <FoodPlannerApp user={user!} onLogout={handleLogout} />;
};

export default Index;
