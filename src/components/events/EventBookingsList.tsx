import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Booking {
  id: string;
  event_id: string;
  user_id: string;
  seats_booked: number;
  amount_paid: number;
  qr_code_hash: string;
  booking_status: string;
  checked_in_at: string | null;
  created_at: string;
  events?: {
    title: string;
    event_date: string;
  };
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface EventBookingsListProps {
  restaurantId: string;
}

export default function EventBookingsList({ restaurantId }: EventBookingsListProps) {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    
    // First get events for this restaurant
    const { data: events } = await supabase
      .from('events')
      .select('id')
      .eq('created_by_id', restaurantId);

    if (!events || events.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const eventIds = events.map(e => e.id);

    // Then get bookings for those events
    const { data, error } = await supabase
      .from('event_bookings')
      .select(`
        *,
        events (title, event_date)
      `)
      .in('event_id', eventIds)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error loading bookings", description: error.message, variant: "destructive" });
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (restaurantId) fetchBookings();
  }, [restaurantId]);

  const getStatusBadge = (status: string, checkedInAt: string | null) => {
    if (checkedInAt) {
      return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Attended</Badge>;
    }
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-blue-500/10 text-blue-500"><Clock className="w-3 h-3 mr-1" /> Confirmed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      case 'attended':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Attended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.events?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.qr_code_hash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.booking_status === 'confirmed' && !b.checked_in_at).length,
    attended: bookings.filter(b => b.checked_in_at).length,
    totalSeats: bookings.reduce((acc, b) => acc + b.seats_booked, 0),
    totalRevenue: bookings.reduce((acc, b) => acc + Number(b.amount_paid), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Bookings</div>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.totalSeats}</div>
          <div className="text-sm text-muted-foreground">Tickets Sold</div>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="text-2xl font-bold">{stats.attended}</div>
          <div className="text-sm text-muted-foreground">Checked In</div>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="text-2xl font-bold text-primary">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Revenue</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by event or booking ID..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg mb-2">No bookings yet</h3>
          <p className="text-muted-foreground text-sm">
            Bookings will appear here when customers purchase tickets
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center justify-between p-4 bg-card rounded-xl border"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{booking.events?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.seats_booked} {booking.seats_booked === 1 ? 'seat' : 'seats'} • 
                    {booking.events?.event_date && format(new Date(booking.events.event_date), " MMM d")}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(booking.booking_status, booking.checked_in_at)}
                <p className="text-sm text-muted-foreground mt-1">
                  ₹{Number(booking.amount_paid).toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}