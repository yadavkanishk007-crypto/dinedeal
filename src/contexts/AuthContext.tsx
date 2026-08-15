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

export type UserRole = "customer" | "restaurant" | "admin" | "super_admin" | "event_organiser" | "activity_provider"; 
type DbRole = "customer" | "restaurant" | "admin" | "event_organiser" | "activity_provider";

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
    agreedToTerms?: boolean,
    consentLang?: string,
    noticeVersion?: string
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

    // Retrieve consent values from user metadata or fallback to localStorage (for Google OAuth signup)
    const savedAgreed = localStorage.getItem("signup_agreed_to_terms") === "true";
    const savedLang = localStorage.getItem("signup_consent_lang") || "en";
    const savedVersion = localStorage.getItem("signup_notice_version") || "v1.0-dpdp";
    const savedUserAgent = localStorage.getItem("signup_user_agent") || (typeof window !== "undefined" ? window.navigator.userAgent : null);

    const agreedVal = meta.agreed_to_terms ?? savedAgreed ?? false;
    const langVal = meta.consent_lang ?? savedLang ?? "en";
    const versionVal = meta.notice_version ?? savedVersion ?? "v1.0-dpdp";
    const userAgentVal = meta.user_agent ?? savedUserAgent ?? null;

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
        agreed_to_terms: agreedVal,
      });
      if (error) throw error;

      // Log consent in the separate audit table
      if (agreedVal) {
        try {
          await supabase.from("user_consent_logs").insert({
            user_id: userId,
            consent_type: "terms_and_privacy",
            is_granted: true,
            notice_version: versionVal,
            language: langVal,
            user_agent: userAgentVal,
          });
        } catch (consentErr) {
          console.error("Failed to log DPDP consent:", consentErr);
        }
      }
    }

    /* ROLE */
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    // Support OAuth signups by checking localStorage for a saved role
    const savedSignupRole = localStorage.getItem("signup_role") as UserRole | null;
    const finalSignupRole = signupRole || savedSignupRole;

    // MED-1 FIX: Only allow safe roles during self-service signup.
    // Admin/super_admin can ONLY be assigned via the database directly.
    const SAFE_SIGNUP_ROLES: string[] = ["customer", "restaurant", "event_organiser", "activity_provider"];
    const safeRole = (finalSignupRole && SAFE_SIGNUP_ROLES.includes(finalSignupRole))
      ? finalSignupRole
      : "customer";

    if (!roleRow) {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: toDbRole(safeRole),
      });
      if (error) throw error;
      
      // Clear it after successful insertion
      if (savedSignupRole) {
        localStorage.removeItem("signup_role");
      }
      if (localStorage.getItem("signup_agreed_to_terms")) {
        localStorage.removeItem("signup_agreed_to_terms");
        localStorage.removeItem("signup_consent_lang");
        localStorage.removeItem("signup_notice_version");
        localStorage.removeItem("signup_user_agent");
      }
    }

    const effectiveRole =
      roleRow?.role ?? toDbRole(finalSignupRole || "customer");

    /* RESTAURANT / ACTIVITY PROVIDER BOOTSTRAP */
    // Note: event_organiser row is NOT created here. 
    // It is created manually in EventOrganiserOnboarding.tsx.
    if (effectiveRole === "restaurant" || effectiveRole === "activity_provider") {
      const { data: restaurantRow } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (!restaurantRow) {
        const isActivity = effectiveRole === "activity_provider";

        const { error } = await supabase.from("restaurants").insert({
          owner_id: userId,
          name: `${meta.full_name || (isActivity ? "Activity Center" : "Restaurant")}`,
          city: "Jhansi",
          address: "TBD",
          cuisine: isActivity ? "Activity" : "Multi-Cuisine",
          is_approved: false,
          is_active: true,
          bank_account_number: null,
          bank_account_holder: null,
          upi_id: null,
          organiser_type: isActivity ? "activity_provider" : null,
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

      /* BUSINESS ENTITY + ONBOARDING CHECK */
      let restaurantRow = null;
      let onboarding = false;

      // Both Restaurant, Event Organiser, and Activity Provider roles look for a row in the 'restaurants' table.
      if (userRole === "restaurant" || userRole === "event_organiser" || userRole === "activity_provider") {
        const { data } = await supabase
          .from("restaurants")
          .select("*")
          .eq("owner_id", userId)
          .maybeSingle();

        restaurantRow = data;

        if (!restaurantRow) {
          // If no row exists, we MUST onboard.
          onboarding = true;
        } else if (userRole === "restaurant" || userRole === "activity_provider") {
          // Additional verification for Dining and Activity partners (checking payment details).
          const bank = clean(restaurantRow.bank_account_number);
          const upi = clean(restaurantRow.upi_id);
          const holder = clean(restaurantRow.bank_account_holder);

          if ((!bank && !upi) || !holder) {
            onboarding = true;
          }
        }
        // Event organisers are considered "onboarded" as soon as their restaurant row is created.
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
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Redirect the user to the reset password page if they clicked a recovery link
        window.location.href = "/reset-password";
      }

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
    agreedToTerms?: boolean,
    consentLang?: string,
    noticeVersion?: string
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
          consent_lang: consentLang,
          notice_version: noticeVersion,
          user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null,
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
    setRole(null);
    setProfile(null);
    setRestaurant(null);
    setNeedsRestaurantOnboarding(false);
  };

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
