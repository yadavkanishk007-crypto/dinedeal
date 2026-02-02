import { ArrowLeft, Mail, AlertTriangle, Trash2, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const DeleteAccount = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border/10">
        <div className="container max-w-lg mx-auto px-4 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg">Account Deletion</h1>
        </div>
      </div>

      <main className="container max-w-lg mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold font-display">Delete Your Account</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              We're sorry to see you go. Here's how to permanently delete your DineDeal account and associated data.
            </p>
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-secondary/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                How to request deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                To process your request securely, please send an email with the following details:
              </p>
              
              <div className="space-y-4 text-sm">
                <div className="p-3 rounded-lg border border-border/50 bg-background">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Send to</span>
                  <a href="mailto:support@dinedeal.in" className="block text-primary font-medium hover:underline mt-1">
                    support@dinedeal.in
                  </a>
                </div>

                <div className="p-3 rounded-lg border border-border/50 bg-background">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Subject Line</span>
                  <p className="font-medium mt-1">"Delete My DineDeal Account"</p>
                </div>

                <div className="p-3 rounded-lg border border-border/50 bg-background">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Include</span>
                  <p className="font-medium mt-1">The email address or phone number associated with your account.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 shadow-sm">
             <CardHeader className="pb-2">
              <CardTitle className="text-lg">Data Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm text-destructive">
                  <Trash2 className="w-4 h-4" />
                  What will be deleted
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1 pl-2">
                  <li>User profile (name, email, phone)</li>
                  <li>Account credentials</li>
                  <li>Saved preferences and favorites</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  What may be retained
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1 pl-2">
                  <li>Transaction records for legal, tax, or accounting purposes (retained as per applicable laws)</li>
                </ul>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 mt-4">
                <Info className="w-5 h-5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Account deletion requests are typically processed within <span className="font-semibold text-foreground">7 working days</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default DeleteAccount;
