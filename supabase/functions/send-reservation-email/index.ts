import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ReservationEmailRequest {
  to: string;
  type: "confirmation" | "status_update" | "reminder";
  data: {
    customerName: string;
    restaurantName: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    status: string;
    specialRequests?: string;
  };
}

const getReservationConfirmationTemplate = (data: ReservationEmailRequest["data"]) => `
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
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Table Reservation</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🍽️</span>
              </div>
              <h2 style="margin: 0 0 8px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reservation Request Received!</h2>
              <p style="margin: 0; color: #666666; font-size: 16px;">Thank you for choosing ${data.restaurantName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">Booking Details</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #666666;">Guest Name</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #1a1a1a;">
                      ${data.customerName}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #666666;">📅 Date</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #1a1a1a;">
                      ${new Date(data.reservationDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #666666;">⏰ Time</span>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500; color: #1a1a1a;">
                      ${data.reservationTime}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <span style="color: #666666;">👥 Party Size</span>
                    </td>
                    <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1a1a1a;">
                      ${data.partySize} ${data.partySize === 1 ? "Guest" : "Guests"}
                    </td>
                  </tr>
                </table>
                ${data.specialRequests ? `
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px; color: #666666; font-size: 14px;">Special Requests:</p>
                  <p style="margin: 0; color: #1a1a1a; font-size: 14px; font-style: italic;">"${data.specialRequests}"</p>
                </div>
                ` : ""}
              </div>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                  ⏳ Your reservation is pending confirmation from the restaurant. We'll notify you once it's confirmed!
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #666666; font-size: 14px;">Questions? Reply to this email or contact the restaurant directly.</p>
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

const getStatusUpdateTemplate = (data: ReservationEmailRequest["data"]) => {
  const statusEmoji = data.status === "confirmed" ? "✅" : data.status === "cancelled" ? "❌" : "📋";
  const statusColor = data.status === "confirmed" ? "#10B981" : data.status === "cancelled" ? "#EF4444" : "#F59E0B";
  const statusText = data.status === "confirmed" ? "Confirmed!" : data.status === "cancelled" ? "Cancelled" : "Updated";
  const statusMessage = data.status === "confirmed" 
    ? "Great news! Your table reservation has been confirmed. We look forward to seeing you!"
    : data.status === "cancelled"
    ? "Unfortunately, your reservation has been cancelled. Please contact the restaurant for more details."
    : "Your reservation status has been updated.";

  return `
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
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Reservation Update</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 32px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: ${statusColor}20; border-radius: 50%; margin: 0 auto 24px; line-height: 80px;">
                <span style="font-size: 40px;">${statusEmoji}</span>
              </div>
              <h2 style="margin: 0 0 8px; color: ${statusColor}; font-size: 24px; font-weight: 600;">Reservation ${statusText}</h2>
              <p style="margin: 0; color: #666666; font-size: 16px;">${statusMessage}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 32px;">
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 24px;">
                <h3 style="margin: 0 0 16px; color: #1a1a1a; font-size: 18px; font-weight: 600;">${data.restaurantName}</h3>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 8px 0; color: #666666;">📅 Date</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #1a1a1a;">
                      ${new Date(data.reservationDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666;">⏰ Time</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${data.reservationTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666666;">👥 Guests</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: 500; color: #1a1a1a;">${data.partySize}</td>
                  </tr>
                </table>
              </div>
              ${data.status === "confirmed" ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://dinedeal.in/reservations" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">View My Reservations</a>
              </div>
              ` : ""}
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
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, type, data }: ReservationEmailRequest = await req.json();

    console.log(`Sending ${type} reservation email to: ${to}`);

    let html = "";
    let subject = "";

    switch (type) {
      case "confirmation":
        html = getReservationConfirmationTemplate(data);
        subject = `Reservation Request Received - ${data.restaurantName}`;
        break;
      case "status_update":
        html = getStatusUpdateTemplate(data);
        subject = data.status === "confirmed" 
          ? `✅ Reservation Confirmed - ${data.restaurantName}`
          : data.status === "cancelled"
          ? `Reservation Cancelled - ${data.restaurantName}`
          : `Reservation Update - ${data.restaurantName}`;
        break;
      case "reminder":
        html = getStatusUpdateTemplate({ ...data, status: "confirmed" });
        subject = `⏰ Reminder: Your reservation at ${data.restaurantName} is tomorrow!`;
        break;
      default:
        throw new Error("Invalid email type");
    }

    const emailResponse = await resend.emails.send({
      from: "DineDeal <noreply@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Reservation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reservation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
