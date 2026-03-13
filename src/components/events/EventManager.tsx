import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, MoreVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import EventForm from "./EventForm";
import type { Database } from "@/integrations/supabase/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

type EventUI = EventRow & {
  remaining_seats: number;
};

interface EventManagerProps {
  restaurantId: string;
  restaurantName?: string;
}

export default function EventManager({ restaurantId, restaurantName }: EventManagerProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventUI | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('event_with_availability')
      .select('*')
      .eq('created_by_id', restaurantId)
      .order('event_date', { ascending: true });

    if (error) {
      toast({ title: "Error loading events", description: error.message, variant: "destructive" });
    } else {
      setEvents((data as EventUI[])|| []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (restaurantId) fetchEvents();
  }, [restaurantId]);

  const handleStatusToggle = async (event: EventUI) => {
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', event.id);

    if (error) {
      toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Event ${newStatus === 'published' ? 'published' : 'unpublished'}` });
      fetchEvents();
    }
  };

  const handleDelete = async () => {
    if (!deletingEventId) return;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', deletingEventId);

    if (error) {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      fetchEvents();
    }
    setDeletingEventId(null);
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'h:mm a');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500/10 text-green-500';
      case 'draft': return 'bg-yellow-500/10 text-yellow-500';
      case 'cancelled': return 'bg-red-500/10 text-red-500';
      case 'completed': return 'bg-gray-500/10 text-gray-500';
      default: return '';
    }
  };

  if (showForm || editingEvent) {
    return (
      <EventForm
        restaurantId={restaurantId}
        venueName={restaurantName}
        initialData={editingEvent || undefined}
        onSuccess={() => {
          setShowForm(false);
          setEditingEvent(null);
          fetchEvents();
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingEvent(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Your Events</h2>
          <p className="text-sm text-muted-foreground">Create and manage events at your venue</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-bold text-lg mb-2">No events yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first event to start selling tickets
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border"
              >
                {/* Cover Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{event.title}</h3>
                    <Badge className={getStatusColor(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.event_date), "EEE, MMM d")} • {formatTime(event.start_time)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {event.remaining_seats}/{event.total_seats} seats • {event.is_paid ? `₹${event.ticket_price}` : 'Free'}
                  </p>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingEvent(event)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusToggle(event)}>
                      {event.status === 'published' ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeletingEventId(event.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEventId} onOpenChange={() => setDeletingEventId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event and all associated bookings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
