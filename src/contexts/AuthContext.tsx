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

/* =======================
   ROLE DEFINITIONS
======================= */

export type UserRole = "customer" | "restaurant" | "admin" | "super_admin" | "event_organiser" ; 
type DbRole = "customer" | "restaurant" | "admin" | "event_organiser" ;

/* =======================
   CONTEXT SHAPE
======================= */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  profile: any | null;
  restaurant: any | null;
  needsRestaurantOnboarding: boolean;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string,
    agreedToTerms?: boolean
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =======================
   HELPERS
======================= */

const toDbRole = (role: UserRole): DbRole =>
  role === "super_admin" ? "admin" : role;

const clean = (v: unknown) =>
  typeof v === "string" ? v.trim() : "";

/* =======================
   PROVIDER
======================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [needsRestaurantOnboarding, setNeedsRestaurantOnboarding] =
    useState(false);
  const [loading, setLoading] = useState(true);

  /* =======================
      POST-CONFIRMATION BOOTSTRAP
  ======================= */

  const bootstrapUser = useCallback(async (session: Session) => {
    

    const user = session.user;
    const userId = user.id;
    const meta = user.user_metadata || {};
    const signupRole = meta.signup_role as UserRole | undefined;

    /* PROFILE */
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profileRow) {
      const { error } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: meta.full_name ?? "",
        phone: meta.phone ?? null,
      });
      if (error) throw error;
    }

    /* ROLE */
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!roleRow && signupRole) {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: toDbRole(signupRole),
      });
      if (error) throw error;
    }

    const effectiveRole =
      roleRow?.role ?? (signupRole ? toDbRole(signupRole) : "customer");

    /* RESTAURANT */
    if (effectiveRole === "restaurant") {
      const { data: restaurantRow } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (!restaurantRow) {
        const { error } = await supabase.from("restaurants").insert({
          owner_id: userId,
          name: `${meta.full_name || "Restaurant"}`,
          city: "Jhansi",
          address: "TBD",
          cuisine: "Multi-Cuisine",
          is_approved: false,
          is_active: true,
          bank_account_number: null,
          bank_account_holder: null,
          upi_id: null,
        });
        if (error) throw error;
      }
    }
  }, []);

  /* =======================
      LOAD USER DATA
  ======================= */

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
        setRestaurant(null);
        setNeedsRestaurantOnboarding(false);
        return;
      }

      setSession(session);
      setUser(session.user);

      await bootstrapUser(session);

      const userId = session.user.id;

      const [{ data: profileRow }, { data: roleRow }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      ]);

     

      const userRole = (roleRow?.role as UserRole) ?? "customer";
      setProfile(profileRow ?? null);
      setRole(userRole);

      /* RESTAURANT + ONBOARDING CHECK */
      let restaurantRow = null;
      let onboarding = false;

      if (userRole === "restaurant") {
        const { data } = await supabase
          .from("restaurants")
          .select("*")
          .eq("owner_id", userId)
          .maybeSingle();

        restaurantRow = data;

       
        if (restaurantRow) {
          const bank = clean(restaurantRow.bank_account_number);
          const upi = clean(restaurantRow.upi_id);
          const holder = clean(restaurantRow.bank_account_holder);

          const hasBank = bank.length > 0;
          const hasUpi = upi.length > 0;
          const hasHolder = holder.length > 0;

          if ((!hasBank && !hasUpi) || !hasHolder) {
            onboarding = true;
          }
        }
      }

      

      setRestaurant(restaurantRow);
      setNeedsRestaurantOnboarding(onboarding);
    } catch (err) {
      console.error("AUTH ERROR:", err);
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setRestaurant(null);
      setNeedsRestaurantOnboarding(false);
    } finally {
      setLoading(false);
    }
  }, [bootstrapUser]);

  /* =======================
      AUTH LISTENER
  ======================= */

  useEffect(() => {
    loadUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserData();
      } else {
        setUser(null);
        setSession(null);
        setRole(null);
        setProfile(null);
        setRestaurant(null);
        setNeedsRestaurantOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  /* =======================
      AUTH ACTIONS
  ======================= */

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string,
    agreedToTerms?: boolean
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          signup_role: role,
          agreed_to_terms: agreedToTerms,
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
    setSession(session); // Keep session logic consistent with original
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setRestaurant(null);
    setNeedsRestaurantOnboarding(false);
  };

  /* =======================
      PROVIDER
  ======================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        profile,
        restaurant,
        needsRestaurantOnboarding,
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
