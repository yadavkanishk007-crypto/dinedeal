import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface OTPRequest {
  email?: string;
  phone?: string;
  type: "password_reset" | "email_verification" | "phone_verification";
  userName?: string;
}

const getOTPEmailTemplate = (otp: string, userName?: string, type?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">DineDeal</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Delicious Deals, Every Meal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                ${type === 'password_reset' ? 'Reset Your Password' : 'Verify Your Email'}
              </h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.6;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}<br><br>
                ${type === 'password_reset' 
                  ? 'Use the code below to reset your password. This code will expire in 10 minutes.'
                  : 'Use the code below to verify your email address. This code will expire in 10 minutes.'}
              </p>
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #059669;">${otp}</span>
              </div>
              <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">© ${new Date().getFullYear()} DineDeal. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, type, userName }: OTPRequest = await req.json();

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

    // Send OTP via email using Resend
    if (email) {
      const html = getOTPEmailTemplate(otp, userName, type);
      
      try {
        const emailResponse = await resend.emails.send({
          from: "DineDeal <noreply@resend.dev>",
          to: [email],
          subject: type === 'password_reset' 
            ? `Password Reset Code: ${otp}` 
            : `Your DineDeal Verification Code: ${otp}`,
          html,
        });
        console.log(`OTP email sent to ${email}:`, emailResponse);
      } catch (emailError) {
        console.error("Email send error:", emailError);
        // Continue even if email fails - OTP is still stored
      }
    }

    // For phone OTP (Twilio integration placeholder)
    if (phone) {
      console.log(`Phone OTP for ${phone}: ${otp}`);
      // TODO: Integrate with Twilio for SMS OTP
    }

    console.log(`OTP generated for ${email || phone}: ${otp}`);

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
