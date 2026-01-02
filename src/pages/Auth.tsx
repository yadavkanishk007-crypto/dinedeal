import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Store, Shield, Eye, EyeOff, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import heroIllustration from "@/assets/hero-illustration.png";

type AuthMode = "signin" | "signup" | "forgot-password" | "verify-otp" | "reset-password";
type UserRole = "customer" | "restaurant";

const Auth = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState("Jhansi");
  const [isLocating, setIsLocating] = useState(false);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLocating(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Use reverse geocoding to get city name
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              const city = data.address?.city || 
                          data.address?.town || 
                          data.address?.village || 
                          data.address?.district ||
                          "Jhansi";
              setLocation(city);
              console.log("Detected location:", city);
            } catch (error) {
              console.error("Reverse geocoding failed:", error);
              setLocation("Jhansi");
            }
            setIsLocating(false);
          },
          (error) => {
            console.error("Geolocation error:", error);
            setLocation("Jhansi");
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocation("Jhansi");
        setIsLocating(false);
      }
    } catch (error) {
      console.error("Location detection failed:", error);
      setLocation("Jhansi");
      setIsLocating(false);
    }
  };

  const handleSendOTP = async () => {
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
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { email, type: "password_reset" },
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: `A 6-digit OTP has been sent to ${email}`,
      });
      
      // For development, show the OTP
      if (data?.dev_otp) {
        console.log("Dev OTP:", data.dev_otp);
        toast({
          title: "Dev Mode OTP",
          description: `Your OTP is: ${data.dev_otp}`,
        });
      }
      
      setMode("verify-otp");
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { email, otp, type: "password_reset" },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid OTP");
      }

      toast({
        title: "OTP Verified",
        description: "You can now set a new password",
      });
      setMode("reset-password");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password", {
        body: { email, new_password: newPassword },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset",
        description: "Your password has been updated. Please sign in.",
      });
      setMode("signin");
      setPassword("");
      setNewPassword("");
      setOtp("");
    } catch (error: any) {
      toast({
        title: "Reset failed",
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
        const { error } = await signUp(email, password, fullName, selectedRole, phone);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Zave. You're now signed in.",
          });
          if (selectedRole === "restaurant") {
            navigate("/restaurant-dashboard");
          } else {
            navigate("/");
          }
        }
      } else if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You're now signed in.",
          });
          navigate("/");
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderForgotPassword = () => (
    <motion.div
      key="forgot-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <motion.div className="flex justify-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <img src={heroIllustration} alt="Zave" className="w-32 h-32 object-contain" />
      </motion.div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Forgot Password</h1>
        <p className="text-muted-foreground">Enter your email to receive a 6-digit OTP</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>

        <Button
          type="button"
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={isLoading}
          onClick={handleSendOTP}
        >
          {isLoading ? "Sending OTP..." : "Send OTP"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
            Sign In
          </button>
        </p>
      </div>
    </motion.div>
  );

  const renderVerifyOTP = () => (
    <motion.div
      key="verify-otp"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <motion.div className="flex justify-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <img src={heroIllustration} alt="Zave" className="w-32 h-32 object-contain" />
      </motion.div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Verify OTP</h1>
        <p className="text-muted-foreground">Enter the 6-digit code sent to {email}</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          type="button"
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={isLoading || otp.length !== 6}
          onClick={handleVerifyOTP}
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}
          <button onClick={handleSendOTP} className="text-primary font-medium hover:underline" disabled={isLoading}>
            Resend OTP
          </button>
        </p>
      </div>
    </motion.div>
  );

  const renderResetPassword = () => (
    <motion.div
      key="reset-password"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <motion.div className="flex justify-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <img src={heroIllustration} alt="Zave" className="w-32 h-32 object-contain" />
      </motion.div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Set New Password</h1>
        <p className="text-muted-foreground">Enter your new password</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 pr-10"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="button"
          variant="gradient"
          size="xl"
          className="w-full"
          disabled={isLoading}
          onClick={handleResetPassword}
        >
          {isLoading ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </motion.div>
  );

  const renderAuthForm = () => (
    <motion.div
      key={mode}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <motion.div className="flex justify-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <img src={heroIllustration} alt="Zave" className="w-32 h-32 object-contain" />
      </motion.div>

      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          {mode === "signin" ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "signin" ? "Sign in to continue saving on meals" : "Join Zave and start saving today"}
        </p>
        
        {/* Location Display */}
        <div className="flex items-center justify-center gap-1 mt-2 text-sm text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          <span>{isLocating ? "Detecting location..." : location}</span>
        </div>
      </div>

      {mode === "signup" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p className="text-sm font-medium text-foreground text-center">I want to join as a:</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              icon={<User className="w-6 h-6" />}
              title="Customer"
              description="Dine & save money"
              isSelected={selectedRole === "customer"}
              onClick={() => setSelectedRole("customer")}
            />
            <RoleCard
              icon={<Store className="w-6 h-6" />}
              title="Restaurant"
              description="Grow your business"
              isSelected={selectedRole === "restaurant"}
              onClick={() => setSelectedRole("restaurant")}
            />
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="Phone Number (e.g., +91 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>
          </>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {mode === "signin" && (
          <div className="text-right">
            <button
              type="button"
              onClick={() => setMode("forgot-password")}
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
          {isLoading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
              Sign In
            </button>
          </>
        )}
      </p>

      <div className="text-center">
        <Link
          to="/admin/login"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <Shield className="w-3 h-3" />
          Admin Login
        </Link>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-6 flex items-center justify-between">
        <motion.button
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          onClick={() => {
            if (mode === "verify-otp" || mode === "reset-password") {
              setMode("forgot-password");
            } else if (mode === "forgot-password") {
              setMode("signin");
            } else {
              navigate("/");
            }
          }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <Logo />
        <div className="w-10" />
      </header>

      <main className="flex-1 container flex flex-col justify-center py-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {mode === "forgot-password" && renderForgotPassword()}
          {mode === "verify-otp" && renderVerifyOTP()}
          {mode === "reset-password" && renderResetPassword()}
          {(mode === "signin" || mode === "signup") && renderAuthForm()}
        </AnimatePresence>
      </main>
    </div>
  );
};

const RoleCard = ({
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.98 }} className="w-full">
      <Card className={`border-2 transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
        <CardContent className="p-4 text-center">
          <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${isSelected ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {icon}
          </div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.button>
  );
};

export default Auth;
