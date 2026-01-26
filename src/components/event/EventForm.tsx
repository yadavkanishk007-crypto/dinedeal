import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Users, IndianRupee, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EventFormProps {
  restaurantId: string;
  venueName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    title: string;
    description: string;
    cover_image: string;
    event_date: string;
    start_time: string;
    end_time: string;
    city: string;
    venue_name: string;
    is_paid: boolean;
    ticket_price: number;
    total_seats: number;
    booking_deadline: string;
    status: string;
  };
}

export default function EventForm({ 
  restaurantId, 
  venueName = "", 
  onSuccess, 
  onCancel,
  initialData 
}: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.cover_image || "");
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    event_date: initialData?.event_date || "",
    start_time: initialData?.start_time || "",
    end_time: initialData?.end_time || "",
    city: initialData?.city || "Jhansi",
    venue_name: initialData?.venue_name || venueName,
    is_paid: initialData?.is_paid || false,
    ticket_price: initialData?.ticket_price || 0,
    total_seats: initialData?.total_seats || 100,
    booking_deadline: initialData?.booking_deadline || "",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return initialData?.cover_image || null;

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `event-${Date.now()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    
    if (!formData.title || !formData.event_date || !formData.start_time || !formData.venue_name) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const coverImage = await uploadImage();

      const eventData = {
        created_by_id: restaurantId,
        title: formData.title,
        description: formData.description,
        cover_image: coverImage,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        city: formData.city,
        venue_name: formData.venue_name,
        is_paid: formData.is_paid,
        ticket_price: formData.is_paid ? formData.ticket_price : 0,
        total_seats: formData.total_seats,
        remaining_seats: formData.total_seats,
        booking_deadline: formData.booking_deadline || null,
        status,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;
        toast({ title: `Event ${status === 'published' ? 'published' : 'saved as draft'}` });
      }

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error saving event",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-card rounded-xl border"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {initialData?.id ? "Edit Event" : "Create New Event"}
        </h2>
        {onCancel && (
          <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="relative">
          {imagePreview ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => { setImagePreview(""); setImageFile(null); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 cursor-pointer hover:border-primary/50 transition-colors">
              <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Live Music Night"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Tell people what to expect..."
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_date">Date *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="event_date"
              type="date"
              className="pl-10"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time *</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="start_time"
              type="time"
              className="pl-10"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="end_time"
              type="time"
              className="pl-10"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking_deadline">Booking Deadline</Label>
          <Input
            id="booking_deadline"
            type="datetime-local"
            value={formData.booking_deadline}
            onChange={(e) => setFormData({ ...formData, booking_deadline: e.target.value })}
          />
        </div>
      </div>

      {/* Venue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue_name">Venue Name *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="venue_name"
              placeholder="Venue name"
              className="pl-10"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <Label htmlFor="total_seats">Total Seats *</Label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="total_seats"
            type="number"
            className="pl-10"
            value={formData.total_seats}
            onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Paid Event</Label>
            <p className="text-xs text-muted-foreground">Enable if tickets are not free</p>
          </div>
          <Switch
            checked={formData.is_paid}
            onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
          />
        </div>

        {formData.is_paid && (
          <div className="space-y-2">
            <Label htmlFor="ticket_price">Ticket Price (₹)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="ticket_price"
                type="number"
                className="pl-10"
                placeholder="0"
                value={formData.ticket_price}
                onChange={(e) => setFormData({ ...formData, ticket_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={isSubmitting}
          onClick={(e) => handleSubmit(e, 'draft')}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isSubmitting}
          onClick={(e) => handleSubmit(e, 'published')}
        >
          {isSubmitting ? "Publishing..." : "Publish Event"}
        </Button>
      </div>
    </motion.form>
  );
}