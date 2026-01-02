import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email?: string;
  phone?: string;
  otp: string;
  type: "password_reset" | "phone_verification";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, otp, type }: VerifyOTPRequest = await req.json();

    if (!email && !phone) {
      throw new Error("Email or phone is required");
    }

    if (!otp || otp.length !== 6) {
      throw new Error("Valid 6-digit OTP is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the OTP record
    let query = supabase
      .from("otp_verifications")
      .select("*")
      .eq("otp_code", otp)
      .eq("otp_type", type)
      .eq("is_verified", false)
      .gt("expires_at", new Date().toISOString());

    if (email) {
      query = query.eq("user_email", email);
    }
    if (phone) {
      query = query.eq("phone", phone);
    }

    const { data: otpRecord, error: fetchError } = await query.single();

    if (fetchError || !otpRecord) {
      console.error("OTP verification failed:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired OTP" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from("otp_verifications")
      .update({ is_verified: true })
      .eq("id", otpRecord.id);

    // Delete the used OTP
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("id", otpRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        verified_email: email,
        verified_phone: phone
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
