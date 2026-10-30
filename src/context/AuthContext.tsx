import type { Session, User } from "@supabase/supabase-js";
import { createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  signInAsGuest: () => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isDemo: false,
  signOut: async () => {},
  signInAsGuest: async () => ({ error: null }),
});

export const DEMO_DISABLED_MESSAGE =
  "The guest demo isn't switched on yet. Please check back soon, or create a free account in a few seconds.";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out!')
  };

  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      toast.success('Welcome! You are exploring as a guest.');
      return { error: null };
    }
    const msg = error.message.toLowerCase();
    if (error.code === 'anonymous_provider_disabled' || msg.includes('anonymous') && (msg.includes('disabled') || msg.includes('not enabled'))) {
      return { error: DEMO_DISABLED_MESSAGE };
    }
    return { error: `Couldn't start the demo: ${error.message}` };
  };

  const isDemo = Boolean(user?.is_anonymous);

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
