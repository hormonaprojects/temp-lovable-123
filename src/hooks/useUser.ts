
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  fullName: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock user data for now
    const mockUser = {
      id: '1',
      email: 'user@example.com',
      fullName: 'Test User'
    };
    
    setUser(mockUser);
    setIsLoading(false);
  }, []);

  return { user, isLoading };
}
