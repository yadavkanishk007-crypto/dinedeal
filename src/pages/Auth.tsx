import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Lock,
  User,
  Store,
  Shield,
  Eye,
  EyeOff,
  Phone,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroIllustration from "@/assets/hero-illustration.png";

type AuthMode = "signin" | "signup" | "forgot-password";
type UserRole = "customer" | "restaurant";

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
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

  // Auto-detect location
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await res.json();
              const city =
                data.address?.city ||
                data.address?.town ||
                data.address?.village ||
                data.address?.district ||
                "Jhansi";
              setLocation(city);
            } catch {
              setLocation("Jhansi");
            }
            setIsLocating(false);
          },
          () => {
            setLocation("Jhansi");
            setIsLocating(false);
          }
        );
      } else {
        setLocation("Jhansi");
        setIsLocating(false);
      }
    } catch {
      setLocation("Jhansi");
      setIsLocating(false);
    }
  };

  // ✅ Native Supabase password reset (NO edge functions)
  const handleSendResetEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset link sent",
        description: "Check your email to reset your password",
      });

      setMode("signin");
    } catch (error: any) {
      toast({
        title: "Failed to send reset email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Account created",
          description: "Welcome! You are now signed in.",
        });

        navigate(selectedRole === "restaurant" ? "/restaurant-dashboard" : "/");
      }

      if (mode === "signin") {
        const { error } = await signIn(email, password);

        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Welcome back",
          description: "You are now signed in",
        });

        navigate("/");
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderForgotPassword = () => (
    <motion.div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="text-muted-foreground">
          Enter your email to receive a reset link
        </p>
      </div>

      <Input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button
        variant="gradient"
        size="xl"
        className="w-full"
        disabled={isLoading}
        onClick={handleSendResetEmail}
      >
        {isLoading ? "Sending..." : "Send reset link"}
      </Button>

      <button
        onClick={() => setMode("signin")}
        className="text-sm text-primary underline block text-center"
      >
        Back to sign in
      </button>
    </motion.div>
  );

  const renderAuthForm = () => (
    <motion.div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>
        <div className="flex justify-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="w-3 h-3 text-primary" />
          <span>{isLocating ? "Detecting..." : location}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <Input
              placeholder="Full Name"
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
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
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
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <p className="text-center text-sm">
        {mode === "signin" ? (
          <>
            No account?{" "}
            <button
              onClick={() => setMode("signup")}
              className="text-primary underline"
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setMode("signin")}
              className="text-primary underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <Link
        to="/admin/login"
        className="text-xs flex justify-center gap-1 text-muted-foreground"
      >
        <Shield className="w-3 h-3" /> Admin Login
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="container py-6 flex justify-between items-center">
        <button onClick={() => navigate("/")}>
          <ArrowLeft />
        </button>
        <Logo />
        <div />
      </header>

      <main className="container max-w-md mx-auto py-8 flex-1">
        <AnimatePresence mode="wait">
          {mode === "forgot-password"
            ? renderForgotPassword()
            : renderAuthForm()}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Auth;
