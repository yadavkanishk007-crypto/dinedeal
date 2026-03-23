import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleReset = async () => {
    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password",
      });

      navigate("/auth");
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="container py-6 flex items-center gap-4">
        <button
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center transition-transform active:scale-95"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="font-display font-bold text-lg text-foreground">Security</span>
      </header>

      <main className="container max-w-md mx-auto py-8 flex-1 flex flex-col justify-center pb-32">
        <div className="w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">New Password</h1>
            <p className="text-sm text-muted-foreground">Enter your new password below</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
            />

            <Button
              onClick={handleReset}
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
