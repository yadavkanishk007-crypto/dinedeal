import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "customer" | "restaurant" | "admin";
type DbRole = "customer" | "restaurant" | "admin";
const toDbRole = (role: UserRole): DbRole => role;

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
   * SINGLE SOURCE OF TRUTH BOOTSTRAP
   */
  const loadUserData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user);

      const userId = session.user.id;

      /**
       * Fetch profile + role (safe & scoped)
       */
      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      /**
       * IMPORTANT:
       * Do NOT force signout if DB rows are missing.
       * This can happen during signup or migrations.
       */
      setProfile(profileData ?? null);
      setRole((roleData?.role as UserRole) ?? null);

    } catch (err) {
      console.error("Auth bootstrap error:", err);
      // Fail-safe reset (NO signOut)
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initial load + auth listener
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
   * SIGN UP (SAFE, LINEAR)
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
        data: { full_name: fullName },
      },
    });

    if (error || !data.user) {
      return { error: error as Error };
    }

    const userId = data.user.id;

    try {
      // Insert profile
      await supabase.from("profiles").insert({
        user_id: userId,
        full_name: fullName,
        phone,
      });

      // Insert role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: toDbRole(role),
      });

      // TEMP: frontend restaurant creation (move later)
      if (role === "restaurant") {
        await supabase.from("restaurants").insert({
          owner_id: userId,
          name: `${fullName}'s Restaurant`,
          city: "Jhansi",
          address: "TBD",
          cuisine: "Multi-Cuisine",
          is_approved: false,
          is_active: true,
        });
      }

      // Soft refresh (NO race)
      await loadUserData();

      return { error: null };
    } catch (err) {
      console.error("Signup DB error:", err);
      return { error: err as Error };
    }
  };

  /**
   * SIGN IN
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  /**
   * SIGN OUT (ONLY EXPLICIT)
   */
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
