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

/**
 * Frontend roles (business logic)
 */
export type UserRole = "customer" | "restaurant" | "admin" | "super_admin";

/**
 * DB roles (Supabase enum)
 */
type DbRole = "customer" | "restaurant" | "admin";

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

/**
 * Map frontend role → DB-safe role
 */
const toDbRole = (role: UserRole): DbRole =>
  role === "super_admin" ? "admin" : role;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * POST-CONFIRMATION BOOTSTRAP
   * Runs after login / magic link confirmation
   * Safe, idempotent, RLS-compliant
   */
  const bootstrapUser = useCallback(
    async (session: Session) => {
      const user = session.user;
      const userId = user.id;
      const meta = user.user_metadata || {};

      const signupRole = meta.signup_role as UserRole | undefined;

      // 1️⃣ Profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: userId,
          full_name: meta.full_name ?? "",
          phone: meta.phone ?? null,
        });
      }

      // 2️⃣ Role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingRole && signupRole) {
        await supabase.from("user_roles").insert({
          user_id: userId,
          role: toDbRole(signupRole),
        });
      }

      // 3️⃣ Restaurant
      if (signupRole === "restaurant") {
        const { data: existingRestaurant } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", userId)
          .maybeSingle();

        if (!existingRestaurant) {
          await supabase.from("restaurants").insert({
            owner_id: userId,
            name: `${meta.full_name}'s Restaurant`,
            city: "Jhansi",
            address: "TBD",
            cuisine: "Multi-Cuisine",
            is_approved: false,
            is_active: true,
          });
        }
      }
    },
    []
  );

  /**
   * SINGLE SOURCE OF TRUTH
   */
  const loadUserData = useCallback(async () => {
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session.user);

      // 🔑 Ensure DB is bootstrapped AFTER confirmation
      await bootstrapUser(session);

      const userId = session.user.id;

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

      setProfile(profileData ?? null);
      setRole((roleData?.role as UserRole) ?? "customer");
    } catch (err) {
      console.error("Auth bootstrap error:", err);
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [bootstrapUser]);

  /**
   * Init + Auth listener
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
   * SIGN UP (EMAIL CONFIRMATION SAFE)
   * Only stores intent
   */
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          signup_role: role,
        },
      },
    });

    return { error: error as Error | null };
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
   * SIGN OUT
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
