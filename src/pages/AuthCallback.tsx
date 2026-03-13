import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get("token_hash");
      const type = params.get("type");

      if (!token_hash || !type) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: type as any,
      });

      if (error) {
        console.error("Verification error:", error.message);
        navigate("/auth");
        return;
      }

      // ✅ User is now verified AND logged in
      navigate("/");
    };

    handleAuth();
  }, [navigate]);

  return <p>Verifying account...</p>;
};

export default AuthCallback;
