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

      // Check if this is an OAuth redirect (uses hash fragments instead of query params)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      if (hashParams.get("access_token")) {
        // Await getSession so Supabase processes the hash before we change the URL
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("OAuth Verification error:", sessionError.message);
          navigate("/auth");
        } else {
          navigate("/");
        }
        return;
      }

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
      if (type === "recovery") {
        navigate("/reset-password");
      } else {
        navigate("/");
      }
    };

    handleAuth();
  }, [navigate]);

  return <p>Verifying account...</p>;
};

export default AuthCallback;