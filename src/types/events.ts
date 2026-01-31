export interface TicketTier {
  name: string;
  price: number;
  capacity: number;
}

export interface EventWithAvailability {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  city: string;
  venue_name: string;
  is_paid: boolean | null;
  ticket_price: number | null;
  booking_deadline: string | null;
  status: string | null;
  total_seats: number;
  remaining_seats: number;
  ticket_tiers: TicketTier[];
}
