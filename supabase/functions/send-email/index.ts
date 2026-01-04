import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface EmailRequest {
  to: string;
  subject: string;
  type: "otp" | "welcome" | "transaction_receipt" | "promotional";
  data?: Record<string, any>;
}

// Email Templates
const getOTPEmailTemplate = (otp: string, userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP Code - DineDeal</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">DineDeal</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Delicious Deals, Every Meal</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Your Verification Code</h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.6;">
                ${userName ? `Hi ${userName},` : 'Hi there,'}<br><br>
                Use the code below to verify your email address. This code will expire in 10 minutes.
              </p>
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #059669;">${otp}</span>
              </div>
              <p style="margin: 24px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you didn't request this code, please ignore this email. Your account is safe.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} DineDeal. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getWelcomeEmailTemplate = (userName: string, role: string) => `
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
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 48px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Welcome to DineDeal! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 22px;">Hello ${userName}!</h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px; line-height: 1.6;">
                We're thrilled to have you join the DineDeal family! ${role === 'restaurant' ? 'Your restaurant is now ready to attract hungry customers.' : 'Get ready to discover amazing discounts.'}
              </p>
              ${role === 'customer' ? `
              <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #059669;">🎁 Welcome Bonus!</h3>
                <p style="margin: 0; color: #1a1a1a;">Earn reward points on every transaction!</p>
              </div>
              ` : `
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #d97706;">📋 Next Steps</h3>
                <p style="margin: 0; color: #1a1a1a;">Complete your profile and add offers to attract customers!</p>
              </div>
              `}
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://dinedeal.in" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">Get Started</a>
              </div>
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

const getTransactionReceiptTemplate = (data: {
  userName: string;
  restaurantName: string;
  billAmount: number;
  discount: number;
  finalAmount: number;
  rewardsEarned: number;
  transactionId: string;
  date: string;
  paymentMethod: string;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">DineDeal</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Payment Receipt</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: #10B981; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
                <span style="color: #ffffff; font-size: 32px;">✓</span>
              </div>
              <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 24px;">Payment Successful!</h2>
              <p style="margin: 0; color: #666666; font-size: 14px;">${data.date}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px;">${data.restaurantName}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding: 8px 0; color: #666666;">Bill Amount</td><td style="padding: 8px 0; color: #1a1a1a; text-align: right; font-weight: 500;">₹${data.billAmount.toFixed(2)}</td></tr>
                  <tr><td style="padding: 8px 0; color: #10B981;">DineDeal Discount</td><td style="padding: 8px 0; color: #10B981; text-align: right; font-weight: 500;">- ₹${data.discount.toFixed(2)}</td></tr>
                  <tr><td colspan="2" style="border-top: 1px dashed #e5e7eb; padding-top: 16px;"></td></tr>
                  <tr><td style="padding: 8px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">You Paid</td><td style="padding: 8px 0; color: #10B981; font-size: 22px; text-align: right; font-weight: 700;">₹${data.finalAmount.toFixed(2)}</td></tr>
                </table>
              </div>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #d97706; font-size: 14px;">🎉 You earned</p>
                <p style="margin: 4px 0 0; color: #92400e; font-size: 24px; font-weight: 700;">${data.rewardsEarned} Reward Points</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; color: #666666;">
                <tr><td style="padding: 4px 0;">Transaction ID</td><td style="padding: 4px 0; text-align: right; font-family: monospace;">${data.transactionId}</td></tr>
                <tr><td style="padding: 4px 0;">Payment Method</td><td style="padding: 4px 0; text-align: right; text-transform: uppercase;">${data.paymentMethod}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 12px; color: #666666; font-size: 14px;">Thank you for dining with DineDeal! 🙏</p>
              <p style="margin: 0; color: #999999; font-size: 12px;">© ${new Date().getFullYear()} DineDeal</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getPromotionalEmailTemplate = (data: {
  userName: string;
  restaurantName: string;
  offerTitle: string;
  discountPercent: number;
  maxDiscount: number;
  validUntil: string;
}) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; max-width: 600px;">
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 48px 32px; text-align: center;">
              <p style="margin: 0 0 8px; color: rgba(255,255,255,0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Special Offer</p>
              <h1 style="margin: 0; color: #ffffff; font-size: 48px; font-weight: 700;">${data.discountPercent}% OFF</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Up to ₹${data.maxDiscount} discount</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 22px;">Hey ${data.userName}!</h2>
              <p style="margin: 0 0 24px; color: #666666; font-size: 16px;">We have an exciting offer just for you!</p>
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10B981; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                <h3 style="margin: 0 0 8px; color: #059669; font-size: 20px;">${data.restaurantName}</h3>
                <p style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 500;">${data.offerTitle}</p>
                <p style="margin: 0; color: #666666; font-size: 14px;">Valid until: ${data.validUntil}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://dinedeal.in/explore" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">Claim Offer Now</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #999999; font-size: 12px;">© ${new Date().getFullYear()} DineDeal</p>
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
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to: ${to}`);

    let html = "";
    let emailSubject = subject;

    switch (type) {
      case "otp":
        const otp = data?.otp || Math.floor(100000 + Math.random() * 900000).toString();
        html = getOTPEmailTemplate(otp, data?.userName);
        emailSubject = subject || `Your DineDeal Verification Code: ${otp}`;
        
        // Store OTP in database
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await supabase.from("otp_verifications").insert({
          user_email: to,
          otp_code: otp,
          otp_type: data?.otpType || "email_verification",
          expires_at: expiresAt.toISOString(),
        });
        break;
        
      case "welcome":
        html = getWelcomeEmailTemplate(data?.userName || "User", data?.role || "customer");
        emailSubject = subject || "Welcome to DineDeal! 🎉";
        break;
        
      case "transaction_receipt":
        html = getTransactionReceiptTemplate({
          userName: data?.userName || "User",
          restaurantName: data?.restaurantName || "Restaurant",
          billAmount: data?.billAmount || 0,
          discount: data?.discount || 0,
          finalAmount: data?.finalAmount || 0,
          rewardsEarned: data?.rewardsEarned || 0,
          transactionId: data?.transactionId || "N/A",
          date: data?.date || new Date().toLocaleDateString("en-IN"),
          paymentMethod: data?.paymentMethod || "UPI",
        });
        emailSubject = subject || `Payment Receipt - ${data?.restaurantName || "DineDeal"}`;
        break;
        
      case "promotional":
        html = getPromotionalEmailTemplate({
          userName: data?.userName || "User",
          restaurantName: data?.restaurantName || "Restaurant",
          offerTitle: data?.offerTitle || "Special Offer",
          discountPercent: data?.discountPercent || 20,
          maxDiscount: data?.maxDiscount || 500,
          validUntil: data?.validUntil || "Limited time",
        });
        emailSubject = subject || `🎁 ${data?.discountPercent}% OFF at ${data?.restaurantName}!`;
        break;
        
      default:
        throw new Error("Invalid email type");
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "DineDeal <noreply@resend.dev>",
      to: [to],
      subject: emailSubject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        data: type === "otp" ? { dev_otp: data?.otp } : undefined 
      }),
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
