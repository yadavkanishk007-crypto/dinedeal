console.log("AUTH PAGE VERSION: 2026-01-28");
import { useState, useEffect } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Browser } from "@capacitor/browser";
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
  Gamepad,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// Added event_organiser to the role type
type AuthMode = "signin" | "signup" | "forgot-password";
type UserRole = "customer" | "restaurant" | "admin" | "event_organiser" | "activity_provider";

const isMobileCustomer = import.meta.env.VITE_APP_TARGET === "mobile-customer";

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

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [noticeLang, setNoticeLang] = useState<"en" | "hi">("en");
  const [showNotice, setShowNotice] = useState(false);

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
    // Both restaurant, event_organiser and activity_provider go to the dashboard; 
    // The dashboard handles their specific onboarding redirects.
    if (role === "restaurant" || role === "event_organiser" || role === "activity_provider") {
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

    if (mode === "signup" && !agreedToTerms) {
      toast({
        title: "Consent Required 🔐",
        description: "Please read and accept the DPDP Consent Notice & Terms to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    // Since Google signup won't pass through our normal signup function,
    // we save the selected role so we can use it during bootstrapping later
    if (mode === "signup") {
      localStorage.setItem("signup_role", selectedRole);
      localStorage.setItem("signup_agreed_to_terms", "true");
      localStorage.setItem("signup_consent_lang", noticeLang);
      localStorage.setItem("signup_notice_version", "v1.0-dpdp");
      localStorage.setItem("signup_user_agent", typeof window !== "undefined" ? window.navigator.userAgent : "");
    }

    const isCapacitor = (window as any).Capacitor !== undefined;
    const redirectTo = isCapacitor 
      ? "com.dinedeal.app://auth/callback" 
      : `${window.location.origin}/auth/callback`;

    try {
      if (isCapacitor) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          await Browser.open({ url: data.url });
        } else {
          throw new Error("No authorization URL returned from Supabase.");
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
          },
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({ title: "Google Auth Failed", description: error.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !agreedToTerms) {
      toast({
        title: "Consent Required 🔐",
        description: "Please check the box to accept the terms and DPDP consent notice.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(
          email,
          password,
          fullName,
          selectedRole,
          phone,
          agreedToTerms,
          noticeLang,
          "v1.0-dpdp"
        );
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
                  {!isMobileCustomer && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center">I want to sign up as:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedRole("customer")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            selectedRole === "customer" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                          )}
                        >
                          <User className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-tight">Customer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRole("restaurant");
                          }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            selectedRole !== "customer" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                          )}
                        >
                          <Store className="w-5 h-5" />
                          <span className="text-xs font-bold uppercase tracking-tight">Entity Partner</span>
                        </button>
                      </div>

                      {selectedRole !== "customer" && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-2 p-3 bg-secondary/50 rounded-2xl border border-border/50"
                        >
                          <p className="text-[11px] font-semibold text-muted-foreground text-center">Select Partner Type:</p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRole("restaurant");
                              }}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all",
                                selectedRole === "restaurant"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                            >
                              <Store className="w-4 h-4" />
                              <span className="text-[9px] font-bold uppercase tracking-tight">Dine-in</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRole("event_organiser");
                              }}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all",
                                selectedRole === "event_organiser"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                            >
                              <Sparkles className="w-4 h-4" />
                              <span className="text-[9px] font-bold uppercase tracking-tight">Events</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRole("activity_provider");
                              }}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center transition-all",
                                selectedRole === "activity_provider"
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                            >
                              <Gamepad className="w-4 h-4" />
                              <span className="text-[9px] font-bold uppercase tracking-tight">Activity</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

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

              {mode === "signup" && (
                <div className="relative overflow-hidden space-y-4 my-3 rounded-2xl border-2 border-[#D9CDBB] bg-[#FCFAF5] shadow-md transition-all duration-300">
                  {/* Decorative ethnic border banner matching PDF slides 1, 2, 5 & 8 */}
                  <div className="w-full h-3 bg-[#626B33] relative overflow-hidden flex">
                    <svg className="w-full h-full" width="100%" height="12" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="ethnic-border" width="20" height="12" patternUnits="userSpaceOnUse">
                          {/* Grain/wheat stalks symbol in light cream */}
                          <line x1="10" y1="2" x2="10" y2="10" stroke="#F6F3EB" strokeWidth="1" />
                          <circle cx="10" cy="2" r="1.2" fill="#F6F3EB" />
                          <path d="M7 4 C 8 3, 9 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
                          <path d="M13 4 C 12 3, 11 3, 10 4" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
                          <path d="M7 7 C 8 6, 9 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
                          <path d="M13 7 C 12 6, 11 6, 10 7" stroke="#F6F3EB" strokeWidth="0.8" fill="none" />
                          {/* Orange floral dot */}
                          <circle cx="20" cy="6" r="2.2" fill="#E2871A" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="12" fill="url(#ethnic-border)" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between border-b border-[#EBE3D5] pb-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {/* Interactive spinning mandala vector representing unity & trust */}
                      <svg 
                        className="w-5 h-5 text-[#E2871A] shrink-0" 
                        style={{ animation: 'spin 16s linear infinite' }}
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1.2"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v22M1 12h22M4.22 4.22l15.56 15.56M4.22 19.78L19.78 4.22" />
                        <path d="M12 3a9 9 0 0 1 6.36 2.64M18.36 12a9 9 0 0 1-2.64 6.36M12 21a9 9 0 0 1-6.36-2.64M5.64 12a9 9 0 0 1 2.64-6.36" />
                      </svg>
                      <span className="font-serif text-xs font-bold text-[#555D28] tracking-tight uppercase">
                        {noticeLang === "en" ? "DPDP Consent Notice" : "डीपीडीपी सहमति सूचना"}
                      </span>
                    </div>
                    <div className="flex gap-1 bg-[#EFECE5] p-0.5 rounded-lg border border-[#E0D9CD]">
                      <button
                        type="button"
                        onClick={() => setNoticeLang("en")}
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded-md transition-all duration-200",
                          noticeLang === "en" ? "bg-[#626B33] text-white shadow-sm" : "text-[#626B33] hover:bg-[#E6E1D7]"
                        )}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoticeLang("hi")}
                        className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded-md transition-all duration-200",
                          noticeLang === "hi" ? "bg-[#626B33] text-white shadow-sm" : "text-[#626B33] hover:bg-[#E6E1D7]"
                        )}
                      >
                        हिन्दी
                      </button>
                    </div>
                  </div>

                  <div className="px-3 pb-3 space-y-3">
                    <div className="p-2.5 rounded-xl bg-[#F3ECE0] border border-[#E5DAC8] text-[#3D3E24] text-[11px] leading-relaxed relative overflow-hidden">
                      {/* Subtle watermark sun illustration representing the Garmi-e-india summer theme (PDF page 3) */}
                      <div className="absolute -right-2 -bottom-2 opacity-10 pointer-events-none text-[#E2871A]">
                        <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
                        </svg>
                      </div>

                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <p className="font-serif font-medium text-[11px] text-[#4F5425] text-left">
                          {noticeLang === "en" 
                            ? "We collect Name, Email, Phone, and Location under India's DPDP Act to process secure table reservations and manage your account." 
                            : "हम सुरक्षित टेबल रिजर्वेशन पूरा करने और आपके खाते को मैनेज करने के लिए भारत के डीपीडीपी अधिनियम के तहत आपका नाम, ईमेल, फोन और स्थान एकत्र करते हैं।"}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowNotice(!showNotice)}
                          className="text-[10px] font-bold text-[#E2871A] hover:text-[#C17013] underline shrink-0 flex items-center gap-0.5 transition-colors duration-200"
                        >
                          {showNotice 
                            ? (noticeLang === "en" ? "Less" : "संक्षिप्त") 
                            : (noticeLang === "en" ? "More" : "विवरण")}
                          {showNotice ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {showNotice && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-[#EFECE5] p-3 rounded-xl border border-[#DFD8CC] space-y-2.5 text-left text-[10px] text-[#40432B]"
                      >
                        <div className="border-b border-[#E1DCD3] pb-1.5">
                          <span className="font-serif font-bold text-[#555D28] block mb-0.5">
                            {noticeLang === "en" ? "📋 DATA CATEGORIES" : "📋 एकत्र किया जाने वाला डेटा"}
                          </span>
                          <p className="leading-relaxed">
                            {noticeLang === "en"
                              ? "Diners: Name, Email, Phone, Coarse Location. Partners: Restaurant name, owner contact, banking details (for payouts)."
                              : "डिनर: नाम, ईमेल, फोन, स्थान। पार्टनर: रेस्टोरेंट का नाम, मालिक का संपर्क, बैंक विवरण (भुगतान के लिए)।"}
                          </p>
                        </div>
                        
                        <div className="border-b border-[#E1DCD3] pb-1.5">
                          <span className="font-serif font-bold text-[#555D28] block mb-0.5">
                            {noticeLang === "en" ? "🎯 PROCESSING PURPOSES" : "🎯 प्रसंस्करण के उद्देश्य"}
                          </span>
                          <p className="leading-relaxed">
                            {selectedRole === "customer"
                              ? (noticeLang === "en"
                                  ? "To fulfill your dining reservations, book event tickets, manage rewards, and contact you for updates."
                                  : "आपके डाइनिंग रिजर्वेशन को पूरा करने, इवेंट टिकट बुक करने, रिवॉर्ड मैनेज करने और संपर्क करने के लिए।")
                              : (noticeLang === "en"
                                  ? "To create your partner dashboard, verify entity registrations, and complete table booking payouts."
                                  : "पार्टनर डैशबोर्ड बनाने, क्रेडेंशियल सत्यापित करने और बुकिंग भुगतानों को पूरा करने के लिए।")}
                          </p>
                        </div>

                        <div className="border-b border-[#E1DCD3] pb-1.5">
                          <span className="font-serif font-bold text-[#555D28] block mb-0.5">
                            {noticeLang === "en" ? "⚖️ STATUTORY RIGHTS" : "⚖️ आपके कानूनी अधिकार"}
                          </span>
                          <p className="leading-relaxed">
                            {noticeLang === "en"
                              ? "You may review, correct, or erase your data, and withdraw your consent at any time via Settings > Privacy & Security."
                              : "आप किसी भी समय सेटिंग्स > गोपनीयता के माध्यम से अपने डेटा को देख, सुधार या हटा सकते हैं, और अपनी सहमति वापस ले सकते हैं।"}
                          </p>
                        </div>

                        <div>
                          <span className="font-serif font-bold text-[#555D28] block mb-0.5">
                            {noticeLang === "en" ? "🛡️ GRIEVANCE MECHANISM" : "🛡️ शिकायत निवारण अधिकारी"}
                          </span>
                          <p className="leading-relaxed">
                            {noticeLang === "en"
                              ? "Contact our Grievance Officer at privacy@dinedeal.in. Grievances are reviewed and resolved within 72 hours."
                              : "हमारे शिकायत अधिकारी से privacy@dinedeal.in पर संपर्क करें। शिकायतों का निवारण 72 घंटे के भीतर किया जाता है।"}
                          </p>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex items-start gap-2.5 pt-1 text-left">
                      <Checkbox
                        id="dpdp-consent"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                        className="mt-0.5 border-[#626B33] data-[state=checked]:bg-[#E2871A] data-[state=checked]:border-[#E2871A] data-[state=checked]:text-white transition-all duration-200"
                      />
                      <label
                        htmlFor="dpdp-consent"
                        className="text-[11px] text-[#4F5425] select-none cursor-pointer leading-normal"
                      >
                        {noticeLang === "en" ? (
                          <>
                            I give my free, specific, and informed consent to process my data, and agree to the{" "}
                            <Link 
                              to={selectedRole === "customer" ? "/terms" : "/RestaurantTermsCondition"} 
                              target="_blank" 
                              className="text-[#E2871A] hover:text-[#C17013] font-bold hover:underline"
                            >
                              Terms & Conditions
                            </Link>{" "}
                            and{" "}
                            <Link 
                              to={selectedRole === "customer" ? "/privacy" : "/RestaurantPrivacyPolicy"} 
                              target="_blank" 
                              className="text-[#E2871A] hover:text-[#C17013] font-bold hover:underline"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </>
                        ) : (
                          <>
                            मैं अपने डेटा को प्रोसेस करने के लिए अपनी स्वतंत्र, विशिष्ट और सूचित सहमति देता/देती हूँ, और डाइनडील के{" "}
                            <Link 
                              to={selectedRole === "customer" ? "/terms" : "/RestaurantTermsCondition"} 
                              target="_blank" 
                              className="text-[#E2871A] hover:text-[#C17013] font-bold hover:underline"
                            >
                              नियम और शर्तें
                            </Link>{" "}
                            और{" "}
                            <Link 
                              to={selectedRole === "customer" ? "/privacy" : "/RestaurantPrivacyPolicy"} 
                              target="_blank" 
                              className="text-[#E2871A] hover:text-[#C17013] font-bold hover:underline"
                            >
                              गोपनीयता नीति
                            </Link>{" "}
                            से सहमत हूँ।
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full font-bold uppercase tracking-wide" disabled={isLoading}>
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

              {!isMobileCustomer && (
                <Link to="/admin/login" className="text-xs text-muted-foreground flex justify-center gap-1">
                  <Shield className="w-3 h-3" /> Admin Login
                </Link>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Auth;
