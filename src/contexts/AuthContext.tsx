import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "customer" | "restaurant" | "admin" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: any | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Load base auth + user profile safely
   * ❌ No admin queries here
   */
  const loadUserData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn("Session error:", sessionError.message);
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      /**
       * Fetch role + profile in parallel
       * Both MUST be RLS-safe
       */
      const [roleRes, profileRes] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle(),
        supabase.from("profiles").select("*").maybeSingle(),
      ]);

      if (roleRes.error) {
        console.warn("Role fetch skipped:", roleRes.error.message);
      }

      if (profileRes.error) {
        console.warn("Profile fetch skipped:", profileRes.error.message);
      }

      setRole((roleRes.data?.role as UserRole) ?? "customer");
      setProfile(profileRes.data ?? null);
    } catch (err) {
      console.error("Auth bootstrap failed:", err);
      setSession(null);
      setUser(null);
      setRole(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial load + auth state changes
   */
  useEffect(() => {
    loadUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  /**
   * Auth actions
   */
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      },
    });

    if (error || !data.user) {
      return { error: error as Error };
    }

    const userId = data.user.id;

    // 1️⃣ profile
    await supabase.from("profiles").insert({
      id: userId,
      full_name: fullName,
      phone,
    });

    // 2️⃣ role
    await supabase.from("user_roles").insert({
      user_id: userId,
      role,
    });

    // 3️⃣ restaurant
    if (role === "restaurant") {
      await supabase.from("restaurants").insert({
        owner_id: userId,
        name: fullName + "'s Restaurant",
        status: "pending",
      });
    }

    return { error: null };
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
    setRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refresh: loadUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
