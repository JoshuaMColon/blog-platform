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

// The session lives here so every page reads the same user. I restore what
// supabase-js stored locally, then keep it current from onAuthStateChange
// (sign-in, sign-out, token refresh, including another tab). `loading` stays
// true until that first read resolves, so a refresh doesn't look logged out.
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // getSession() reads the stored session. It does not ask Auth to
    // re-check the token; the listener below is what tracks a real change.
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

  // Drops this browser's session. The listener above clears `user`, and the
  // route guards send them back to /login.
  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out!')
  };

  // Anonymous auth, not a shared demo password. Each visitor gets their own
  // auth.users row, and the hourly cleanup deletes it after a day.
  const signInAsGuest = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      toast.success('Welcome! You are exploring as a guest.');
      return { error: null };
    }
    const msg = error.message.toLowerCase();
    // The code is the stable check. The message match covers the wording
    // Supabase returns when anonymous sign-ins are simply switched off.
    if (error.code === 'anonymous_provider_disabled' || msg.includes('anonymous') && (msg.includes('disabled') || msg.includes('not enabled'))) {
      return { error: DEMO_DISABLED_MESSAGE };
    }
    return { error: `Couldn't start the demo: ${error.message}` };
  };

  // user.is_anonymous is set by signInAnonymously(). The badge and the
  // guest textarea limits read it. The database reads the same claim off
  // the JWT in is_demo_user(), so hiding the badge doesn't lift the caps.
  const isDemo = Boolean(user?.is_anonymous);

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemo, signOut, signInAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};
