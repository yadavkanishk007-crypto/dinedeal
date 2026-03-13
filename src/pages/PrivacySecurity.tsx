import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Smartphone, Key, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hideTransactions, setHideTransactions] = useState(false);

  const securityItems = [
    {
      icon: Key,
      label: "Change Password",
      description: "Update your account password",
      action: () => navigate("/reset-password"),
    },
    {
      icon: Smartphone,
      label: "Two-Factor Authentication",
      description: "Add an extra layer of security",
      action: () => {},
      comingSoon: true,
    },
    {
      icon: FileText,
      label: "Privacy Policy",
      description: "Read our privacy policy",
      action: () => window.open("https://dinedeal-tau.vercel.app/privacy", "_blank"),
    },
    {
      icon: FileText,
      label: "Terms of Service",
      description: "Read our terms of service",
      action: () => window.open("https://dinedeal-tau.vercel.app/terms", "_blank"),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.header
        className="sticky top-0 z-40 glass border-b border-border/30"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="container py-4 flex items-center gap-4">
          <motion.button
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="font-display font-bold text-lg text-foreground">Privacy & Security</h1>
        </div>
      </motion.header>

      <main className="container py-6 space-y-6">
        {/* Security Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-foreground">Account Protected</h2>
                  <p className="text-sm text-muted-foreground">Your account security is good</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">PRIVACY SETTINGS</h2>
          <div className="space-y-3">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Biometric Login</p>
                    <p className="text-xs text-muted-foreground">Use fingerprint or Face ID</p>
                  </div>
                </div>
                <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} />
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    {hideTransactions ? (
                      <EyeOff className="w-5 h-5 text-primary" />
                    ) : (
                      <Eye className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Hide Transaction Amounts</p>
                    <p className="text-xs text-muted-foreground">Mask amounts on home screen</p>
                  </div>
                </div>
                <Switch checked={hideTransactions} onCheckedChange={setHideTransactions} />
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Security Options */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">SECURITY OPTIONS</h2>
          <div className="space-y-2">
            {securityItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card
                  className={`border-border/50 ${!item.comingSoon ? "cursor-pointer hover:border-primary/30" : "opacity-60"} transition-colors`}
                  onClick={!item.comingSoon ? item.action : undefined}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{item.label}</p>
                          {item.comingSoon && (
                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Data Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-secondary/30">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                🔒 Your data is encrypted and stored securely. We never share your personal information 
                with third parties without your consent.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PrivacySecurity;
