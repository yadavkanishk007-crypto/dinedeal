console.log("AUTH PAGE VERSION: 2026-01-28");
import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  MapPin,
  User,
  Store,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Added event_organiser to the role type
type AuthMode = "signin" | "signup" | "forgot-password";
type UserRole = "customer" | "restaurant" | "admin" | "event_organiser";

const Auth = () => {
  const { signUp, signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const detect = async () => {
      setIsLocating(true);
      try {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
            );
            const data = await res.json();
            setLocation(
              data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                "Jhansi"
            );
            setIsLocating(false);
          },
          () => setIsLocating(false)
        );
      } catch {
        setIsLocating(false);
      }
    };
    detect();
  }, []);

  /* =========================
     🔐 IMMEDIATE REDIRECT GUARD
     ========================= */
  if (!loading && !isLoading && user && role) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    // Both restaurant and event_organiser go to the dashboard; 
    // The dashboard handles their specific onboarding redirects.
    if (role === "restaurant" || role === "event_organiser") {
      return <Navigate to="/restaurant-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const handleResetEmail = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Email sent", description: "Check your inbox for reset link" });
    setMode("signin");
  };

  const handleGoogleSignIn = async () => {
    // Show a quirky popup for non-customers trying to sign up with Google
    if (mode === "signup" && selectedRole !== "customer") {
      toast({
        title: "VIP Customers Only! 🎩",
        description: "Hold your horses, chef! 👨‍🍳 Google sign-up is currently for our diners. Partners, please use the good ol' fashioned email form below. ✨",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    // Since Google signup won't pass through our normal signup function,
    // we save the selected role so we can use it during bootstrapping later
    if (mode === "signup") {
      localStorage.setItem("signup_role", selectedRole);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast({ title: "Google Auth Failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName, selectedRole, phone);
        if (error) throw error;
        toast({ title: "Account created", description: "Signing you in…" });
      }
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: "Welcome", description: "Signing you in…" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container py-6 flex items-center justify-between">
        <button onClick={() => navigate("/")}><ArrowLeft /></button>
        <Logo />
        <div />
      </header>

      <main className="container max-w-md mx-auto py-8 flex-1">
        <AnimatePresence mode="wait">
          {mode === "forgot-password" ? (
            <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <h1 className="text-3xl font-bold text-center">Forgot Password</h1>
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={handleResetEmail} disabled={isLoading}>
                {isLoading ? "Sending…" : "Send reset link"}
              </Button>
              <button className="text-sm text-primary underline block mx-auto" onClick={() => setMode("signin")}>
                Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.form key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-5">
              <h1 className="text-3xl font-bold text-center">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>

              <div className="flex justify-center text-sm text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                {isLocating ? "Detecting…" : location}
              </div>

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">I want to sign up as:</p>
                    <div className="grid grid-cols-3 gap-2"> {/* Responsive 3-column grid */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("customer")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          selectedRole === "customer" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                        )}
                      >
                        <User className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("restaurant")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          selectedRole === "restaurant" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                        )}
                      >
                        <Store className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Dine-in</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("event_organiser")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                          selectedRole === "event_organiser" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                        )}
                      >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Events</span>
                      </button>
                    </div>
                  </div>

                  <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </>
              )}

              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {mode === "signin" && (
                <button type="button" onClick={() => setMode("forgot-password")} className="text-sm text-primary underline text-right block">
                  Forgot password?
                </button>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <p className="text-center text-[10px] text-muted-foreground/80 font-medium">
                  * Google authentication is currently available for customers only
                </p>
              </div>

              <p className="text-center text-sm">
                {mode === "signin" ? (
                  <>No account? <button className="text-primary underline" onClick={() => setMode("signup")}>Sign up</button></>
                ) : (
                  <>Already have an account? <button className="text-primary underline" onClick={() => setMode("signin")}>Sign in</button></>
                )}
              </p>

              <Link to="/admin/login" className="text-xs text-muted-foreground flex justify-center gap-1">
                <Shield className="w-3 h-3" /> Admin Login
              </Link>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Auth;
