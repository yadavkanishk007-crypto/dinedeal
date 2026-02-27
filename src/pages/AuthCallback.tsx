import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth error:", error.message);
        navigate("/auth");
        return;
      }

      navigate("/"); // redirect after success
    };

    handleAuth();
  }, [navigate]);

  return <p>Authenticating...</p>;
};

export default AuthCallback;
