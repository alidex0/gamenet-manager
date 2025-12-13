import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface GameCenter {
  id: string;
  name: string;
  owner_id: string;
  address?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: 'admin' | 'staff' | 'customer' | null;
  gameCenter: GameCenter | null;
  signUp: (email: string, password: string, fullName: string, gameCenterName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isStaffOrAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | 'customer' | null>(null);
  const [gameCenter, setGameCenter] = useState<GameCenter | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setGameCenter(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user role with game_center_id
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, game_center_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return;
      }

      if (roleData) {
        setUserRole(roleData.role as 'admin' | 'staff' | 'customer');
        
        // Fetch game center info
        if (roleData.game_center_id) {
          const { data: gcData, error: gcError } = await supabase
            .from('game_centers')
            .select('*')
            .eq('id', roleData.game_center_id)
            .maybeSingle();

          if (gcError) {
            console.error('Error fetching game center:', gcError);
          } else if (gcData) {
            setGameCenter(gcData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, gameCenterName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          game_center_name: gameCenterName || 'گیم نت من',
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setGameCenter(null);
  };

  const isStaffOrAdmin = userRole === 'admin' || userRole === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        gameCenter,
        signUp,
        signIn,
        signOut,
        isStaffOrAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
