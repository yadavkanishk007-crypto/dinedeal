import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Store, Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import heroIllustration from "@/assets/hero-illustration.png";

type AuthMode = "signin" | "signup";
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, fullName, selectedRole);
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
          // Redirect based on role
          if (selectedRole === "restaurant") {
            navigate("/restaurant-dashboard");
          } else {
            navigate("/");
          }
        }
      } else {
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
          // Role-based redirect will happen via AuthContext
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container py-6 flex items-center justify-between">
        <motion.button
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          onClick={() => navigate("/")}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <Logo />
        <div className="w-10" />
      </header>

      <main className="flex-1 container flex flex-col justify-center py-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Illustration */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img
                src={heroIllustration}
                alt="Zave"
                className="w-32 h-32 object-contain"
              />
            </motion.div>

            <div className="text-center">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                {mode === "signin" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-muted-foreground">
                {mode === "signin" 
                  ? "Sign in to continue saving on meals" 
                  : "Join Zave and start saving today"}
              </p>
            </div>

            {/* Role Selection (Signup only) */}
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="text-sm font-medium text-foreground text-center">
                  I want to join as a:
                </p>
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

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
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

              <Button
                type="submit"
                variant="gradient"
                size="xl"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading 
                  ? "Please wait..." 
                  : mode === "signin" 
                    ? "Sign In" 
                    : "Create Account"}
              </Button>
            </form>

            {/* Toggle Mode */}
            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-primary font-medium hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>

            {/* Admin Login Link */}
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
        </AnimatePresence>
      </main>
    </div>
  );
};

// Role Selection Card Component
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
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card
        className={`border-2 transition-all ${
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/30"
        }`}
      >
        <CardContent className="p-4 text-center">
          <div
            className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${
              isSelected ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
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
