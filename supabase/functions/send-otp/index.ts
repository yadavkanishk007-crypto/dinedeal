import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email?: string;
  phone?: string;
  type: "password_reset" | "phone_verification";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, type }: OTPRequest = await req.json();

    if (!email && !phone) {
      throw new Error("Email or phone is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email/phone
    if (email) {
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("user_email", email)
        .eq("otp_type", type);
    }
    if (phone) {
      await supabase
        .from("otp_verifications")
        .delete()
        .eq("phone", phone)
        .eq("otp_type", type);
    }

    // Store new OTP
    const { error: otpError } = await supabase
      .from("otp_verifications")
      .insert({
        user_email: email || null,
        phone: phone || null,
        otp_code: otp,
        otp_type: type,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      throw new Error("Failed to generate OTP");
    }

    // If email, send email with OTP
    if (email) {
      const GMAIL_USER = Deno.env.get("GMAIL_USER");
      console.log(`Sending OTP ${otp} to email: ${email}`);
      
      // For production, integrate with actual email service
      // For now, log the OTP (remove in production)
    }

    // If phone, send SMS with OTP
    if (phone) {
      console.log(`Sending OTP ${otp} to phone: ${phone}`);
      // For production, integrate with SMS service like Twilio
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `OTP sent to ${email || phone}`,
        // DEV ONLY: Include OTP for testing (remove in production)
        dev_otp: otp 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
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
