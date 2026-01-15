console.log("AUTH PAGE VERSION: 2026-01-11");
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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup" | "forgot-password";
type UserRole = "customer" | "restaurant" | "admin";

const Auth = () => {
  const { signUp, signIn, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  /* =========================
     LOCAL STATE (MOVED UP)
     ========================= */
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

  /* =========================
     LOCATION (MOVED UP)
     ========================= */
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
          () => {
            setIsLocating(false);
          }
        );
      } catch {
        setIsLocating(false);
      }
    };

    detect();
  }, []);

  /* =========================
     🔐 IMMEDIATE REDIRECT GUARD
     (MOVED AFTER ALL HOOKS)
     ========================= */
  if (!loading && user && role) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "restaurant") {
      return <Navigate to="/restaurant-dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  /* =========================
     PASSWORD RESET
     ========================= */
  const handleResetEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Email sent",
      description: "Check your inbox for reset link",
    });

    setMode("signin");
  };

  /* =========================
     SUBMIT HANDLER
     ========================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(
          email,
          password,
          fullName,
          selectedRole,
          phone
        );

        if (error) throw error;

        toast({
          title: "Account created",
          description: "Signing you in…",
        });
      }

      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;

        toast({
          title: "Welcome",
          description: "Signing you in…",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-screen flex flex-col">
      <header className="container py-6 flex items-center justify-between">
        <button onClick={() => navigate("/")}>
          <ArrowLeft />
        </button>
        <Logo />
        <div />
      </header>

      <main className="container max-w-md mx-auto py-8 flex-1">
        <AnimatePresence mode="wait">
          {mode === "forgot-password" ? (
            <motion.div
              key="forgot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold text-center">Forgot Password</h1>

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                className="w-full"
                onClick={handleResetEmail}
                disabled={isLoading}
              >
                {isLoading ? "Sending…" : "Send reset link"}
              </Button>

              <button
                className="text-sm text-primary underline block mx-auto"
                onClick={() => setMode("signin")}
              >
                Back to sign in
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <h1 className="text-3xl font-bold text-center">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>

              <div className="flex justify-center text-sm text-muted-foreground">
                <MapPin className="w-3 h-3 mr-1" />
                {isLocating ? "Detecting…" : location}
              </div>

              {mode === "signup" && (
                <>
                  {/* Role Selector */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">I want to sign up as:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole("customer")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          selectedRole === "customer"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <User className="w-6 h-6" />
                        <span className="font-medium">Customer</span>
                        <span className="text-xs text-muted-foreground">Discover & dine</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRole("restaurant")}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          selectedRole === "restaurant"
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Store className="w-6 h-6" />
                        <span className="font-medium">Restaurant</span>
                        <span className="text-xs text-muted-foreground">List your business</span>
                      </button>
                    </div>
                  </div>

                  <Input
                    placeholder="Full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </>
              )}

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot-password")}
                  className="text-sm text-primary underline text-right block"
                >
                  Forgot password?
                </button>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Please wait…" : mode === "signin" ? "Sign In" : "Sign Up"}
              </Button>

              <p className="text-center text-sm">
                {mode === "signin" ? (
                  <>
                    No account?{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => setMode("signup")}
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className="text-primary underline"
                      onClick={() => setMode("signin")}
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <Link
                to="/admin/login"
                className="text-xs text-muted-foreground flex justify-center gap-1"
              >
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
