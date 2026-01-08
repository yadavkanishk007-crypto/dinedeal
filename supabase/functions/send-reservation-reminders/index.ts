import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getReminderEmailTemplate = (
  customerName: string,
  restaurantName: string,
  date: string,
  time: string,
  partySize: number
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Reminder</h1>
      <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your reservation is coming up!</p>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Hi <strong>${customerName}</strong>,
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        This is a friendly reminder that your reservation at <strong>${restaurantName}</strong> is in approximately 2 hours.
      </p>
      
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
        <h3 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px;">📅 Reservation Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Restaurant:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${restaurantName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Date:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Time:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #78716c; font-size: 14px;">Party Size:</td>
            <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">${partySize} ${partySize === 1 ? 'guest' : 'guests'}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        If you need to modify or cancel your reservation, please contact the restaurant directly.
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 20px;">
        We look forward to seeing you soon!
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        This is an automated reminder from our reservation system.
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting reservation reminder check...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get current time and calculate 2 hour window
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    
    const todayDate = now.toISOString().split('T')[0];
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`Checking for reservations between ${twoHoursFromNow.toISOString()} and ${threeHoursFromNow.toISOString()}`);
    
    // Fetch confirmed reservations that haven't received reminders
    const { data: reservations, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        id,
        name,
        email,
        reservation_date,
        reservation_time,
        party_size,
        reminder_sent,
        restaurant_id,
        restaurants (
          name
        )
      `)
      .eq('status', 'confirmed')
      .eq('reminder_sent', false)
      .in('reservation_date', [todayDate, tomorrowDate])
      .not('email', 'is', null);
    
    if (fetchError) {
      console.error("Error fetching reservations:", fetchError);
      throw fetchError;
    }
    
    console.log(`Found ${reservations?.length || 0} potential reservations to check`);
    
    const remindersSent: string[] = [];
    
    for (const reservation of reservations || []) {
      // Parse reservation datetime
      const [hours, minutes] = reservation.reservation_time.split(':').map(Number);
      const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.reservation_time}`);
      
      // Check if reservation is within 2-3 hour window
      if (reservationDateTime >= twoHoursFromNow && reservationDateTime <= threeHoursFromNow) {
        console.log(`Sending reminder for reservation ${reservation.id}`);
        
        const restaurantName = (reservation.restaurants as any)?.name || 'the restaurant';
        
        // Send reminder email
        const { error: emailError } = await resend.emails.send({
          from: "DineDiscover <onboarding@resend.dev>",
          to: [reservation.email!],
          subject: `Reminder: Your reservation at ${restaurantName} is in 2 hours!`,
          html: getReminderEmailTemplate(
            reservation.name,
            restaurantName,
            new Date(reservation.reservation_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            reservation.reservation_time,
            reservation.party_size
          ),
        });
        
        if (emailError) {
          console.error(`Failed to send reminder for ${reservation.id}:`, emailError);
          continue;
        }
        
        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('reservations')
          .update({ reminder_sent: true })
          .eq('id', reservation.id);
        
        if (updateError) {
          console.error(`Failed to update reminder_sent for ${reservation.id}:`, updateError);
        } else {
          remindersSent.push(reservation.id);
          console.log(`Reminder sent successfully for reservation ${reservation.id}`);
        }
      }
    }
    
    console.log(`Completed. Sent ${remindersSent.length} reminders.`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent: remindersSent.length,
        reservationIds: remindersSent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reservation-reminders:", error);
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
