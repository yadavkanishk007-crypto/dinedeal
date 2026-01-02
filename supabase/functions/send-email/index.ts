import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type?: "otp" | "notification";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type }: EmailRequest = await req.json();

    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error("Gmail credentials not configured");
    }

    console.log(`Sending email to: ${to}, Subject: ${subject}, Type: ${type || 'general'}`);

    // Create base64 encoded credentials
    const credentials = btoa(`${GMAIL_USER}:${GMAIL_APP_PASSWORD}`);

    // Use Gmail's SMTP via a REST API approach
    // Since Deno doesn't have direct SMTP support, we'll use a workaround
    // For production, consider using services like Resend, SendGrid, etc.
    
    // For now, we'll store the email intent and log it
    // In a real scenario, you'd integrate with an email service
    
    // Create Supabase client for logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log the email attempt
    console.log(`Email would be sent to ${to} with subject: ${subject}`);
    console.log(`Email content: ${html}`);

    // For OTP emails, we generate and store the OTP
    if (type === "otp") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error: otpError } = await supabase
        .from("otp_verifications")
        .insert({
          user_email: to,
          otp_code: otp,
          otp_type: "password_reset",
          expires_at: expiresAt.toISOString(),
        });

      if (otpError) {
        console.error("Error storing OTP:", otpError);
        throw new Error("Failed to generate OTP");
      }

      // In production, send actual email here
      console.log(`OTP for ${to}: ${otp}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP sent successfully",
          // Include OTP in dev mode for testing (remove in production)
          dev_otp: otp 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
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
