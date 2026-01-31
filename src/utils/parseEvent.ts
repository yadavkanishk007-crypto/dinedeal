import { EventWithAvailability, TicketTier } from "@/types/events";

export function parseEvent(row: any): EventWithAvailability {
  return {
    ...row,
    ticket_tiers: Array.isArray(row.ticket_tiers)
      ? row.ticket_tiers as TicketTier[]
      : typeof row.ticket_tiers === "string"
        ? JSON.parse(row.ticket_tiers)
        : [],
  };
}
