import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Phone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import heroIllustration from "@/assets/hero-illustration.png";

type AuthStep = "phone" | "otp";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = () => {
    if (phone.length !== 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    // Simulate OTP send
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      toast({
        title: "OTP Sent!",
        description: `A 6-digit code has been sent to +91 ${phone}`,
      });
    }, 1000);
  };

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Welcome to Zave!",
        description: "You're all set to start saving",
      });
      navigate("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container py-6 flex items-center justify-between">
        <motion.button
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
          onClick={() => step === "otp" ? setStep("phone") : navigate("/")}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <Logo />
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="flex-1 container flex flex-col justify-center py-8">
        <AnimatePresence mode="wait">
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
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
                  className="w-48 h-48 object-contain"
                />
              </motion.div>

              <div className="text-center">
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Welcome to Zave
                </h1>
                <p className="text-muted-foreground">
                  Enter your phone number to continue
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-muted-foreground">+91</span>
                    <div className="w-px h-6 bg-border" />
                  </div>
                  <Input
                    type="tel"
                    placeholder="Enter mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="pl-20 text-lg h-14"
                    maxLength={10}
                  />
                </div>

                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  onClick={handleSendOTP}
                  disabled={isLoading || phone.length !== 10}
                >
                  {isLoading ? "Sending..." : "Get OTP"}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to our{" "}
                <span className="text-primary">Terms of Service</span> and{" "}
                <span className="text-primary">Privacy Policy</span>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <motion.div
                  className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Phone className="w-10 h-10 text-primary-foreground" />
                </motion.div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  Verify OTP
                </h1>
                <p className="text-muted-foreground">
                  We sent a code to{" "}
                  <span className="text-foreground font-medium">+91 {phone}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                >
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-12 h-14 text-xl font-bold rounded-xl border-2"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-4">
                <Button
                  variant="gradient"
                  size="xl"
                  className="w-full"
                  onClick={handleVerifyOTP}
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </Button>

                <button className="w-full text-center text-sm text-muted-foreground">
                  Didn't receive code?{" "}
                  <span className="text-primary font-medium">Resend OTP</span>
                </button>
              </div>

              {/* Demo hint */}
              <motion.div
                className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/5 text-primary text-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Demo: Enter any 6-digit code to continue</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Auth;
